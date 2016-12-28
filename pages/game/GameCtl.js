marktai.controller("GameCtl", ["$scope", "$rootScope", "$http", "$location", "$sce", "$q", "$websocket", "$window", "$timeout", 'ngAudio', "GameService", "LoginService", "AIService", function($scope, $rootScope, $http, $location, $sce, $q, $websocket, $window, $timeout, ngAudio, GameService, LoginService, AIService) {
    $rootScope.page = "game";

    $scope.playerName = '';
    $scope.isAttackerInput = false;
    $scope.sectionInput = 1;
    $scope.itemInput = 0;
    $scope.itemTupleInput = {};

    $scope.items = {};
    GameService.items().then(function(items){
        $scope.items = items;
        $scope.itemTupleInput = {"Name": "Default", "Value": 0};
    }, function(error){
        console.log(error);
    });

    $scope.playerId = -1;

    $scope.player = {};

    $scope.gameId = 1;
    $scope.gameTime = 0;

    $scope.gameData = {};
    $scope.sections = {};

    $scope.moveSection = 1;

    $scope.actionTime = -1;
    $scope.flashTime = -1;

    $scope.chatbox = "";
    $scope.chats = [];
    var notificationSound = null;
    $scope.muted = false;
    $scope.focused = true;
    $scope.newChatName = "";

    $scope.chatTitle = "";
    $scope.oldTitle = "King of the Hill";
    $scope.newTitle = "";
    $scope.title = $scope.oldTitle;
    
    $scope.oldFaviconLink = $rootScope.faviconLink;
    $scope.alertFaviconLink = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Disc_Plain_red.svg/2000px-Disc_Plain_red.svg.png";


    $scope.channels = {
        "All": "0",
        "Defenders": "1",
        "Attackers": "2",
    }
    
    $scope.selectedChannel = $scope.channels["All"];
    $scope.defaultChannelSet = false;


    var websocketInitialized = false;

    $scope.getGame = function() {
        return GameService.getGame($scope.gameId).then(function(gameData) {
            $scope.gameData = gameData;
            return $q.resolve();
        }, function(error) {
            $scope.error = error;
            return $q.reject();
        });
    }

    $scope.getGameSections = function() {
        return GameService.getGameSections($scope.gameId).then(function(sections) {
            $scope.sections = sections;
            return $q.resolve();
        }, function(error) {
            $scope.error = error;
            return $q.reject();
        });
    }

    var parseDateToMillis = function(dateString) {
        return (new Date(dateString)).getTime() + 1000;
    }

    $scope.refresh = function() {
        var oldHealth = $scope.gameData['Health'];
        $scope.gameData = {};
        $scope.getGame().then(function(success){
            if ($scope.playerId > 0) {
                $scope.player = $scope.gameData['Players']['' + $scope.playerId];
                $scope.actionTime = parseDateToMillis($scope.player['NextAction']);
                $scope.flashTime = parseDateToMillis($scope.player['NextFlash']);
                angular.element(document.querySelector('#actionTime'))[0].resume();
                /*console.log(angular.element(document.querySelector('#actionTime'))[0]);
                console.log($scope.actionTime - (new Date()).getTime());
                console.log($scope.flashTime - (new Date()).getTime());*/
                angular.element(document.querySelector('#flashTime'))[0].resume();
                
                if (!$scope.player['IsAttacker'] && oldHealth > $scope.gameData['Health']){
                    $scope.startTitleFlash("Taking Damage!");
                }

                if (!$scope.defaultChannelSet) {
                    $scope.selectedChannel = ($scope.player['IsAttacker'] ? $scope.channels['Attackers'] : $scope.channels['Defenders']);
                    $scope.defaultChannelSet = true;
                }

            }
            if ($scope.gameData['Health'] == 0) {
                $scope.gameTime = new Date($scope.gameData['Ended']) - new Date($scope.gameData['Started']);
            } else {
                $scope.gameTime = new Date() - new Date($scope.gameData['Started']);
            }
        }, function(error){
            ;
        })
        $scope.getGameSections();

        if (!websocketInitialized) {
            GameService.initws(
                $scope.gameId,
                function(data) {
                    console.log("websocket opened");
                }, // open
                function(data) {
                    console.log("websocket closed");
                    websocketInitialized = false;
                }, // close
                function(data) {
                    /*console.log("game updated due to websocket update")*/
                    $scope.refresh();
                }, // change
                function(chat) {
                    try {
                        var channel = chat['channel'];
                        if (typeof(channel) === 'undefined' ||
                            channel == $scope.channels['All'] ||
                            ($scope.player['IsAttacker'] && channel == $scope.channels['Attackers']) ||
                            (!$scope.player['IsAttacker'] && channel == $scope.channels['Defenders'])
                        ){
                            $scope.chats.push(chat);
                            $scope.$apply()
                            console.log('Receive chat data: ' + JSON.stringify(chat));
                            if (chat["username"] !== $scope.username) {
                                if (notificationSound && !$scope.muted) {
                                    notificationSound.play();
                                }
                            }

                            if (!$scope.focused) {
                                $scope.newChatName = chat["username"];
                                $scope.startTitleFlash($scope.newChatName + " messaged you");
                            }
                        } else {
                            console.log('Ignored chat data: ' + JSON.stringify(chat));
                        }

                    } catch (error) {
                        console.log('Receive chat error: ' + error);
                    }
                } // chat
            );
            websocketInitialized = true;
        } 
    }

    $scope.updateHashWithRegister = function() {
        var settings = {
            'gameId': $scope.gameId,
            'playerName': $scope.playerName,
            'section': $scope.sectionInput,
            'item': $scope.itemTupleInput.Value,
            'isAttacker': $scope.isAttackerInput,
        }

        $location.hash(JSON.stringify(settings));
    }


    $scope.registerPlayer = function() {
        $scope.error = '';

        return $scope.getGame().then(function(success){
            var playerAlreadyInGame = false;
            if ($scope.gameData && $scope.gameData['Players']) {
                for (var key in $scope.gameData['Players']) {
                    if (!$scope.gameData['Players'].hasOwnProperty(key)) {
                        continue;
                    }

                    if ($scope.gameData['Players'][key].Name == $scope.playerName) {
                        playerAlreadyInGame = true;
                        $scope.playerId = $scope.gameData['Players'][key]['ID'];
                        break;
                    }
                }
            }

            if (!playerAlreadyInGame) {
                GameService.addPlayer(
                    $scope.gameId, 
                    $scope.playerName,
                    $scope.isAttackerInput,
                    $scope.itemInput,
                    $scope.sectionInput
                ).then(function(playerId){
                    $scope.playerId = playerId;
                    return $scope.refresh();
                }, function(error){ 
                    console.log(error);
                    $scope.error = error;
                    return $q.reject(error);
                });
            } else {
                return $scope.refresh();
            }

        }, function(error) {
            $scope.error = error;
            return $q.reject(error);
        })

    }

    $scope.resetHealth = function() {
        GameService.resetHealth($scope.gameId).then(
            function(success){},
            function(error){
                $scope.error = error;
                return $q.reject(error)
            }
        );
    }

    $scope.makeMove = function(section) {
        $scope.error = '';
        return GameService.makeMove($scope.gameId, $scope.playerId, section).then(function(result) {
            // automatically updates on change with ws
            $scope.refresh();
            return $q.resolve(result);
        }, function(error) {
            $scope.error = error
            return $q.reject(error)
        });
    }

    $scope.sendChat = function() {
        if ($scope.chatbox) {
            try {
                GameService.sendChat($scope.playerName, $scope.chatbox, $scope.selectedChannel);
                $scope.chatbox = "";
            } catch (err) {
                console.log(err);
            }
        }
    }

    var setHash = function() {
        var settings = {
            'gameId': $scope.gameId,
            'playerName': $scope.player['Name'],
            // 'section': $scope.player['Section'],
            'isAttacker': $scope.player['IsAttacker']
        }

        $location.hash(JSON.stringify(settings));
    }

    $scope.populateScope = function() {
        if ($location.hash()) {
            try {
                var s = JSON.parse($location.hash())
                $scope.gameId = s['gameId'];
                $scope.playerName = s['playerName'];
                $scope.sectionInput = s['section'];
                if (!s['section']) {
                    $scope.sectionInput = 1;
                }
                $scope.isAttackerInput = s['isAttacker'];
                $scope.itemInput = s['item'];
                if (typeof(s['item']) === 'undefined') {
                    $scope.item = 0;
                }
                $scope.registerPlayer();
            } catch (e) {
                console.log("bad settings from hash")
                return $q.reject();
            }
        }
        return $q.resolve();
    }

    $scope.startTitleFlash = function(flashText) {
        if (!$scope.focused) {
            $scope.newTitle = flashText;
            showNewTitle();
            $rootScope.faviconLink = $scope.alertFaviconLink; 
        }
    }

    var showNewTitle = function() {
        if (!$scope.focused) {
            $scope.title = $scope.newTitle; 
            $timeout(showOldTitle, 3000);
        }
    }

    var showOldTitle = function() {
        if (!$scope.focused) {
            $scope.title = $scope.oldTitle;
            $timeout(showNewTitle, 3000);
        }
    }

    angular.element($window).bind('focus', function() {
        $scope.focused = true;
        $scope.newChatName = "";
        $scope.title = $scope.oldTitle;
        $rootScope.faviconLink = $scope.oldFaviconLink;
        $scope.refresh();
    }).bind('blur', function() {
        $scope.focused = false;
    });

    // notificationSound = ngAudio.load("/sound/notification.mp3")

    $scope.populateScope();


}])
