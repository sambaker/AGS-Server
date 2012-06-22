var gGameview;

function CheckersClient(parent) {
	var _i = this;

	_i.content = Awe.createElement('div', null, {
		styles: {
			position: 'absolute',
			width: '100%',
			height: '100%',
			top: '0px',
			left: '0px',
		}
	});

	Awe.createElement('div', _i.content, {
		styles: {
			position: 'absolute',
			width: '100%',
			height: '100%',
			top: '0px',
			left: '0px',
			backgroundColor: '#000000',
			opacity: 0.6
		}
	});

	var container = Awe.createElement('div', _i.content, {
		styles: {
			position: 'absolute',
			width: '700px',
			height: '835px',
			top: '10px',
			left: '162px',
			backgroundColor: '#ffffff'
		}
	});

	var close = Awe.createElement('div', container, {
		attrs: {
			innerText: 'CLOSE'
		},
		styles: {
			backgroundColor: "#bbbbbb",
			color: "#333333",
			fontSize: '18px',
			fontWeight: 'bold',
			"float": 'right',
			margin: '6px',
			padding: "0px 20px",
			textAlign: 'center',
			lineHeight: '36px',
			cursor: 'pointer'
		}
	});

	var status = Awe.createElement('div', container, {
		styles: {
			color: "#333333",
			fontSize: '18px',
			fontWeight: 'bold',
			margin: '6px 6px 6px 125px',
			textAlign: 'center',
			width: '450px',
			lineHeight: '36px',
			cursor: 'pointer'
		}
	});

	var labelP1 = Awe.createElement('div', container, {
		styles: {
			color: "#333333",
			fontSize: '24px',
			fontWeight: 'bold',
			width: '100%',
			textAlign: 'center',
			lineHeight: '50px'
		}
	});

	var board = Awe.createElement('div', container, {
		styles: {
			position: 'relative',
			backgroundColor: "#6d4705",
			width: '688px',
			height: '688px',
			margin: '0px 6px'
		}
	});

	var boardSquares = [
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null]
	];

	var boardPieces = [
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null],
		[null, null, null, null, null, null, null, null]
	];

	var currentMove = null;

	for (var y = 0; y < 8; ++y) {
		for (var x = 0; x < 8; ++x) {
			var square = Awe.createElement('div', board, {
				styles: {
					position: 'absolute',
					top: 8+84*y+'px',
					left: 8+84*x+'px',
					width: '84px',
					height: '84px',
					backgroundColor: ((x ^ y) & 1) ? '#000000' : '#ffffff'
				}
			});

			boardSquares[x][y] = square;
		}
	}

	var labelP2 = Awe.createElement('div', container, {
		styles: {
			color: "#333333",
			fontSize: '24px',
			fontWeight: 'bold',
			width: '100%',
			textAlign: 'center',
			lineHeight: '50px'
		}
	});

	function updatePieces() {
		for (var y = 0; y < 8; ++y) {
			for (var x = 0; x < 8; ++x) {
				if (boardPieces[x][y]) {
					boardSquares[x][y].removeChild(boardPieces[x][y]);
					boardPieces[x][y] = null;
				}
				var current = _i.game.getSquare({x:x,y:y});
				if (current) {
					boardPieces[x][y] = Awe.createElement('image', boardSquares[x][y], {
						attrs: {
							src: current == 1 ? 'images/check_p1.png' : 'images/check_p2.png'
						},
						styles: {
							width: '84px',
							height: '84px'
						}
					});
				}
			}
		}
	}

	var $close;

	_i.smMove = new Awe.StateMachine("Checkers move", {
		"opponentTurn" : {
			start : function() {
				status.innerText = "Waiting for " + _i.game.getNextPlayer();
				status.style.color = "#3333cc";
				currentMove = null;
				updatePieces();
			}
		},
		"chooseTurn" : {
			start : function() {
				status.innerText = "Your turn!";
				status.style.color = "#33cc33";
				currentMove = [];
				updatePieces();
			}
		}
	}, null);

	_i.show = function(gameSession, game) {
		_i.game = game;
		_i.gameSession = gameSession;

		console.log("gameSession ---- ",gameSession);
		labelP1.innerText = gameSession.users[0];
		labelP2.innerText = gameSession.users[1];
		parent.appendChild(_i.content);
		if (!$close) {
			$close = $(close);
			$close.click(_i.hide);
		}

		//updatePieces();

		if (game.allowTurn(gGameview.whoAmI())) {
			_i.smMove.requestState("chooseTurn", 0);
		} else {
			_i.smMove.requestState("opponentTurn");
		}
	}

	_i.hide = function() {
		parent.removeChild(_i.content);
	}
}

function startup() {
	var root = document.getElementById('root');

	var clients = {
		checkers: new CheckersClient(root)
	}

	gGameview = new ArtefactGameServerConnectionView('localhost:8000',
		["checkers"],
		clients,
		true);
}
