var defaultPage = "game";

var marktai = new angular.module("marktai", ["ngTouch", "ngResource", 'ngRoute', "ngSanitize", "ngWebsocket", "ngStorage", 'vcRecaptcha', 'luegg.directives', 'ngAudio', 'timer']);

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
    $rootScope.faviconLink = "/mark/assets/img/favicon.png";

	if($window.opener) {
		console.log($window.opener);
		// $window.opener.location = "https://reddit.com/r/ooerintensifies";
	}

}]);
