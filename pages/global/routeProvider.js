
// Sets up default page to be login and redirects every other one to 
marktai.config(function($routeProvider, $locationProvider) {
    $routeProvider

    .when('/404', {
        templateUrl: './pages/404/404.html',
        controller: "404Ctl"
    })

    .when('/game', {

        templateUrl: './pages/game/game.html',
        controller: "GameCtl",
//        reloadOnSearch: false,

    })
    .when('/login', {
        templateUrl: './pages/login/login.html',
        controller: 'LoginCtl',
    })

    .when('/register', {
        templateUrl: './pages/register/register.html',
        controller: 'RegisterCtl',
    })

    .when('/profile', {
        templateUrl: './pages/profile/profile.html',
        controller: 'ProfileCtl',
    })

    // causes no path to go to default page
    .when('', {
        redirectTo: function() {
            return "/" + defaultPage
        }
    })
    .when('/', {
        redirectTo: function() {
            return "/" + defaultPage
        }
    })


    // causes unrecognized path to go to default page
    // redirects to login if not logged in
    .otherwise({
        redirectTo: function(a, b, c) {
            return "/404#" + b;
        }
    })

    // $locationProvider.html5Mode(true);
});
