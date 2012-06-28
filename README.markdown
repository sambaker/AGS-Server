Artefact Game Server
--------------------

Local installation
------------------

- Install node.js and npm

- From the root folder of the repo, install the required node packages using:

npm install socket.io cradle node-inspector

- Create a couch database - you can create a free one at cloudant.com

- Copy gameserver/server-config-template.js to gameserver/server-config.js and set:

	- the port that you want your nodeserver to run on (I use 8000 since my servers also have apache running on port 80)

	- the url, port, username and password for your couch database. These are the credentials you provided when creating your cloudant db and the default port is 443

Here's an example version of settings in server-config.js for a cloudant database:

	global.Config = {
		// Port that node server will run on
		serverPort: 8000,
		dbURL: "https://sam-baker.cloudant.com",
		// Couch database port
		dbPort: 443,
		dbUser: "sam-baker",
		dbPassword: "your-password-here"
	}

- To run the node server locally, I use the run.sh script in the root folder. This does a few things:

1) it kills any existing node server running in the background

2) it starts the game server running in the background

3) it starts node-inspector which allows you to debug the node server in any webkit browser. You can set breakpoints, inspect objects etc, a very useful environment.

Deployment
----------

To deploy I ftp the ags folder (the game clients) to one server. The clients are served by apache so if my server root for example.domain.com is /var/www and I copied the ags folder to that folder, the game client is accessed in a browser at http://example.domain.com/ags/

I ftp the gameserver folder to a different Ubuntu server which has node and the socket.io, cradle and node-inspector packages installed.

To run the server as a daemon, I created a file:

	/etc/init/node-game.conf

Which is included in this repo but needs to be moved to /etc/init to work.

This will start the node server when the Ubuntu server boots.

When I make updates to the server, I ssh to the Ubuntu box and run:

	stop node-game
	start node-game

To restart the node server with the latest changes.

Adding a game on the server
---------------------------

Game logic and game state are written in javascript. To make a game available to the server, create two javascript files in the gameserver/games folder:

	game-name.def.js
	game-name.js

game-name.def.js file is a data structure that describes the game (min/max players, realtime/turn-based, display name). See the included games for examples.

game-name.js defines a game object and must assign it to global.Game. This object must implement a standard set of methods to provide the game logic. This file is used on the client to validate moves by the user and also on the server to validate move requests coming from the client. This stops a client from cheating by sending moves that are invalid but produce an advantageous game state.

After adding a game, restart the node server. If the server is running locally on port 8000, you can visit this URL in your browser:

	http://localhost:8000/api/game-types

and you should see your new game returned in the list. You should also see the game logic javascript file returned at:

	http://localhost:8000/api/games/game-name

Adding a game on the client
---------------------------

The client is currently run as a web app and the best place to start is with the example client.

The client consists of:

index.html - the html template for the webapp
javascripts/AGSConnectionView.js - the javascript view that handles account/creation and login, creating and displaying games and starting a multiplayer game
javascripts/app_checkers.js - this is the bit you need to rewrite for a new game client. It needs to provide a global function that's called on the webpages onload event:

	function startup() {
		var root = document.getElementById('root');

		var clients = {
			checkers: new GameClient(root, "checkers"),
			chess: new GameClient(root, "chess")
		}

		gGameview = new ArtefactGameServerConnectionView(gameServer,
			["checkers", "chess"],
			clients,
			true);
	}

First it initializes some clients for each supported game type - in the above example chess and checkers.

It passes that to an instance of ArtefactGameServerConnectionView which takes params:

- the URL of your node server (typically "localhost:8000" for development)
- the array of game types that the client supports (used for filtering games on the server side). These names match the server-side javascript files, for example chess corresponds to the game defined in games/chess.def.js and games/chess.js on the server.
- a debug flag, which is propagated to the game clients. For example my checkers.js game dumps the board state to the console via console.log() after each move.

The GameClient class is also included in app_checkers.js and it is responsible for the interaction and rendering of the game. It must include a method show(gameSession, game) which takes the current game session from the server and an instance of the current game class (e.g. CheckersGame in checkers.js). show is called when the user chooses to play the game and also after a move is received from the server and the client needs to update the current state.

How to edit
-----------

If you're not already using Sublime Text to edit your code, download it here http://www.sublimetext.com/

