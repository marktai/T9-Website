marktai.controller("GameCtl", ["$scope", "$rootScope", "$http", "$location", "$sce", "$q", "$websocket", "$window", "$localStorage", function($scope, $rootScope, $http, $location, $sce, $q, $websocket, $window, $localStorage) {
	$rootScope.page = "game";
	
	$scope.username = '';
	$scope.password = '';

	$scope.out = '';
	$scope.userid = -1;
	$scope.secret = '';
	$scope.expiration = '';


	$scope.gameid = $location.hash()

	$scope.gameData = {}
    $scope.board = ""
    $scope.boardArray = []

    $scope.players = []
    $scope.boxes = []
    $scope.squares = []

    $scope.boxSize = 50;
    $scope.spaces = 8;

    $scope.myTurn = false;
    $scope.whoseTurn = "";

    $scope.selectedBox = [-1, -1];

    $scope.$storage = $localStorage;



    for (var i = 0; i < 9; i++) {
		var box = {
			'Owned' : 0,
			'Squares': []
		};
    	for (var j = 0; j < 9; j++) {
    		box['Squares'].push(0);
    	}
    	$scope.boardArray.push(box)
    	$scope.boxes.push('' + i)
    	$scope.squares.push('' + i)
    }

    $scope.player = ''
    $scope.box = $scope.boxes[0]
    $scope.square = $scope.squares[0]

    var xImg;
    var oImg; 
    var tealxImg;
    var redoImg; 


	var login = function(username, pass) {
		var creds = {"User":username, "Password":pass};
		$http.post('/T9/login', creds).then(function(result){ 
			var data = result.data;
			$scope.userid = data['UserID'];
			$scope.secret = data['Secret'];
			$scope.expiration = data['Expiration']
			$scope.out = "ID: " + $scope.userid + "| Secret: " + $scope.secret;

			var storedCreds = {
				'Username': username, // user might change the box in the meantime
				'Secret': data['Secret'],
				'Expiration': data['Expiration'],
				'UserID' : data['UserID'],
			}


			$localStorage["credentials"] = storedCreds;

			getUserGames(data['UserID'])
			$scope.getGame();
		}, function(error){
			$scope.out = "Login failed.";
		});
	}


	var verifySecret = function(user, secret) {
		var creds = {"User":user, "Secret":secret};
		return $http.post('/T9/verifySecret', creds).then(function(result){ 
			var data = result.data;
			$scope.userid = data['UserID'];
			$scope.secret = data['Secret'];
			$scope.out = "Verified| ID: " + $scope.userid + "| Secret: " + $scope.secret;
			return $q.resolve(data["UserID"]);
		}, function(error){
			$scope.out = "Verification failed.";
			return $q.reject("Unverified");
		});
	}

	var checkLocalStorageLogin = function() {
		if (typeof($localStorage["credentials"]) !== 'undefined') {
			var storedCreds = $localStorage["credentials"];
			if ((new Date).getTime() < (new Date(storedCreds['Expiration'])).getTime()) {
				verifySecret($localStorage["credentials"]["Username"], $localStorage["credentials"]["Secret"]).then(function(result){
					$scope.username = storedCreds['Username'];
					$scope.secret = storedCreds["Secret"];
					$scope.expiration = storedCreds["Expiration"];
					$scope.userid = storedCreds["UserID"];
					$scope.getGame();
				}, function(error){
					delete $localStorage["credentials"];
				})
			}
		}
	}

	var getGame = function(gameID) {
		$http.get('/T9/games/' + gameID + '/string').then(function(result){ 
			$scope.board = ""
			var boardArray = result.data["Board"]
            for (line of boardArray) {
                $scope.board += line + "\n"
            }
		})
		$http.get('/T9/games/' + gameID + '/board').then(function(result){ 
			$scope.boardArray = result.data["Board"]
			$scope.loadAllImages();

		})
		$http.get('/T9/games/' + gameID).then(function(result){ 
			$scope.gameData = result.data["Game"]
    		$scope.players = $scope.gameData["Players"]
    		// $scope.player = $scope.players[Math.floor($scope.gameData["Turn"]/10)] + ""
    		// if ($scope.gameData["Turn"]%10 < 9) {
	    	// 	$scope.box = $scope.gameData["Turn"]%10 + ""
    		// }
    		var playingPlayer = $scope.players[Math.floor($scope.gameData["Turn"]/10)]

    		if ($scope.userid == playingPlayer) {
    			$scope.myTurn = true;
    		} else {
    			$scope.myTurn = false;
    		} 

    		if ($scope.gameData["Turn"] > 20) {
    			$scope.whoseTurn = "Game finished.  " + (($scope.gameData["Turn"] - 20 == 1) ? "X" : "O") + " wins!"
    		}
    		else if ($scope.myTurn == 1)
    		{
    			$scope.whoseTurn = "Your turn! Go in box " + $scope.gameData["Turn"]%10
    		}
    		else if ($scope.myTurn == 0)
    		{
    			$scope.whoseTurn = "Opponent's turn!";
    		} else if ($scope.myTurn = 2) {
    		}
		})
	}

    var makeMove = function(game, player, box, square) {

    	var time = Math.floor(Date.now() / 1000);
		var urlWithoutT9 = '/games/' + game + '?Player=' + player + '&Box=' + box + '&Square=' + square;
    	var message = time + ":" + urlWithoutT9;
		var hash = CryptoJS.HmacSHA256(message, $scope.secret);
		// var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);


		var url = '/T9' + urlWithoutT9;
		var data = '';
		var config = {
			'headers': {
				'HMAC' : hash,
				'Encoding' : 'hex',
				'Time-Sent' : time,
			}
		}
        return $http.post(url, data, config).then(function(result){
            return result;
        }, function(error) {
            $scope.error = error.data["Error"]
            return error;
        })
    }
    var getUserGames = function(userID) {

    	var time = Math.floor(Date.now() / 1000);
		var urlWithoutT9 = '/users/' + userID + "/games" 
    	var message = time + ":" + urlWithoutT9;
		var hash = CryptoJS.HmacSHA256(message, $scope.secret);


		var url = '/T9' + urlWithoutT9;
		var data = '';
		var config = {
			'headers': {
				'HMAC' : hash,
				'Encoding' : 'hex',
				'Time-Sent' : time,
			}
		}
        return $http.get(url, data, config).then(function(result){
            console.log(result);
            return result;
        }, function(error) {
            $scope.error = error.data["Error"]
            return error;
        })
    }

	$scope.login = function() {
		var temp = $scope.password;
		$scope.password = '';
		return login($scope.username, temp);
	}

	$scope.verifySecret = function() {
		return verifySecret($scope.username, $scope.secret);
	}


	$scope.getGame = function() {
		return getGame($scope.gameid);
	}

	$scope.refresh = function() {
		$scope.gameData = {}
		$scope.board = ""
		$scope.boardArray = [{"Owned":0,"Squares":[0,0,0,0,0,0,0,0,0]},{"Owned":0,"Squares":[0,0,0,0,0,0,0,0,0]},{"Owned":0,"Squares":[0,0,0,0,0,0,0,0,0]},{"Owned":0,"Squares":[0,0,0,0,0,0,0,0,0]},{"Owned":0,"Squares":[0,0,0,0,0,0,0,0,0]},{"Owned":0,"Squares":[0,0,0,0,0,0,0,0,0]},{"Owned":0,"Squares":[0,0,0,0,0,0,0,0,0]},{"Owned":0,"Squares":[0,0,0,0,0,0,0,0,0]},{"Owned":0,"Squares":[0,0,0,0,0,0,0,0,0]}]
		$scope.loadAllImages()
		$scope.getGame()
	}

    $scope.makeMove = function(box, square) {
    	$scope.error = '';
    	return makeMove($scope.gameid, $scope.userid, box, square);
    }

    $scope.canvasClicked = function(box, square) {

		if ($scope.userid == $scope.gameData.Players[0] && ($scope.gameData.Turn == box || $scope.gameData.Turn == 9)) {
			if($scope.boardArray[box].Squares[square] == 0) {
				$scope.boardArray[box].Squares[square] = 3;
				if ($scope.selectedBox[0] !== -1 && $scope.selectedBox[1] !== -1) {
					if ($scope.boardArray[$scope.selectedBox[0]].Squares[$scope.selectedBox[1]] == 3) {
						$scope.boardArray[$scope.selectedBox[0]].Squares[$scope.selectedBox[1]] = 0;
						$scope.loadIcon($scope.selectedBox[0], $scope.selectedBox[1])
					}
				}
				$scope.selectedBox = [box, square];
			}
			else if ($scope.boardArray[box].Squares[square] == 3) {
				$scope.boardArray[box].Squares[square] = 1;
	    		$scope.makeMove(box, square).then(function(result){
            		$scope.getGame()
	    		}, function(error){
					$scope.boardArray[$scope.selectedBox[0]].Squares[$scope.selectedBox[1]] = 0;
					$scope.loadIcon($scope.selectedBox[0], $scope.selectedBox[1])
	    		}).finally(function() {
					$scope.selectedBox = [-1, -1];
				});
			}
		}
		if ($scope.userid == $scope.gameData.Players[1] && ($scope.gameData.Turn == 10 + box || $scope.gameData.Turn == 19)) {
			if($scope.boardArray[box].Squares[square] == 0) {
				$scope.boardArray[box].Squares[square] = 4;
				if ($scope.selectedBox[0] !== -1 && $scope.selectedBox[1] !== -1) {
					if ($scope.boardArray[$scope.selectedBox[0]].Squares[$scope.selectedBox[1]] == 4) {
						$scope.boardArray[$scope.selectedBox[0]].Squares[$scope.selectedBox[1]] = 0;
						$scope.loadIcon($scope.selectedBox[0], $scope.selectedBox[1])
					}
				}
				$scope.selectedBox = [box, square];
			}
			else if ($scope.boardArray[box].Squares[square] == 4) {
				$scope.boardArray[box].Squares[square] = 2;
	    		$scope.makeMove(box, square).then(function(result){
            		$scope.getGame()
	    		}, function(error){
					$scope.boardArray[$scope.selectedBox[0]].Squares[$scope.selectedBox[1]] = 0;
					$scope.loadIcon($scope.selectedBox[0], $scope.selectedBox[1])
	    		}).finally(function() {
					$scope.selectedBox = [-1, -1];
				});
			}
		}
		console.log($scope.boardArray[box].Squares[square])

		return $scope.loadIcon(box, square);
    }

    $scope.loadIcon = function (box, square) {
		var canvas  = document.getElementById("box"+box+"-"+square);
		if (canvas === null) {
			console.log("derp");
			return
		}
		var context = canvas.getContext("2d");
    	if ($scope.boardArray[box].Squares[square] == 0) {
			context.clearRect(0, 0, canvas.width, canvas.height);
		} else if ($scope.boardArray[box].Squares[square] == 1) {
			xImg.then(function(image){
				context.drawImage(image, 0, 0, canvas.width, canvas.height);
			}, function(error){
				console.log("x failed to load")
			})
		} else if ($scope.boardArray[box].Squares[square] == 2) {
			oImg.then(function(image){
				context.drawImage(image, 0, 0, canvas.width, canvas.height);
			}, function(error){
				console.log("o failed to load")
			})
		} else if ($scope.boardArray[box].Squares[square] == 3) {
			tealxImg.then(function(image){
				context.drawImage(image, 0, 0, canvas.width, canvas.height);
			}, function(error){
				console.log("tealx failed to load")
			})
		} else if ($scope.boardArray[box].Squares[square] == 4) {
			redoImg.then(function(image){
				context.drawImage(image, 0, 0, canvas.width, canvas.height);
			}, function(error){
				console.log("redo failed to load")
			})
		}
		// console.log("drew" + box + ", " + square);
    }

	$scope.loadAllImages = function() {
		for (var i = 0; i < 9; i++){
			for (var j = 0; j < 9; j++) {
				$scope.loadIcon(i, j);
			}
		}
	}

    function loadImage(src) {
        return $q(function(resolve, reject) {
            var image = new Image();
            image.src = src;
            image.onload = function() {
              console.log("loaded image: "+src);
              resolve(image);
            };
            image.onerror = function(e) {
              reject(e);
            };
        })
    }

	$scope.$watch(function(){
		return $window.innerWidth;
	}, function(value) {
		$scope.checkWidth()
	});

	$scope.checkWidth = function() {
		if ($window.innerWidth < 650) {
			$scope.boxSize = 25;
			$scope.spaces = 2;
		} else {
			$scope.boxSize = 50;
			$scope.spaces = 8;
		}
		$scope.loadAllImages();
	}


    var ws = $websocket.$new({'url': 'wss://www.marktai.com/T9/games/' + $scope.gameid + "/ws", 'protocols': [], 'subprotocols': ['base46']}); // instance of ngWebsocket, handled by $websocket service

    ws.$on('$open', function () {
    });

    ws.$on('Change', function (data) {
        console.log(data);
        $scope.getGame();

    })

    ws.$on('$close', function () {
        ws.$close();
    });

    xImg = loadImage("/img/x.png");
    oImg = loadImage("/img/o.jpg");
    tealxImg = loadImage("/img/tealx.png");
    redoImg = loadImage("/img/redo.jpg");

    checkLocalStorageLogin();

}])
