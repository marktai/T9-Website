marktai.service("GameService", ["$http", "$q", "$localStorage", "$websocket", function($http, $q, $localStorage, $websocket) {

    var ws = null;
    var defenderItems = [];
    var attackerItems = [];
    var itemsSet = false;

    this.getGame = function(gameID) {
        var infoPromise = $http.get('./api/games/' + gameID + '/info').then(function(result) {
            return $q.resolve(result.data)
        }, function(error) {
            return $q.reject(error.data)
        })

        return infoPromise;
    }

    this.getGameSections = function(gameID) {
        var sectionPromise = $http.get('./api/games/' + gameID + '/info').then(function(result) {
            return $q.resolve(result.data["sections"])
        }, function(error) {
            return $q.reject(error.data)
        })
        return sectionPromise;
    }

    this.makeMove = function(gameID, player, section) {
        var urlWithoutT9 = '/games/' + gameID + '/players/' + player + '/move';

        var url = './api' + urlWithoutT9;

        var data = {
            'move_type': 'move_section',
            'destination_id': section,
        };
        return $http.post(url, data).then(function(result) {
            return $q.resolve(result);
        }, function(error) {
            return $q.reject(error.data);
        })
    }

    this.doubleDown = function(gameID, player) {
        var urlWithoutT9 = '/games/' + gameID + '/players/' + player + '/move';

        var url = './api' + urlWithoutT9;

        var data = {
            'move_type': 'double_down',
        };
        return $http.post(url, data).then(function(result) {
            return $q.resolve(result);
        }, function(error) {
            return $q.reject(error.data);
        })
    }

    this.initws = function(gameid, open, close, change, chat) {
        ws = $websocket.$new({
            'url': 'ws://54.69.24.69/game/api/games/' + gameid + "/ws",
            'protocols': [],
            'subprotocols': ['base46']
        }); // instance of ngWebsocket, handled by $websocket service

        ws.$on('$open', function() {
            open();
        });

        ws.$on('$close', function() {
            close();
            ws.$close();
        });

        ws.$on('Change', function(data) {
            change(data);
        })

        ws.$on('Chat-Server-Send', function(data) {
            chat(data);
        })

    }

    this.sendChat = function(username, text, channel) {
        if (typeof(ws) === "null") {
            throw "ws is not yet opened";
        }
        var data = {
            'username': username,
            'text': text,
            'channel': channel, 
        };
        ws.$emit('Chat-Client-Send', data);
    }

    this.makeGame = function() {
        var urlWithoutT9 = '/games';
        var url = './api' + urlWithoutT9;
        return $http.post(url).then(function(result) {
            return $q.resolve(result.data["id"]);
        }, function(error) {
            return $q.reject(error.data);
        })
    }

    this.addPlayer = function(gameID, playerName, isAttacker, item, section) {
        var urlWithoutT9 = '/games/' + gameID + '/players';
        var data = {
            'name': playerName,
            'is_attacker': isAttacker,
            'section_id': section,
            'item_id': item,
        };
        var url = './api' + urlWithoutT9;
        return $http.post(url, data).then(function(result) {
            return $q.resolve(result.data["player_id"]);
        }, function(error) {
            return $q.reject(error.data);
        })
    }

    this.resetHealth = function(gameID) {
        var urlWithoutT9 = '/games/' + gameID + '/resetHealth';
        var url = './api' + urlWithoutT9;
        return $http.post(url).then(function(result) {
            return $q.resolve();
        }, function(error) {
            return $q.reject(error.data);
        })
    }

    this.getAttackerItems = function() {
        if (itemsSet) {
            return $q.resolve(attackerItems);
        }

        return $http.get('./api/items').then(function(result) {
            attackerItems = result.data['attacker_items'];
            defenderItems = result.data['defender_items'];
            itemsSet = true;
            return $q.resolve(attackerItems);
        }, function(error) {
            return $q.resolve(error.data);
        });
    }

    this.getDefenderItems = function() {
        if (itemsSet) {
            return $q.resolve(defenderItems);
        }

        return $http.get('./api/items').then(function(result) {
            console.log(result.data);
            attackerItems = result.data['attacker_items'];
            defenderItems = result.data['defender_items'];
            console.log(defenderItems);
            itemsSet = true;
            return $q.resolve(defenderItems);
        }, function(error) {
            return $q.resolve(error.data);
        });
    }


}])
