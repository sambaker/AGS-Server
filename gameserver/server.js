
var config = require('./server-config.js').Config;
var Awe = require('./awe-core.js').Awe;
Awe.StateMachine = require('./awe-state-machine.js').StateMachine;
var server = require('http').createServer(httpHandler);
//var WebSocketServer = require('ws').Server;
var io = require('socket.io').listen(server);

io.configure('production', function(){
        io.enable('browser client minification');  // send minified client
        io.enable('browser client etag');          // apply etag caching logic based on version number
        io.enable('browser client gzip');          // gzip the file
        io.set('log level', 1);                    // reduce logging
        io.set('transports', [                     // enable all transports (optional if you want flashsocket)
            'websocket'
//          , 'flashsocket'
          , 'htmlfile'
          , 'xhr-polling'
          , 'jsonp-polling'
        ]);
      });

var cradle = require('cradle');
var fs = require('fs');

var games = {};
var gameDefs = {};

// Map Connected Authenticated Users to web sockets
var caus = {};
var causReplaced = {};

function dateToObject(date) {
    return [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()];
}

function validateGameDef(gameDef) {
    // TODO: Validate all requirements
    return gameDef != null;
}

function validateGame(game) {
    // TODO: Validate all requirements
    return game != null;
}

function loadGames() {
    var suffix = '.def.js';
    fs.readdir('./gameserver/games/', function(err, files) {
        if (err) throw err;

        files.forEach(function(file) {
            var i = file.indexOf(suffix);
            if (i > 0 && file.length == (suffix.length + i)) {
                var gameName = file.slice(0, i);
                if (!games[gameName]) {
                    try {
                        var gameDef = require('./games/'+file).Def;
                        var game = require('./games/'+gameName+'.js').Game;
                        if (!validateGameDef(gameDef)) {
                            throw('Game definition invalid');
                        }
                        if (!validateGame(game)) {
                            throw('Game invalid');
                        }
                        var source = fs.readFileSync('./gameserver/games/'+gameName+'.js', 'utf8');
                        games[gameName] = {
                            game: game,
                            definition: gameDef,
                            source: source
                        }
                        gameDefs[gameName] = gameDef;
                    } catch (e) {
                        console.log("ERROR: Game load failed");
                        console.log("       game type:", gameName);
                        console.log("       exception:", e);
                    }
                }
            }
        });
    });
}

loadGames();

var cradleConnection = new(cradle.Connection)(config.dbURL, config.dbPort, {
    auth: { username: config.dbUser, password: config.dbPassword }
});
var dbUser = cradleConnection.database('users');
var dbGames = cradleConnection.database('games');

server.listen(config.serverPort);

function httpHandler(req, res) {
    var response = null;
    var callback = null;
    var gameJSUrl = '/api/games/';
    var startParams = req.url.indexOf('?');
    callback = Awe.getQueryParam('callback',req.url);
    if (req.url.indexOf('/api/game-types') == 0) {
        response = JSON.stringify(gameDefs);
    } else if (req.url.indexOf(gameJSUrl) == 0) {
        var start = gameJSUrl.length;
        var gameName = req.url.slice(start, startParams >= 0 ? startParams : undefined);
        if (games[gameName]) {
            // Serve file
            response = games[gameName].source;
        }
    } else if (req.url.indexOf('/api/stats/connections') == 0) {
        var response = { count: 0, connectionsReplaced: causReplaced, users: [] };
        for (var key in caus) {
            if (caus.hasOwnProperty(key)) {
                ++response.count;
                response.users.push(key);
            }
        }
        response = JSON.stringify(response);
    }

    if (response) {
        res.writeHead(200);
        var s = "";
        if (callback) {
            s = callback+'(';
        }
        s += response;
        if (callback) {
            s += ')';
        }
        res.end(s);
    } else {
        res.writeHead(404);
        res.end();
    }
}

function wssend(ws, type, o) {
    ws.emit(type, o);
}

function sendFailure(ws, type, err) {
    wssend(ws, type || "error", {
        success: false,
        error: {
            text: err
        }
    });
}

function handleError(ws, err) {
    if (err) {
        wssend(ws, "error", {
            error: {
                text: err.error + ": " + err.reason
            }
        });
        return true;
    }
    return false;
}

var handlers = {
    authenticate : function(ws, message, context) {
        dbUser.get(message.name, function(err, doc) {
            if (err) {
                context.authenticated = false;
                console.log("Failed auth", err);
                wssend(ws, "authenticate", {
                    error : {
                        text : "Invalid username"
                    }
                });
            } else {
                if (doc.password == message.password) {
                    context.authenticated = true;
                    context.user = message.name;
                    wssend(ws, "authenticate", {
                        success : true
                    });
                    if (caus[context.user]) {
                        causReplaced[context.user] = (causReplaced[context.user] || 0) + 1;
                        caus[context.user].disconnect();
                    }
                    caus[context.user] = ws;
                } else {
                    context.authenticated = false;
                    console.log("Failed auth: Wrong password");
                    wssend(ws, "authenticate", {
                        error : {
                            text : "Invalid password"
                        }
                    });
                }
            }
        });
    },
    signup : function(ws, message, context) {
        dbUser.post({
            _id: message.name,
            name: message.name,
            password: message.password
        }, function(err, res) {
            if (err) {
                context.authenticated = false;
                wssend(ws, "signup", {
                    success : false,
                    error: {
                        text: err.error + ": " + err.reason
                    }
                });
            } else {
                context.user = message.name;
                context.authenticated = true;
                wssend(ws, "signup", {
                    success : true
                });
            }
        });
    },
    take_turn : function(ws, message, context) {
        // TODO: Cache connected games in memory
        function takeTurnFailed(revertTo) {
            wssend(ws, 'take_turn', {
                success: false,
                game: revertTo
            });
        }
        dbGames.get(message.game, function(err, doc) {
            if (!handleError(ws, err)) {
                var game = new games[doc.type].game(doc, doc.gameState);
                if (doc.playable && game.takeTurn(context.user, message.turn)) {
                    if (game.getWinner()) {
                        doc.won = true;
                        doc.playable = false;
                    }
                    var savedGameState = doc.gameState;
                    doc.gameState = game.gameState;
                    dbGames.save(doc._id, doc._rev, doc, function(err, res) {
                        if (handleError(ws, err)) {
                            doc.gameState = savedGameState;
                            takeTurnFailed(doc);
                        } else {
                            wssend(ws, "take_turn", {
                                success: true
                            });

                            // Update other connected clients
                            for (var i = 0; i < doc.users.length; ++i) {
                                if (doc.users[i] != context.user) {
                                    var uws = caus[doc.users[i]];
                                    console.log("Sending turn to user " + doc.users[i],uws != null);
                                    if (uws) {
                                        wssend(uws, "games", {
                                            games: [doc]
                                        });
                                    }
                                }
                            }
                        }
                    });
                } else {
                    takeTurnFailed(doc);
                }
            }
        });
    },
    join_game : function(ws, message, context) {
        var type = message.gameType;
        var def = gameDefs[type];
        if (!def) {
            sendFailure(ws, "join_game", "Unknown game type " + type);
        } else {
            // This query doesn't filter games that I'm already in, so pull in a block of
            // results and then filter
            var playerMin = def.minPlayers;
            var playerMax = def.maxPlayers;
            if (message.userCount >= playerMin && message.userCount <= playerMax) {
                playerMin = message.userCount;
                playerMax = message.userCount;
            }
            var params = {
                // startkey: [type,playerMin],
                // endkey: [type,playerMax,{}],
                startkey: [type],
                endkey: [type,{}],
                limit: 10
            };

            // Create a function that will be used on failure to find new games
            function createNewGame() {
                // Create a new game
                var userCount = Math.max(message.userCount, def.minPlayers);
                var game = {
                    type: message.gameType,
                    requestUsers: message.requestUsers || [],
                    users: [ context.user ],
                    userCount: userCount,
                    playable: userCount == 1 && def.minPlayers <= 1,
                    createdAt: dateToObject(new Date())
                }

                dbGames.save(game, function(err, res) {
                    if (!handleError(ws, err)) {
                        dbGames.get(res.id, function(err, doc) {
                            if (!handleError(ws, err)) {
                                // if (game.playable && def.realtimeOnly) {
                                //     cags[doc.id] = ;
                                // }

                                wssend(ws, "join_game", {
                                    success: true,
                                    game: doc
                                });
                            }
                        });
                    }
                });
            }

            dbGames.view('gameserver/need_players', params, function(err, docs) {
                if (handleError(ws, err)) {
                    createNewGame();
                } else {
                    var joinedExistingGame = false;
                    docs.forEach(function(doc) {
                        if (!joinedExistingGame && doc.users.indexOf(context.user) == -1) {
                            // Add user to game and save!
                            doc.users.push(context.user);
                            if (doc.users.length == doc.userCount) {
                                doc.gameState = games[doc.type].game.createGameState(doc);
                                doc.playable = true;
                            }
                            joinedExistingGame = true;

                            dbGames.save(doc._id, doc._rev, doc, function(err, res) {
                                if (handleError(ws, err)) {
                                    createNewGame();
                                } else {
                                    doc._rev = res.rev;
                                    wssend(ws, "join_game", {
                                        success: true,
                                        game: doc
                                    });

                                    // Send notifications to existing users that are connected
                                    for (var i = 0; i < doc.users.length - 1; ++i) {
                                        if (doc.users[i] != context.user) {
                                            var uws = caus[doc.users[i]];
                                            if (uws) {
                                                wssend(uws, "games", {
                                                    games: [doc]
                                                });
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    });

                    if (!joinedExistingGame) {
                        createNewGame();
                    }
                }
            });
        }
    },
    delete_game : function(ws, message, context) {
        dbGames.get(message._id, function(err, doc) {
            if (!handleError(ws, err)) {
                var success = false;
                doc.users.forEach(function(u) {
                    if (u == context.user) {
                        // Delete game
                        dbGames.remove(message._id, message._rev, function(err, o) {
                            if (!handleError(ws, err)) {
                                success = true;
                                wssend(ws, "delete_game", {
                                    success: true,
                                    _id: message._id
                                });
                                // Notify other clients
                                for (var i = 0; i < doc.users.length; ++i) {
                                    if (doc.users[i] != context.user) {
                                        var uws = caus[doc.users[i]];
                                        if (uws) {
                                            wssend(uws, "delete_game", {
                                                success: true,
                                                _id: message._id
                                            });
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                if (!success) {
                    sendFailure(ws, "delete_game", "Wrong user");
                }
            }
        });
    },
    get_games : function(ws, message, context) {
        var params = {};
        if (message.gameTypes) {
            params.keys = [];
            message.gameTypes.forEach(function(t) {
                params.keys.push([context.user,t]);
            });
        } else if (message.gameType) {
            params.key = [context.user,message.gameType];
        }
        // Request active games
        dbGames.view('gameserver/user_type', params, function(err, docs) {
            if (!handleError(ws, err)) {
                var games = [];
                docs.forEach(function(doc) {
                    games.push(doc);
                });
                wssend(ws, "games", {
                    games : games
                });
            }
        });

        // TODO: Query non-realtime games other users have started with me:
        // So look up by [type,randomOpponentsNeeded[x]]
        //dbGames.view('gameserver/requested_player')
    }
}

io.sockets.on('connection', function(ws) {
    console.log("Have connection",ws);
    var context = {};

    var states = {
        "CONNECTED" : {},
        "IDLE" : {}
    }

    var sm = new Awe.StateMachine("Connection", states, "CONNECTED");
    sm.tracing = true;

    function initHandler(ws, key) {
        if (handlers.hasOwnProperty(key)) {
            ws.on(key, function(data) {
                if (key == "authenticate" || key == "signup" || context.authenticated) {
                    console.log("Handling message: ", data);
                    handlers[key](ws, data, context);
                } else {
                    sendFailure(ws, "noauth", "Received " + key + " message without authenticated session");
                }
            });
        }
    }

    for (key in handlers) {
        initHandler(ws, key);
    }

    ws.on('disconnect', function() {
        console.log('Socket disconnected');
        if (context.user && caus[context.user]) {
            delete caus[context.user];
        }
        ws = null;
    });
    ws.on('error', function() {
        console.log('Socket error', arguments);
    });
});

