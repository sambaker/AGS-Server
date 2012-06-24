(function(global, document, undefined) {

var gParams = {
	debug: true,
	gameTypes : ["checkers","rush_hour"]
	//gameType: "checkers"
}

var gContext = {};

var preloadImages = [
	'/ags/images/vintage_red.png',
	'/ags/images/vintage_black.png',
	'/ags/images/vintage_red_king.png',
	'/ags/images/vintage_black_king.png',
	'/ags/images/board_white.png',
	'/ags/images/board_black.png',
];

for (var i = 0; i < preloadImages.length; ++i) {
	var image = new Image();
	image.src = preloadImages[i];
}
image = null;

function filterGameDefs(gameDefs, server) {
	var requestedTypes = gParams.gameTypes || [gParams.gameType];
	gParams.gameTypes = [];
	gParams.gameDefs = {};
	gParams.gameClasses = {};
	function add(t) {
		gParams.gameTypes.push(t);
		gParams.gameDefs[t] = gameDefs[t];
		new injectJS(server + '/api/games/' + t, function(f) {
			gParams.gameClasses[t] = f;
		});
	}
	for (var i = 0; i < requestedTypes.length; ++i) {
		var t = requestedTypes[i];
		if (gameDefs[t]) {
			add(t);
		}
	}
}

function gamePlayable(game) {
	return game.playable;
}

function gameWon(game) {
	return game.won;
}

function getWinner(game) {
	var winner = game.getWinner();
	if (winner == gContext.username) {
		return "You";
	}
	return winner;
}

function headerDescriptionString() {
	var s = "This page is a test of the Artefact Game Server. Here you can play ";
	var count = gParams.gameTypes.length;
	for (var i = 0; i < count; ++i) {
		var def = gParams.gameDefs[gParams.gameTypes[i]];
		if (i == 0) {
		} else if (i == count - 1) {
			s += " and ";
		} else {
			s += ", ";
		}
		s += '<strong>' + def.displayName + '</strong>';
	}
	return s + " with your friends";
}

function gameParticipantString(game) {
	var count = game.users.length;
	if (!gameWon(game) && !gamePlayable(game)) {
		return "Waiting for players...";
	} else {
		var done = 1;
		var s = "Between you";
		for (var i = 0; i < count; ++i) {
			if (game.users[i] != gContext.username) {
				if (done < count - 1) {
					s += ', ';
				} else {
					s += " and ";
				}
				s += game.users[i];
				++done;
			}
		}
		return s;
	}
}

function GameInfo(parent, game) {
	var _i = this;

	function createButton(text, className, callback) {
		var button = Awe.createElement('button', _i.content, {
			className: "float-right btn " + className,
			attrs: {
				innerText: text
			},
			styles: {
				margin: "18px 15px"
			}
		});
		$(button).click(callback);
	}

	this.content = Awe.createElement('div', parent, {
		className: "game-info",
		styles: {
			width: "560px",
			height: "64px",
			backgroundColor: "#444444",
			borderRadius: "12px",
			margin: "10px"
		}
	});

	var buttonText;
	var buttonClass;
	var buttonCallback;
	if (game) {
		if (gamePlayable(game)) {
			createButton("Play", "btn-success", function() {
				console.log("STARTING GAME ",game.gameState);
				gContext.gameServer.smUI.requestState("PLAYING_GAME", game);
			});
		}

		createButton("Delete", "btn-danger", function() {
				gContext.socket.send(JSON.stringify({
					type: "delete_game",
					_id: game._id,
					_rev: game._rev
				}));
		});
	} else {
		createButton("Start a new game", "btn-primary", function() {
			// Create game
			var type;
			if (gParams.gameTypes.length > 1) {
				var select = document.getElementById("select-game-type");
				type = select.value;
			} else {
				type = gParams.gameTypes[0];
			}
			var def = gParams.gameDefs[type];
			// TODO: Process more options, min/max player, opponent, etc
			gContext.socket.send(JSON.stringify({
				type: "join_game",
				gameType: type,
				userCount: def.maxPlayers,
				requestUsers: []
			}));
		});
	}

	if (game) {
		Awe.createElement('div', this.content, {
			attrs: {
				innerHTML: 
					'<strong>'+
					gParams.gameDefs[game.type].displayName+
					'</strong> <em>'+
					gameParticipantString(game)+
					'</em>'
			},
			styles: {
				padding: "10px 10px 0px 10px",
				color: "#ffffff",
			}
		});

		var status = "";
		if (gameWon(game)) {
			var g = new gParams.gameClasses[game.type](game, game.gameState, gParams.debug);
			status = "<span style='font-weight: bold; color: #ffdd88;'>Game over</span> "+getWinner(g)+" won!";
		} else if (gamePlayable(game)) {
			var g = new gParams.gameClasses[game.type](game, game.gameState, gParams.debug);
			var canPlay = g.allowTurn(gContext.username);
			if (canPlay) {
				status = "<span style='font-weight: bold; color: #77ee88;'>Ready to play</span>";
			} else {
				status = "<span style='font-weight: bold; color: #77eeff;'>Waiting for "+g.getNextPlayer()+"</span>";
			}
		}

		var gameStatus = Awe.createElement('div', this.content, {
			attrs: {
				innerHTML: status
			},
			styles: {
				padding: "8px 10px 0px 10px",
				color: "#ffffff",
			}
		});
	} else if (gParams.gameTypes && gParams.gameTypes.length > 1) {
		var options = "";
		for (var i = 0; i < gParams.gameTypes.length; ++i) {
			var def = gParams.gameDefs[gParams.gameTypes[i]];
			options += '<option value='+gParams.gameTypes[i]+'>' + def.displayName + '</option>';
		}
		Awe.createElement('div', this.content, {
			className: "control-group",
			attrs: {
				innerHTML:
				'<label class="control-label" for="select-game-type">Game type:</label>\
				<div class="controls">\
					<select id="select-game-type">' +
						options +
					'</select>\
				</div>'
			}
		});
	}
}

function ArtefactGameServerConnectionView(server, gameTypes, clients, debug) {

	gParams.gameTypes = gameTypes;
	gParams.clients = clients;
	gParams.debug = debug;

	gContext.gameServer = this;

	var webSocketServer = 'ws://' + server;
	var httpServer = 'http://' + server;

	var _i = this;

	_i.init = function() {

		// Map game id to game info DOM elements
		_i.gameInfoById = {};

		_i.headerDescription = document.getElementById("header-description");

		_i.headerDescription.innerHTML = headerDescriptionString();

		_i.buttonSignout = $("#signout");
		_i.buttonSignin = $('#login-done');
		_i.buttonSignUp = $('#sign-up');

		_i.loginDialog = $('#login-dialog');

		_i.gamesList = $('#games-list');

		_i.buttonConnect = $('#connect');
		_i.buttonDisconnect = $('#disconnect');

		_i.usernameDisplay = $('#username-display');
		_i.usernameEdit = $('#username-edit');
		_i.passwordEdit = $('#password-edit');
		_i.rememberMe = $('#remember-me-check');
		_i.connectionWrapper = $('#connection');
		_i.authStatus = $('#auth-status');

		function showConnected() {
			_i.connectionWrapper.removeClass('not-connected');
			_i.connectionWrapper.addClass('connected');
			if (_i.smAuth.getCurrentStateId() == "AUTHENTICATING") {
				_i.authStatus.text('Authenticating');
			} else if (_i.smAuth.getCurrentStateId() == "AUTHENTICATED") {
				_i.authStatus.text('Authenticated');
			} else {
				_i.authStatus.text('');
			}
			_i.buttonSignout.text('Sign out');
		}

		function showDisconnected() {
			_i.connectionWrapper.removeClass('connected');
			_i.connectionWrapper.addClass('not-connected');
			_i.authStatus.text('');
			_i.buttonSignout.text('Change');
		}

		gContext.username = $.cookie("_user");
		gContext.password = $.cookie("_pw");
		var newUser = false;

		function haveCredentials() {
			return gContext.username && gContext.password;
		}

		usernameChanged();
		updateCredentialsUI();

		function showLogin() {
			_i.loginDialog.modal({
				backdrop: true,
				keyboard: true,
				show: true
			});
		}

		function updateCredentialsUI() {
			_i.rememberMe.get(0).checked = haveCredentials();
			if (haveCredentials()) {
				_i.usernameEdit.get(0).value = gContext.username;
				_i.passwordEdit.get(0).value = gContext.password;
			} else {
				_i.usernameEdit.get(0).value = "";
				_i.passwordEdit.get(0).value = "";
			}
		}

		function usernameChanged() {
			_i.usernameDisplay.get(0).innerText = gContext.username || "<none>";
		}

		_i.buttonSignout.click(function() {
			if (_i.smConnection.getCurrentStateId() != "CONNECTING") {
				if (_i.smConnection.getCurrentStateId() == "CONNECTED") {
					_i.smConnection.requestState("DISCONNECTING");
				}
				showLogin();
			}
		});

		_i.buttonSignUp.click(function() {
			gContext.username = _i.usernameEdit.get(0).value;
			gContext.password = _i.passwordEdit.get(0).value;
			newUser = true;
			_i.smConnection.requestState("CONNECTING");
		});

		function saveCredentials() {
			if (haveCredentials() && _i.rememberMe.get(0).checked) {
				$.cookie("_user", gContext.username);
				$.cookie("_pw", gContext.password);
			} else {
				$.cookie("_user", "");
				$.cookie("_pw", "");
			}
		}

		_i.buttonSignin.click(function() {
			gContext.username = _i.usernameEdit.get(0).value;
			gContext.password = _i.passwordEdit.get(0).value;
			newUser = false;
			saveCredentials();
			usernameChanged();
			connect();
		});

		function connect() {
			if (!gContext.username || !gContext.password) {
				showLogin();
			} else if (_i.smConnection.getCurrentStateId() == "DISCONNECTED") {
				_i.smConnection.requestState("CONNECTING");
			}
		}

		_i.buttonConnect.click(function() {
			connect();
		});

		_i.buttonDisconnect.click(function() {
			if (_i.smConnection.getCurrentStateId() == "CONNECTED") {
				_i.smConnection.requestState("DISCONNECTING");
			}
		});

		function updateGamesList() {
			parent = _i.gamesList.get(0);
			_i.gameInfoById = {};
			if (gContext.games && gContext.games.length) {
				parent.innerHTML = "";
				for (var i = 0; i < gContext.games.length; ++i) {
					var gi = new GameInfo(parent, gContext.games[i]);
					_i.gameInfoById[gContext.games[i]._id] = gi;
				}
			} else {
				parent.innerText = "No games";
			}
			// Add create game link
			new GameInfo(parent);
		}

		_i.smUI = new Awe.StateMachine("UI", {
			"NONE" : {
				allowOnly: ["GETTING_GAMES"],
				start: function() {
					_i.gamesList.text('Waiting for connection...');
				}
			},
			"GETTING_GAMES" : {
				allowOnly: ["NONE", "SHOWING_GAMES"],
				start: function() {
					_i.gamesList.text('Loading games...');
					gContext.socket.send(JSON.stringify({
						type: "get_games",
						gameTypes: gParams.gameTypes,
						gameType: gParams.gameType
					}));
				}
			},
			"SHOWING_GAMES" : {
				start: function() {
					updateGamesList();
				}
			},
			"PLAYING_GAME" : {
				start: function(prevState, game) {
					gContext.currentGame = new gParams.gameClasses[game.type](game, game.gameState, gParams.debug);
					console.log("CG:",gContext.currentGame);
					// Render game!!!
					gParams.clients[game.type].show(game, gContext.currentGame);
				}
			}
		}, "NONE");

		_i.smAuth = new Awe.StateMachine("Server auth", {
			"NONE" : {},
			"AUTHENTICATING" : {
				start: function() {
					gContext.socket.send(JSON.stringify({
						type: "authenticate",
						name: gContext.username,
						password: gContext.password
					}));
				}
			},
			"AUTHENTICATED" : {
				start: function() {
					showConnected();
					_i.smUI.requestState("GETTING_GAMES");
				},
				end: function() {
					_i.smUI.requestState("NONE");
				}
			},
			"CREATE_ACCOUNT" : {
				start: function() {
					gContext.socket.send(JSON.stringify({
						type: "signup",
						name: gContext.username,
						password: gContext.password
					}));
				}
			}
		}, "NONE");

		_i.smConnection = new Awe.StateMachine("Server connection", {
			"DISCONNECTED" : {
				start: function() {
					_i.smAuth.requestState("NONE");
					showDisconnected();
				}
			},
			"CONNECTING" : {
				start: function() {
					openConnection();
				},
				doNotAllow: ["DISCONNECTING"]
			},
			"CONNECTED" : {
				start: function() {
					if (newUser) {
						_i.smAuth.requestState("CREATE_ACCOUNT");
						showConnected();
						newUser = false;
					} else {
						_i.smAuth.requestState("AUTHENTICATING");
						showConnected();
					}
				}
			},
			"DISCONNECTING" : {
				start: function() {
					gContext.socket.close();
				},
				doNotAllow: ["CONNECTING"]
			}
		}, "DISCONNECTED");

		var handlers = {
			authenticate : function(data) {
				if (data.error) {
					_i.smAuth.requestState("NONE");
					alert("Authentication failed. Server says:\n\n" + data.error.text);
					_i.smConnection.requestState("DISCONNECTING");
				} else {
					_i.smAuth.requestState("AUTHENTICATED");
				}
				showConnected();
			},
			signup : function(data) {
				console.log("Sign up response", data);
				if (data.error) {
					_i.smAuth.requestState("NONE");
					alert("Your account couldn't be created. Server says:\n\n" + data.error.text);
				} else {
					// Account created
					_i.smAuth.requestState("AUTHENTICATED");
					saveCredentials();
					usernameChanged();
					_i.loginDialog.modal("hide");
					showConnected();
				}
				//_i.smConnection.requestState("DISCONNECTING");
			},
			take_turn : function(data) {
				if (!data.success) {
					console.log("DATA:",data);
					alert("Bad news: the server rejected your turn. Please contact the developer for help");
				}
				updateGamesList();
			},
			games : function(data) {
				console.log("GOT GAMES FROM SERVER: ", data);
				if (gContext.games) {
					for (var i = 0; i < data.games.length; ++i) {
						var found = false;
						for (var j = 0; j < gContext.games.length; ++j) {
							// Found match
							if (gContext.games[j]._id == data.games[i]._id) {
								// Update existing game (should never happen)
								gContext.games[j] = data.games[i];
								found = true;
								break;
							}
						}
						if (!found) {
							// Append new game
							gContext.games.push(data.games[i]);
							break;
						}
					}
				} else {
					gContext.games = data.games;
				}
				if (_i.smUI.getCurrentStateId() == "SHOWING_GAMES") {
					_i.smUI.restartCurrentState();
				} else if (_i.smUI.getCurrentStateId() == "PLAYING_GAME") {
					updateGamesList();
					var currentGameId = gContext.currentGame.sessionState._id;
					for (var i = 0; i < gContext.games.length; ++i) {
						if (gContext.games[i]._id == currentGameId) {
							_i.smUI.restartCurrentState(gContext.games[i]);
						}
					}
				} else {
					_i.smUI.requestState("SHOWING_GAMES");
				}
			},
			delete_game : function(data) {
				if (data.success && _i.gameInfoById[data._id]) {
					for (var i = 0; i < gContext.games.length; ++i) {
						if (gContext.games[i]._id == data._id) {
							gContext.games.splice(i, 1);
							break;
						}
					}
					if (_i.smUI.getCurrentStateId() == "SHOWING_GAMES") {
						_i.smUI.restartCurrentState();
					}
				}
			},
			join_game : function(data) {
				if (data.success) {
					gContext.games.unshift(data.game);
					if (_i.smUI.getCurrentStateId() == "SHOWING_GAMES") {
						_i.smUI.restartCurrentState();
					}
				}
			}
		}

		function processServerError(data) {
			// TODO: Handle properly
			console.log("SERVER ERROR: ", data);
		}

		function openConnection() {
			gContext.socket = new (window.MozWebSocket || WebSocket)(webSocketServer);

			gContext.socket.onopen = function(event) {
				console.log("Server connection open", event);
				_i.smConnection.requestState("CONNECTED");
			}

			gContext.socket.onclose = function(event) {
				_i.smConnection.requestState("DISCONNECTED");
			}

			gContext.socket.onmessage = function(event) {
				var data = JSON.parse(event.data);
				if (data.type && handlers[data.type]) {
					handlers[data.type](data);
				} else if (data.error) {
					processServerError(data);
				} else {
					console.log("ERROR: Unrecognized response", data);
				}
			}
		}

		if (haveCredentials()) {
			connect();
		} else {
			showLogin();
		}
	}

	new injectJS(httpServer + '/api/game-types', function(data) {
		filterGameDefs(data, httpServer);
		_i.init();
	});

	_i.whoAmI = function() {
		return gContext.username;
	}

	_i.takeTurn = function(turn) {
		gContext.socket.send(JSON.stringify({
			type: "take_turn",
			game: gContext.currentGame.sessionState._id,
			turn: turn
		}));
		if (gContext.currentGame.getWinner()) {
			gContext.currentGame.sessionState.playable = false;
			gContext.currentGame.sessionState.won = true;
			_i.smUI.restartCurrentState(gContext.currentGame.sessionState);
		}
	}

	_i.exitGame = function() {
		if (_i.smUI.getCurrentStateId() == "PLAYING_GAME") {
			_i.smUI.requestState("SHOWING_GAMES");
		}
	}
}

global.ArtefactGameServerConnectionView = ArtefactGameServerConnectionView;

})(this, document);