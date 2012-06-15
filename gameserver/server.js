
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

wss.on('connection', function(ws) {
    var Game = require('./checkers_game.js').Game;
    var game = new Game(Game.createGameState());

    var states = {
        "CONNECTED" : {},
        "IDLE" : {}
    }

    var sm = new Awe.StateMachine("Connection", states, "CONNECTED");
    sm.tracing = true;
    //console.log("Statemachine is ", sm);

    ws.on('message', function(message) {
        console.log('received: %s', message);
        ws.send('received ' + message);
    });
    ws.send('something');
});

