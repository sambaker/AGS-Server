(function(global, undefined) {

global.Views = {
	gameserver : {
		views : {
			usernames: {
				map: function(doc) {
					if (doc.name) {
						emit(doc.name, doc);
					}
				}
			}
		}
	}
}

})(typeof exports === 'undefined' ? this : exports)
