var gParams = {
	gameTypes : ["checkers","rush_hour"]
	//gameType: "checkers"
}

var gContext = {};

function filterGameDefs(gameDefs) {
	var requestedTypes = gParams.gameTypes || [gParams.gameType];
	gParams.gameTypes = [];
	gParams.gameDefs = {};
	for (var i = 0; i < requestedTypes.length; ++i) {
		var t = requestedTypes[i];
		if (gameDefs[t]) {
			gParams.gameTypes.push(t);
			gParams.gameDefs[t] = gameDefs[t];
		}
	}
}

function gameHasPlayers(game) {
	return game.users.length > 1;
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
	// TODO: Handle games that are waiting for players properly
	var count = game.users.length;
	if (!gameHasPlayers(game)) {
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

	this.content = Awe.createElement('div', parent, {
		className: "game-info",
		styles: {
			width: "560px",
			height: "64px",
			backgroundColor: "#444444",
			margin: "10px"
		}
	});

	var buttonText;
	var buttonClass;
	var buttonCallback;
	if (game) {
		if (gameHasPlayers(game)) {
			buttonText = "Play";
			buttonClass = "btn-success";
			buttonCallback = function() {
				// TODO: Play game
			}
		} else {
			buttonText = "Delete";
			buttonClass = "btn-danger";
			buttonCallback = function() {
				gContext.socket.send(JSON.stringify({
					type: "delete_game",
					_id: game._id,
					_rev: game._rev
				}));
			}
		}
	} else {
		buttonText = "Start a new game";
		buttonClass = "btn-primary";
		buttonCallback = function() {
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
				type: "create_game",
				gameType: type,
				userCount: def.minPlayers,
				requestUsers: []
			}));
		}
	}

	var button = Awe.createElement('button', this.content, {
		className: "float-right btn " + buttonClass,
		attrs: {
			innerText: buttonText
		},
		styles: {
			margin: "18px 15px"
		}
	});

	$(button).click(buttonCallback);

	if (game) {
		Awe.createElement('div', this.content, {
			attrs: {
				innerText: gParams.gameDefs[game.type].displayName
			},
			styles: {
				padding: "10px 10px 0px 10px",
				color: "#ffffff",
			}
		});

		Awe.createElement('div', this.content, {
			attrs: {
				innerText: gameParticipantString(game)
			},
			styles: {
				padding: "10px 10px 0px 10px",
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

// TODO: Change name. This should be more about the connection, not the game view...
function GameView(server) {

	var webSocketServer = 'ws://' + server;
	var httpServer = 'http://' + server;

	var _i = this;

	_i.init = function() {
		_i.root = document.getElementById('mainCon');

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
					parent = _i.gamesList.get(0);
					if (gContext.games && gContext.games.length) {
						parent.innerText = "";
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
			games : function(data) {
				// TODO:
				console.log("GOT GAMES FROM SERVER: ", data);
				gContext.games = data.games;
				_i.smUI.requestState("SHOWING_GAMES");
			},
			delete_game : function(data) {
				if (data.success && _i.gameInfoById[data._id]) {
					var el = _i.gameInfoById[data._id].content;
					el.parentNode.removeChild(el);
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

	injectJS(httpServer + '/api/game-types', function(data) {
		filterGameDefs(data);
		_i.init();
	});
}
