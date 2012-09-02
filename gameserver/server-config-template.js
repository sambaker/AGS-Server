// ***********************************************
// Save this file locally as server-config.js and
// add your node.js and couchdb config params
// ***********************************************

(function(global, undefined) {

global.Config = {
	// Port that node server will run on
	serverPort: 8000,
	dbURL: "https://your-account.cloudant.com",
	// Couch database port
	dbPort: 443,
	dbUser: "your-user",
	dbPassword: "your-password",

	gameFolder: "./gameserver/games/"
}

})(typeof exports === 'undefined' ? this : exports)
