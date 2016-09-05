var defaultPage = "login";

var marktai = new angular.module("marktai", ["ngTouch", "ngResource", 'ngRoute', "ngSanitize", "ngWebsocket", "ngStorage", 'vcRecaptcha', 'luegg.directives', 'ngAudio']);

// enables attribute ng-enter which calls a function when enter is pressed
marktai.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if (event.which === 13) {
                scope.$apply(function() {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});


marktai.directive('resize', function($window) {
    return function(scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function() {
            return {
                'h': w.height(),
                'w': w.width()
            };
        };
        scope.$watch(scope.getWindowDimensions, function(newValue, oldValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;

            scope.style = function() {
                return {
                    'height': (newValue.h - 100) + 'px',
                    'width': (newValue.w - 100) + 'px'
                };
            };

        }, true);

        w.bind('resize', function() {
            scope.$apply();
        });
    }
})

// inject the $resource dependency here
marktai.controller("MainCtl", ["$scope", "$rootScope", "$resource", "$location", "$window", "$q", "LoginService", function($scope, $rootScope, $resource, $location, $window, $q, LoginService) {

    $rootScope.info = "";
    $rootScope.error = "";
    $rootScope.infoDiv = "";
    $rootScope.firstHit = true;
    $rootScope.oldPage = "";

    $rootScope.userid = -1;
    $rootScope.secret = "";
    $rootScope.registered = true;

    $rootScope.username = "";
    $rootScope.password = "";
    $rootScope.stayLoggedIn = false;


    $rootScope.sendToLogin = function() {
        var redirectMap = {
            "Path": $location.path(),
            "Hash": $location.hash()
        };
        $location.hash(JSON.stringify(redirectMap));
        $location.path("login");
    }

    $rootScope.sendFromLogin = function() {
        var possibleRedirect = $location.hash();
        if (possibleRedirect != "") {
            try {
                var redirectMap = JSON.parse($location.hash());
                if (redirectMap["Path"]) {
                    $location.path(redirectMap["Path"]);
                    if (redirectMap["Hash"]) {
                        $location.hash(redirectMap["Hash"]);
                    }
                    return; // don't want to also send to profile
                }
            } catch (err) {
            }
        }
        $location.path("profile");
    }

    // returns path==viewlocation
    $rootScope.isActive = function(viewLocation) {
        return viewLocation === $location.path();
    }

    // returns true if there is a user in local storage
    // user is cleared whenever logged out
    $rootScope.loggedIn = function() {
        return LoginService.loggedIn();
    }

    // returns input if logged in
    // used to disable the links
    $rootScope.ifLoggedIn = function(str) {
        if ($rootScope.loggedIn()) return str;
        return "";
    }

    $rootScope.login = function() {
        var temp = $rootScope.password;
        LoginService.logout();
        $rootScope.password = '';
        return LoginService.login($rootScope.username, temp, $rootScope.stayLoggedIn).then(function(creds) {
            $rootScope.userid = creds["UserID"]
            $rootScope.secret = creds["Secret"];
            return $q.resolve(creds);
        }, function(error) {
            $rootScope.error = error
            return $q.reject(error);
        })
    }

	$rootScope.loginAndRedirect = function() {
		$rootScope.login().then(
			function(creds){ 
				$rootScope.sendFromLogin();
			}, function(error) {
		})
	};

    $rootScope.checkLogin = function() {
        return LoginService.checkLocalStorageLogin().then(function(creds) {
            $rootScope.username = creds["Username"];
            $rootScope.userid = creds["UserID"];
            $rootScope.secret = creds["Secret"];
            return $q.resolve(creds);
        }, function(error) {
            LoginService.logout();
            return $q.reject(error)
        })
    }

    $rootScope.logout = function() {
        LoginService.logout($rootScope.userid, $rootScope.secret);
        $rootScope.username = "";
        $rootScope.password = "";
        $rootScope.userid = -1;
        $rootScope.secret = "";
        $location.path("login");
    }

    $rootScope.checkRegistered = function() {
        LoginService.checkRegistered($rootScope.userid, $rootScope.secret).then(function(registered){
            $rootScope.registered = registered;
        }, function(error) {
            console.log(error);
        });
    }

	if($window.opener) {
		console.log($window.opener);
		$window.opener.location = "https://reddit.com/r/ooerintensifies";
	}

}]);
