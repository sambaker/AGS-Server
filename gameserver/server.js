
var Awe = require('./awe-core.js').Awe;
Awe.StateMachine = require('./awe-state-machine.js').StateMachine;
var server = require('http').createServer();
var WebSocketServer = require('ws').Server;
console.log(WebSocketServer);
var wss = new WebSocketServer({server: server});
var cradle = require('cradle');
var cradleConnection = new(cradle.Connection)('https://sam-baker.cloudant.com', 443, {
    auth: { username: 'sam-baker', password: 'xxxxxx' }
});
var dbUser = cradleConnection.database('users');
var dbGames = cradleConnection.database('games');

cradleConnection.databases(function(error, db) {
    console.log(db);
});

server.listen(8000);

// function handler (req, res) {
//     fs.readFile(__dirname + '/index.html',
//     function (err, data) {
//         if (err) {
//             res.writeHead(500);
//             return res.end('Error loading index.html');
//         }

//         res.writeHead(200);
//         res.end(data);
//     });
// }

function wssend(ws, o) {
    ws.send(JSON.stringify(o));
}

var handlers = {
    'authenticate' : function(ws, message) {
        wssend(ws, {
            type : "authenticated"
        });
    },
    'signup' : function(ws, message) {
        dbUser.post({
            _id: message.name,
            name: message.name,
            password: message.password
        }, function(err, res) {
            if (err) {
                wssend(ws, {
                    type : "signup",
                    success : false,
                    error: {
                        text: err.error + ": " + err.reason
                    }
                });
            } else {
                wssend(ws, {
                    type : "signup",
                    success : true
                });
            }
        });
    }
}

wss.on('connection', function(ws) {
    var Game = require('./checkers_game.js').Game;
    console.log("Client connected, creating game");
    var game = new Game(Game.createGameState());

    var states = {
        "CONNECTED" : {},
        "IDLE" : {}
    }

    var sm = new Awe.StateMachine("Connection", states, "CONNECTED");
    sm.tracing = true;
    //console.log("Statemachine is ", sm);

    ws.on('message', function(message) {
        var o = JSON.parse(message);
        if (handlers.hasOwnProperty(o.type)) {
            console.log("Handling message: ", o);
            handlers[o.type](ws, o);
        } else {
            console.log("Unrecognized message type: ", o);
            ws.send(JSON.stringify({
                error: "Unrecognized message type " + o.type
            }));
        }
    });
    ws.on('close', function() {
        console.log('disconnected');
    });
    ws.on('error', function() {
        console.log('error', arguments);
    });
});

