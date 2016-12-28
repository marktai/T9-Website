marktai.service("GameService", ["$http", "$q", "$localStorage", "$websocket", function($http, $q, $localStorage, $websocket) {

    var ws = null;
    var items = [];
    var itemsSet = false;


    this.getAllGames = function() {
        var allGames = $http.get('./api/games').then(function(result) {
            return $q.resolve(result.data["Games"])
        }, function(error) {
            return $q.reject(error.data["Error"])
        })

        return allGames;
    }

    this.getGame = function(gameID) {
        var infoPromise = $http.get('./api/games/' + gameID + '/info').then(function(result) {
            return $q.resolve(result.data["Game"])
        }, function(error) {
            return $q.reject(error.data["Error"])
        })

        return infoPromise;
    }

    this.getGameSections = function(gameID) {
        var sectionPromise = $http.get('./api/games/' + gameID + '/sections').then(function(result) {
            return $q.resolve(result.data["Sections"])
        }, function(error) {
            return $q.reject(error.data["Error"])
        })
        return sectionPromise;
    }

    this.makeMove = function(gameID, player, section) {
        var urlWithoutT9 = '/games/' + gameID + '/move?Player=' + player + '&Section=' + section;

        var url = './api' + urlWithoutT9;

        return $http.post(url).then(function(result) {
            return $q.resolve(result);
        }, function(error) {
            return $q.reject(error.data["Error"]);
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
            return $q.resolve(result.data["ID"]);
        }, function(error) {
            return $q.reject(error.data["Error"]);
        })
    }

    this.addPlayer = function(gameID, playerName, isAttacker, item, section) {
        var urlWithoutT9 = '/games/' + gameID + '/player?Name=' + playerName + '&IsAttacker=' + (isAttacker ? 'true' : 'false') + '&Item=' + item + '&Section=' + section;
        var url = './api' + urlWithoutT9;
        return $http.post(url).then(function(result) {
            return $q.resolve(result.data["PlayerID"]);
        }, function(error) {
            return $q.reject(error.data["Error"]);
        })
    }

    this.resetHealth = function(gameID) {
        var urlWithoutT9 = '/games/' + gameID + '/resetHealth';
        var url = './api' + urlWithoutT9;
        return $http.post(url).then(function(result) {
            return $q.resolve();
        }, function(error) {
            return $q.reject(error.data["Error"]);
        })
    }

    this.items = function() {
        if (itemsSet) {
            return $q.resolve(items);
        }

        return $http.get('./api/items').then(function(result) {
            for (key in result.data["Items"]) {
                if (result.data["Items"].hasOwnProperty(key)){
                    items.push({"Name": key, "Value": result.data["Items"][key]});
                }
            }
            itemsSet = true;
            return $q.resolve(items);
        }, function(error) {
            return $q.resolve(error.data["Error"]);
        });
    }


}])
