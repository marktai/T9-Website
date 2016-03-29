var defaultPage = "login";

var marktai = new angular.module("marktai", ["ngTouch","ngResource", 'ngRoute', "ngSanitize", "ngWebsocket", "ngStorage", 'vcRecaptcha']);


// Sets up default page to be login and redirects every other one to 
marktai.config(function($routeProvider, $locationProvider) {
  $routeProvider

    .when('/404', {
      templateUrl : './pages/404/404.html',
      controller : "404Ctl"
    })

    .when('/game',{

      templateUrl : './pages/game/game.html',
      controller : "GameCtl"

    })
	.when('/login', {
			templateUrl : './pages/login/login.html',
			controller : 'LoginCtl',
	})

	.when('/register', {
			templateUrl : './pages/register/register.html',
			controller : 'RegisterCtl',
	})


    // causes no path to go to default page
    .when('', {
      redirectTo : function () {
        console.log("empty")
        return "/" + defaultPage
      }
    })
    .when('/', {
      redirectTo : function () {
        console.log("empty")
        return "/" + defaultPage
      }
    })


    // causes unrecognized path to go to default page
    // redirects to login if not logged in
    .otherwise({
      redirectTo : function (a, b, c) {
        return "/404#"+b;
      }
    })

    // $locationProvider.html5Mode(true);

});


// enables attribute ng-enter which calls a function when enter is pressed
marktai.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
 
                event.preventDefault();
            }
        });
    };
});


marktai.directive('resize', function ($window) {
    return function (scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {
                'h': w.height(),
                'w': w.width()
            };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;

            scope.style = function () {
                return {
                    'height': (newValue.h - 100) + 'px',
                        'width': (newValue.w - 100) + 'px'
                };
            };

        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
})

// inject the $resource dependency here
marktai.controller("MainCtl", ["$scope", "$rootScope", "$resource", "$location",  function($scope, $rootScope, $resource, $location){

  $rootScope.info = "";
  $rootScope.error = "";
  $rootScope.infoDiv = "";
  $rootScope.firstHit = true;
  $rootScope.oldPage = "";

  // does nothing if on a page besides login
  // if on login, sends to default page
  $rootScope.SendToPage = function() {
    page = $rootScope.oldPage;
    hash = $rootScope.oldHash;
    if ($rootScope.page == "login") {
      $rootScope.page = page;
      $location.path(page);
      $rootScope.info = "";
      // console.log("reset in sendtopage")
      $location.hash(hash);
    }

  }

  // returns path==viewlocation
  $rootScope.isActive = function (viewLocation) { 
    return viewLocation === $location.path();
  }

  // returns true if there is a user in local storage
  // user is cleared whenever logged out
  $rootScope.loggedIn = function () {
    return localStorage.getItem('User') !== null;
  }

  // returns input if logged in
  // used to disable the links
  $rootScope.ifLoggedIn = function (str){
    if ($rootScope.loggedIn()) return str;
    return "";
  }

 

}]);
