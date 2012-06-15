(function(global, undefined) {

function CheckersGame(state) {
	var _i = this;
	
	_i.state = this;

	_i.isTurnBased = function() {
		return true;
	}

	_i.minPlayers = function() {
		return 2;
	}

	_i.maxPlayers = function() {
		return 2;
	}
}

CheckersGame.createGameState = function() {
	var gameState = {
		players: [],
		board: [],
		boardString: ""
	}

	gameState.boardString += '|---|---|---|---|---|---|---|---|\n'
	for (var y = 0; y < 8; ++y) {
		for (var x = 0; x < 8; ++x) {
			if (y < 3 && ((x & 1) ^ (y & 1) == 0)) {

				gameState.board.push(1)
				gameState.boardString += '| w ';
			} else if (y > 4 && ((x & 1) ^ (y & 1) == 0)) {
				gameState.board.push(2)
				gameState.boardString += '| b ';
			} else {
				gameState.board.push(null);
				gameState.boardString += '|   ';
			}
		}
		gameState.boardString += '|\n';
		gameState.boardString += '|---|---|---|---|---|---|---|---|\n'
	}

	console.log("Board is:");
	console.log(gameState.boardString);
}

global.Game = CheckersGame;

})(typeof exports === 'undefined' ? this : exports)
