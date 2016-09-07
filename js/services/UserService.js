marktai.service("UserService", ["$http", "$q", "LoginService", function($http, $q, LoginService) {

    this.getUserIDs = function(usernames, secret, userID) {
        console.log(userID);
        var urlWithoutT9 = '/users/getID?usernames=' + usernames.join();

        var url = '/T9/auth' + urlWithoutT9;
        var config = {
            'headers': LoginService.genAuthHeaders(urlWithoutT9, secret, userID)
        };

        return $http.get(url, config).then(function(result) {
            return $q.resolve(result.data["UserIDs"]);
        }, function(error) {
            return $q.reject(error.data["Error"]);
        })
    }
}])