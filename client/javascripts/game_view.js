
// TODO: Change name. This should be more about the connection, not the game view...
function GameView(server) {
	var _i = this;

	_i.root = document.getElementById('mainCon');

	_i.buttonLogin = $("#login-show");
	_i.buttonLoginDone = $('#login-done');
	_i.buttonSignUp = $('#sign-up');

	_i.loginDialog = $('#login-dialog');

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
	}

	function showDisconnected() {
		_i.connectionWrapper.removeClass('connected');
		_i.connectionWrapper.addClass('not-connected');
		_i.authStatus.text('');
	}

	var username = $.cookie("_user");
	var password = $.cookie("_pw");
	var newUser = false;

	function haveCredentials() {
		return username && password;
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
			_i.usernameEdit.get(0).value = username;
			_i.passwordEdit.get(0).value = password;
		} else {
			_i.usernameEdit.get(0).value = "";
			_i.passwordEdit.get(0).value = "";
		}
	}

	function usernameChanged() {
		_i.usernameDisplay.get(0).innerText = username || "<none>";
	}

	_i.buttonLogin.click(function() {
		if (_i.smConnection.getCurrentStateId() != "CONNECTING") {
			if (_i.smConnection.getCurrentStateId() == "CONNECTED") {
				_i.smConnection.requestState("DISCONNECTING");
			}
			showLogin();
		}
	});

	_i.buttonSignUp.click(function() {
		username = _i.usernameEdit.get(0).value;
		password = _i.passwordEdit.get(0).value;
		newUser = true;
		_i.smConnection.requestState("CONNECTING");
	});

	function saveCredentials() {
		if (haveCredentials() && _i.rememberMe.get(0).checked) {
			$.cookie("_user", username);
			$.cookie("_pw", password);
		} else {
			$.cookie("_user", "");
			$.cookie("_pw", "");
		}
	}

	_i.buttonLoginDone.click(function() {
		username = _i.usernameEdit.get(0).value;
		password = _i.passwordEdit.get(0).value;
		newUser = false;
		saveCredentials();
		usernameChanged();
	});

	if (!haveCredentials()) {
		showLogin();
	}

	_i.buttonConnect.click(function() {
		if (!username || !password) {
			showLogin();
		} else if (_i.smConnection.getCurrentStateId() == "DISCONNECTED") {
			_i.smConnection.requestState("CONNECTING");
		}
	});

	_i.buttonDisconnect.click(function() {
		if (_i.smConnection.getCurrentStateId() == "CONNECTED") {
			_i.smConnection.requestState("DISCONNECTING");
		}
	});

	_i.smAuth = new Awe.StateMachine("Server auth", {
		"NONE" : {},
		"AUTHENTICATING" : {
			start: function() {
				_i.socket.send(JSON.stringify({
					type: "authenticate",
					user: username,
					password: password
				}));
			}
		},
		"AUTHENTICATED" : {
			start: function() {
				showConnected();
			}
		},
		"CREATE_ACCOUNT" : {
			start: function() {
				_i.socket.send(JSON.stringify({
					type: "signup",
					name: username,
					password: password
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
		authenticated : function(data) {
			_i.smAuth.requestState("AUTHENTICATED");
			showConnected();
		},
		signup : function(data) {
			console.log("Sign up response", data);
			if (data.error) {
				alert("Your account couldn't be created. Server says:\n\n" + data.error.text);
				_i.smAuth.requestState("NONE");
			} else {
				// Account created
				saveCredentials();
				usernameChanged();
				_i.loginDialog.modal("hide");
			}
			_i.smConnection.requestState("DISCONNECTING");
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
}
