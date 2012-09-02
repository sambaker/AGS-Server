(function(global, undefined) {

global.Views = {
	gameserver : {
		views : {
			user_type: {
				map: function(doc) {
					if (doc.users) {
						doc.users.forEach(function(user) {
							emit([user, doc.type], doc);
						});
					}
				}
			},
			user: {
				map: function(doc) {
					if (doc.users) {
						doc.users.forEach(function(user){
							emit(user, doc);
						});
					}
				}
			},
			requested_player: {
				map: function(doc) {
					if (doc.users && doc.users.length < doc.userCount) {
						if (doc.requestedUsers && doc.requestedUsers.length) {
							for (var i = 0; i < doc.requestedUsers.length; ++i) {
								emit([doc.type,doc.requestedUsers[i]],doc);
							}
						}
					}
				}
			},
			need_players: {
				map: function(doc) {
					if (doc.users && doc.users.length < doc.userCount) {
						var diff = doc.userCount - doc.users.length;
						if (doc.requestUsers) {
							diff -= doc.requestUsers.length;
						}
						if (diff > 0) {
							emit([doc.type,doc.createdAt],doc);
						}
					}
				}
			}
		}
	}
}

})(typeof exports === 'undefined' ? this : exports)
