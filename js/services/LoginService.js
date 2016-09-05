marktai.service("LoginService", ["$http", "$q", "$localStorage", function($http, $q, $localStorage) {

    this.login = function(username, pass, stayLoggedIn) {
        var creds = {
            "User": username,
            "Password": pass,
            "StayLoggedIn": stayLoggedIn + "", // needs to be string
        };
        return $http.post('/T9/auth/login', creds).then(function(result) {
            var data = result.data;
            var storedCreds = {
                'Username': username, // user might change the box in the meantime
                'Secret': data['Secret'],
                'Expiration': data['Expiration'],
                'UserID': data['UserID'],
            }
            $localStorage["credentials"] = storedCreds;

            return $q.resolve(storedCreds)
        }, function(error) {
            return $q.reject(error["Error"])
        });
    }

    this.logout = function(userID, secret) {
        delete $localStorage["credentials"];
		
		if (typeof(userID) !== 'undefined' && typeof(secret) !== 'undefined') {
			var urlWithoutT9orAuth = '/logout';
			var config = {
				'headers': this.genAuthHeaders(urlWithoutT9orAuth, secret),
			}
			config['headers']['UserID'] = userID;
			config['headers']['Path'] = urlWithoutT9orAuth;
			var body = {
				'UserID' : userID,
			}
			return $http.post('/T9/auth' + urlWithoutT9orAuth, body, config).then(function(result) {
				return $q.resolve('')
			}, function(error) {
				return $q.reject(error["Error"])
			});
		} else {
			return $q.resolve('');
		}
   }

    this.loggedIn = function() {
        return typeof($localStorage["credentials"]) !== "undefined";
    }

    this.verifySecret = function(user, secret) {
        var creds = {
            "User": user,
            "Secret": secret,
        };
        return $http.post('/T9/auth/verifySecret', creds).then(function(result) {
            var data = result.data;
            // $scope.out = "Verified| ID: " + $scope.userid + "| Secret: " + $scope.secret;
            return $q.resolve(data["UserID"]);
        }, function(error) {
            return $q.reject("Unverified");
        });
    }

    this.checkLocalStorageLogin = function() {
        if (typeof($localStorage["credentials"]) !== 'undefined') {
            var storedCreds = $localStorage["credentials"];
            if ((new Date).getTime() < (new Date(storedCreds['Expiration'])).getTime()) {
                var logout = this.logout;
                return this.verifySecret(
                    $localStorage["credentials"]["Username"],
                    $localStorage["credentials"]["Secret"]
                ).then(function(result) {
                    return $q.resolve(storedCreds);
                }, function(error) {
                    logout();
                    return $q.reject(error);
                })
            } else {
                this.logout();
            }
        }
        return $q.reject("No stored credentials");
    }

    this.genAuthHeaders = function(urlWithoutT9, secret, userID) {
        var time = Math.floor(Date.now() / 1000);
        var message = time + ":" + urlWithoutT9;
        var hash = CryptoJS.HmacSHA256(message, secret);
        var headers = {
            'Path': urlWithoutT9,
            'HMAC': hash,
            'Encoding': 'hex',
            'Time-Sent': time,
        };
        if (typeof(userID) !== 'undefined') {
            headers['UserID'] = userID;
        }
        return headers
    }


    this.register = function(username, pass, email, recaptchaResponse) {
        var creds = {
            "User": username,
            "Password": pass,
            "Email": email,
            "Recaptcha": recaptchaResponse
        };
        return $http.post('/T9/auth/users?Secret=thisisatotallysecuresecret', creds).then(function(result) {
            return $q.resolve(result.data["UserID"]);
        }, function(error) {
            var errText = error.data["Error"]
            return $q.reject(errText)
        });
    }

    this.checkRegistered = function(userID, secret) {
        var urlWithoutT9 = '/users/' + userID + '/registered'
        var data = {};
        var config = {
            'headers': this.genAuthHeaders(urlWithoutT9, secret, userID), 
        }
        return $http.get('/T9/auth' + urlWithoutT9, config).then(function(result){
            return $q.resolve(result.data["Registered"]);
        }, function(error) {
            return $q.reject(error.data["Error"]);
        });
    }

}])
