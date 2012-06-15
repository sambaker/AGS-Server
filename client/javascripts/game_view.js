
function GameView(server) {
	var _i = this;

	_i.root = document.getElementById('mainCon');
	// _i.root.style.width = "100%";
	// _i.root.style.height = "100%";
	// _i.root.style.backgroundColor = "#334455";
	function showLogin() {
		$('#myModal').modal({
			backdrop: true,
			keyboard: true,
			show: true
		});
	}
	$('#login-show').click(showLogin);

	$('#login-done').click(function() {
		$('#username-display').get(0).innerHTML = $('#username-edit').get(0).value;
	});

	showLogin();

	_i.socket = new (window.MozWebSocket || WebSocket)(server);

	_i.socket.onopen = function(event) {
		console.log("Server connection open", event);
	}

	_i.socket.onclose = function(event) {
		console.log("Server connection closed", event);
	}

	_i.socket.onmessage = function(event) {
		console.log("Server message", event.data);
	}

	// _i.sm = new Awe.StateMachine({
	// 	"NO_CONNECTION" : {

	// 	}
	// }
}
