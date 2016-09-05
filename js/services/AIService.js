marktai.service("AIService", ["$q", function($q) {

    // rootNegamaxValue = [square, value, board]
    // game = {GameData, BoardArray}

    this.generateBestMove = function(game) {
        var player  = Math.floor(game["GameData"]["Turn"] / 10) + 1;

        var rootNegamaxValue = alphabeta(game, 6, [[-1, -1], -1000000], [[-1, 1], 1000000], 1, player)
        return rootNegamaxValue[0];
    }

    var Three_in_a_Row = [
            [ 0, 1, 2 ],
            [ 3, 4, 5 ],
            [ 6, 7, 8 ],
            [ 0, 3, 6 ],
            [ 1, 4, 7 ],
            [ 2, 5, 8 ],
            [ 0, 4, 8 ],
            [ 2, 4, 6 ],
        ];

    var rateBox = function(box, player) {
        var Heuristic_Array = [
            [     0,   -10,  -100, -10000],
            [    10,     0,     0,     0 ],
            [   100,     0,     0,     0 ],
            [ 10000,     0,     0,     0 ],
        ];
        var opponent = 3 - player;
        var total = 0;
        for (var i = 0; i < 8; i++) {
            var playerOwnedCount = 0;
            var opponentOwnedCount = 0;
            for (var j = 0; j < 3; j++) {
                var square = box[Three_in_a_Row[i][j]]
                if (square == player) {
                    playerOwnedCount += 1;
                } else if (square == opponent) {
                    opponentOwnedCount += 1;
                }
            }

            total += Heuristic_Array[playerOwnedCount][opponentOwnedCount]
        }
        if (total < -1000) {
            total = -1000;
        } else if (total > 1000) {
            total = 1000;
        }

        // normalizing to -1 to 1 distribution
        total = (total) / 1000
        // normalizing to 0 to 1 exponentialish distribution
        total = (Math.pow(10, total) - 0.1)/9.9

        // console.log("box", box, "player", player, "total", total)
        return total;
    }

    this.rateGame = function(game, player) {
        return rateGame(game, player);
    }

    var rateGame = function(game, player) {
        var opponent = 3 - player;
        var total = 0;
        var ratings = [];
        for (var k = 0; k < 9; k++) {

            var playerBoxRating = rateBox(game["BoardArray"][k]["Squares"], player);
            var opponentBoxRating = rateBox(game["BoardArray"][k]["Squares"], opponent);

            ratings.push([playerBoxRating, opponentBoxRating])
        }
        // console.log("ratings", ratings);
        for (var i = 0; i < 8; i++) {
            var playerOwnedTotal = 1;
            var opponentOwnedTotal = 1;
            for (var j = 0; j < 3; j++) {
                var boxNumber = Three_in_a_Row[i][j]
                playerOwnedTotal *= ratings[boxNumber][0]
                opponentOwnedTotal *= ratings[boxNumber][1]
            }
            // console.log("playerOwnedTotal", playerOwnedTotal);
            // console.log("opponentOwnedTotal", opponentOwnedTotal);

            if (playerOwnedTotal == 1) { // player has won
                return 1;
            } else if (opponentOwnedTotal == -1) { // opponent has won
                return -1;
            }

            total += playerOwnedTotal - opponentOwnedTotal
        }
        // console.log("total", total)

        return total;
    }



    var maxMove = function(a, b) {
        // if (a[0] === [-1, -1]) {
        //     return b;
        // }
        // if (a[0] === [-1, 1]) {
        //     return a;
        // }
        // if (b[0] === [-1, -1]) {
        //     return a;
        // }
        // if (b[0] === [-1, 1]) {
        //     console.log("hi");
        //     return b;
        // }
        return (a[1]>=b[1]) ? a : b;
    }

    var minMove = function(a, b) {
        // if (a[0] === [-1, -1]) {
        //     return b;
        // }
        // if (a[0] === [-1, 1]) {
        //     return a;
        // }
        // if (b[0] === [-1, -1]) {
        //     return a;
        // }
        // if (b[0] === [-1, 1]) {
        //     console.log("hi");
        //     return b;
        // }
        return (a[1]<=b[1]) ? a : b;
    }

    var tripEqualityAndNot0 = function(a, b, c) {
        return a !== 0 && a === b && a === c;
    }

    var clone = function(old) {
        return JSON.parse(JSON.stringify(old));
    }

    var checkGameWin = function(game) {
        //horizontal
        for (var i = 0; i < 3; i++) {
            if (tripEqualityAndNot0(game["BoardArray"][3*i]["Owned"], game["BoardArray"][3*i+1]["Owned"], game["BoardArray"][3*i+2]["Owned"])) {
                game["GameData"]["Turn"] = 20 + game["BoardArray"][3*i]["Owned"];
                return game["GameData"]["Turn"]
            } 
        }

        //vertical
        for (var i = 0; i < 3; i++) {
            if (tripEqualityAndNot0(game["BoardArray"][i]["Owned"], game["BoardArray"][i+3]["Owned"], game["BoardArray"][i+6]["Owned"])) {
                game["GameData"]["Turn"] = 20 + game["BoardArray"][i]["Owned"];
                return game["GameData"]["Turn"]
            } 
        }

        // back slash
        if (tripEqualityAndNot0(game["BoardArray"][0]["Owned"], game["BoardArray"][4]["Owned"], game["BoardArray"][8]["Owned"])) {
            game["GameData"]["Turn"] = 20 + game["BoardArray"][0]
            return game["GameData"]["Turn"]
        }

        // forward slash
        if (tripEqualityAndNot0(game["BoardArray"][2]["Owned"], game["BoardArray"][4]["Owned"], game["BoardArray"][6]["Owned"])) {
            game["GameData"]["Turn"] = 20 + game["BoardArray"][2]["Owned"]
            return game["GameData"]["Turn"]
        }

        return game["GameData"]["Turn"]
    }

    var checkBoxTaken = function(box) {

        //horizontal
        for (var i = 0; i < 3; i++) {
            if (tripEqualityAndNot0(box["Squares"][3*i], box["Squares"][3*i+1], box["Squares"][3*i+2])) {
                box["Owned"] = box["Squares"][3*i];
                return box["Owned"]
            } 
        }

        //vertical
        for (var i = 0; i < 3; i++) {
            if (tripEqualityAndNot0(box["Squares"][i], box["Squares"][i+3], box["Squares"][i+6])) {
                box["Owned"] = box["Squares"][i];
                return box["Owned"]
            } 
        }

        // back slash
        if (tripEqualityAndNot0(box["Squares"][0], box["Squares"][4], box["Squares"][8])) {
            box["Owned"] = box["Squares"][0]
            return box["Owned"]
        }

        // forward slash
        if (tripEqualityAndNot0(box["Squares"][2], box["Squares"][4], box["Squares"][6])) {
            box["Owned"] = box["Squares"][2]
            return box["Owned"]
        }

        return box["Owned"]
    }



    var generateMoves = function(game) {
        var boxToMoveIn = game["GameData"]["Turn"] % 10;
        var playerTurn  = Math.floor(game["GameData"]["Turn"] / 10);
        var moves = [];
        if (boxToMoveIn == 9) { // every possible move
            for (var i = 0; i < 9; i++) { // iterates through every box and calls itself
                if (game["BoardArray"][i]["Owned"] == 0) {
                    var newGame = clone(game);
                    newGame["GameData"]["Turn"] = playerTurn * 10 + i;
                    moves = moves.concat(generateMoves(newGame));
                }
            }
        } else {
            for (var i = 0; i < 9; i++) { // iterates through every untaken square
                if (game["BoardArray"][boxToMoveIn]["Squares"][i] == 0) {
                    var newGame = clone(game);

                    // assign new square
                    newGame["BoardArray"][boxToMoveIn]["Squares"][i] = playerTurn+1; // playerTurn is 1 less than their square representation

                    // updates if the box is taken
                    checkBoxTaken(newGame["BoardArray"][boxToMoveIn]); 

                    checkGameWin(newGame);

                    newGame["GameData"]["Turn"] = (1 - playerTurn) * 10 + i; // update player turn
                    moves.push([ [boxToMoveIn, i] , newGame]);
                }
            }   
        }
        return moves;
    }

    var isFinished = function(game) {
        return game["GameData"]["Turn"] > 20;
    }

    // https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning


    var alphabeta = function(game, depth, alpha, beta, maximizingPlayer, player) {
        if (depth == 0 || isFinished(game)) {
            return [[-1, 0], rateGame(game, player)]
        }
        var childGames = generateMoves(game);
        var choices = []
        var returnValue;
        if (maximizingPlayer) {
            var bestValue = [[-1, -1], -1000000];
            for (var child of childGames) {
                var v = [child[0], undefined];
                v[1] = alphabeta(child[1], depth - 1, alpha, beta, false, 3 - player)[1]
                choices.push(v);
                bestValue = maxMove(bestValue, v);
                alpha = maxMove(alpha, v);
                if (beta <= alpha) {
                    break;
                }
            }
            returnValue = bestValue;
        } else {
            var worstValue = [[-1, -1], 1000000];
            for (var child of childGames) {
                var v = [child[0], undefined];
                v[1] = alphabeta(child[1], depth - 1, alpha, beta, true, 3 - player)[1]
                choices.push(v);
                worstValue = minMove(worstValue, v);
                beta = minMove(beta, v);
                if (beta <= alpha) {
                    break;
                }
            }
            returnValue = worstValue;
        }
        if (depth == 5) {
            console.log("choices", choices);
        }
        return returnValue;
    }

    var negaMax = function(game, depth, alpha, beta, color, player) {

        var childGames = generateMoves(game);
        var bestValue = [[-1, -1], -1000000];
        var choices = []
        for (var child of childGames) {
            var v = [child[0], -1];

            var newAlpha = clone(beta);
            newAlpha[0][1] *= -1;

            var newBeta = clone(alpha);
            newBeta[0][1] *= -1;

            var recurCall = negaMax(child[1], depth - 1, newAlpha, newBeta, -1 * color, 3 - player);
            v[1] = -1 * recurCall[1];
            choices.push(v);
            // console.log("node", v);
            bestValue = maxMove( bestValue, v )
            // console.log("best", bestValue);
            alpha = maxMove( alpha, v )
            // if (maxMove(alpha, beta) === alpha) {
            //     console.log("alpha", alpha)
            //     console.log("beta", beta)
            //     break
            // }
        }
        if (depth==5){
            console.log("choices", choices);
            console.log("bestValue", bestValue)
        }
        return bestValue
    }

}])