marktai.controller("RegisterCtl", ["$scope", "$rootScope", "$http", "$location", "$sce", "$q", "$websocket", "$window", "$localStorage", "vcRecaptchaService",  function($scope, $rootScope, $http, $location, $sce, $q, $websocket, $window, $localStorage, vcRecaptchaService) {
	$rootScope.page = "register";
	
	$scope.username = '';
	$scope.password = '';
	$scope.verify_password = '';

	$scope.out = '';
	$scope.gRecaptcha = {}
	$scope.gRecaptcha.response = null
	$scope.widgetId = null;


	var register = function(username, pass, recaptchaResponse) {
		var creds = {"User":username, "Password":pass, "Recaptcha":recaptchaResponse};
		return $http.post('/T9/users?Secret=thisisatotallysecuresecret', creds).then(function(result){ 
			return $q.resolve(result.data["UserID"]);
		}, function(error){
			var errText = error.data["Error"]
			return $q.reject(errText)
		});
	}

	$scope.register = function() {
		var retPromise
		if ($scope.gRecaptcha.response === null || typeof($scope.gRecaptcha.response) === "undefined") {
			retPromise = $q.reject("Please complete the reCAPTCHA")
		}
		else if ($scope.password == $scope.verify_password) {
			retPromise = register($scope.username, $scope.password, $scope.gRecaptcha.response)
		}
		else {
			retPromise = $q.reject("Passwords do not match")
		}
		retPromise.then(function(userID){
			$scope.out = "User successfully created with user ID " + userID
			// login(username, password)	
		}, function(error) {
			if (error == "User already made") {
				$scope.out = "Username \"" + $scope.username + "\" already taken"
			} else {
				$scope.out = error
			}
		})
		$scope.password = '';
		$scope.verify_password = '';
		$scope.resetRecaptcha();
		return retPromise
	}	

	$scope.setWidgetId = function (widgetId) {
		$scope.widgetId = widgetId;
	};

	$scope.resetRecaptcha = function() {
		vcRecaptchaService.reload($scope.widgetId);
		$scope.response = null;
	};

	$scope.cbExpiration = function() {
		$scope.resetRecaptcha();
		$scope.$apply();
	}


}])
