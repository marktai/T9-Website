marktai.controller("ProfileCtl", ["$scope", "$rootScope", "$q", "$location", "LoginService", "GameService", function($scope, $rootScope, $q, $location, LoginService, GameService) {
    $rootScope.page = "login";

    $scope.games = [];

    $scope.myTurnGames = [];
    $scope.opponentTurnGames = [];
    $scope.doneGames = [];

    $scope.opponents = {};

    $scope.player2 = "";

    $scope.registered = true;
    
    $scope.getUserGames = function() {
        $scope.games = [];
        $scope.myTurnGames = [];
        $scope.opponentTurnGames = [];
        $scope.doneGames = [];
        GameService.getUserGames($rootScope.userid, $rootScope.secret).then(function(games) {
            $scope.games = games
            if ($scope.games.length != 0) {
                for (var game of games) {

                    // closure used to keep game in scope
                    var _ = function(game) {
                        GameService.getOpponentAndTurn(game, $rootScope.username).then(function(opponentAndTurn) {
                            $scope.opponents[game] = opponentAndTurn[0];
                            if (opponentAndTurn[1] == 0) {
                                $scope.myTurnGames.push(game);
                            } else if (opponentAndTurn[1] == 1) {
                                $scope.opponentTurnGames.push(game);
                            } else if (opponentAndTurn[1] == 2) {
                                $scope.doneGames.push(game);
                            }
                        }, function(error) {
                            console.log(error);
                            $scope.out = error;
                        })
                    }

                    _(game);
                }
            }
        }, function(error) {
            $scope.out = error;
        })
    }

    $scope.makeGame = function() {
        GameService.makeGame($rootScope.userid, $scope.player2, $rootScope.secret).then(function(gameID) {
            $scope.gameID = gameID
            $scope.getUserGames()
        }, function(error) {
            $scope.out = error
        })
    }

    $rootScope.checkLogin().then(
        function(creds) {
            $scope.checkRegistered();
            $scope.getUserGames();
        },
        function(error) {
            $rootScope.sendToLogin();
        }
    )

}])