marktai.controller("LoginCtl", ["$scope", "$rootScope", "$q", "$location", "LoginService", "GameService", function($scope, $rootScope, $q, $location, LoginService, GameService) {
    $rootScope.page = "login";

    $scope.password = '';

    $scope.out = '';
    $scope.userid = -1;
    $scope.secret = '';

    $scope.games = [];

    $scope.myTurnGames = [];
    $scope.opponentTurnGames = [];
    $scope.doneGames = [];

    $scope.opponents = {};


    $scope.player2 = "";


    $scope.login = function() {
        var temp = $scope.password;
        $scope.games = [];
        $scope.myTurnGames = [];
        $scope.opponentTurnGames = [];
        $scope.doneGames = [];
        $scope.password = '';
        $rootScope.password = temp;
        $rootScope.login().then(function(creds) {
            $rootScope.sendFromLogin();
        });
    }

    $scope.verifySecret = function() {
        LoginService.verifySecret($rootScope.username, $scope.secret).then(function(creds) {
            $scope.userid = creds["UserID"]
            $scope.secret = creds["Secret"]
        }, function(error) {
            $scope.out = "Verification failed.";
        });
    }

    $scope.populateScope = function() {
        LoginService.checkLocalStorageLogin().then(function(creds) {
            $rootScope.username = creds["Username"];
            $scope.secret = creds["Secret"];
            $scope.userid = creds["UserID"]
            $rootScope.sendFromLogin();
        }, function(error) {})
    }
    
    $scope.populateScope()

}])