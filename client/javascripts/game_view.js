var gContext = {};

function gameParticipantString(game) {
	// TODO: Handle games that are waiting for players properly
	var count = game.users.length;
	if (count == 1) {
		return "Waiting for players...";
	} else {
		var done = 1;
		var s = "You";
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
		styles: {
			width: "560px",
			height: "70px",
			backgroundColor: "#444444",
			margin: "10px"
		}
	});

	Awe.createElement('div', this.content, {
		attrs: {
			innerText: gameParticipantString(game)
		},
		styles: {
			padding: "10px",
			color: "#ffffff",
		}
	});
}

// TODO: Change name. This should be more about the connection, not the game view...
function GameView(server) {
	var _i = this;

	_i.root = document.getElementById('mainCon');

	_i.context = {};

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
				_i.socket.send(JSON.stringify({
					type: "get_games",
					gametype: "checkers"
				}));
			}
		},
		"SHOWING_GAMES" : {
			start: function() {
				if (_i.context.games && _i.context.games.length) {
					_i.gamesList.get(0).innerText = "";
					for (var i = 0; i < _i.context.games.length; ++i) {
						new GameInfo(_i.gamesList.get(0), _i.context.games[i]);
					}
				} else {
					_i.gamesList.get(0).innerText = "No games";
				}
				// TODO: Add create game link
			}
		}
	}, "NONE");

	_i.smAuth = new Awe.StateMachine("Server auth", {
		"NONE" : {},
		"AUTHENTICATING" : {
			start: function() {
				_i.socket.send(JSON.stringify({
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
				_i.socket.send(JSON.stringify({
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
				_i.socket.close();
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
			_i.context.games = data.games;
			_i.smUI.requestState("SHOWING_GAMES");
		}
	}

	function processServerError(data) {
		// TODO: Handle properly
		console.log("SERVER ERROR: ", data);
	}

	function openConnection() {
		_i.socket = new (window.MozWebSocket || WebSocket)(server);

		_i.socket.onopen = function(event) {
			console.log("Server connection open", event);
			_i.smConnection.requestState("CONNECTED");
		}

		_i.socket.onclose = function(event) {
			_i.smConnection.requestState("DISCONNECTED");
		}

		_i.socket.onmessage = function(event) {
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
