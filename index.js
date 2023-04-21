#!/usr/bin/env node

/**
 * Module dependencies.
 */

const LOCAL_DEBUG = true;

let app = require('express')();
const debug = require('debug')('SOKKAI:server');
const https = (LOCAL_DEBUG) ? require('http') : require('https');
const fs = require('fs');
const socketIO = require('socket.io');

const compression = require('compression');
const zlib = require('zlib');
const md5 = require(__dirname+'/md5.js');
let users = {};
let rooms = {};
let ips = {"": ""};
let roomReq = {};

const ALLOWED_FILES = ['', 'index.html', 'style.css',
	'pop.mp3', 'socketio.js', 'sokkai.js', 'buzzsound.mp3',
	'NoSleep.min.js', 'lang.js', 'isOffline.js'
];


/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '5020');
app.set('port', port);

const options = (LOCAL_DEBUG) ? {} : {
	key: fs.readFileSync('/etc/letsencrypt/live/jrmsoftworks.com/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/jrmsoftworks.com/fullchain.pem'),
};


/**
 * Create HTTP server.
 */

const server = https.createServer(options, app);
const io = socketIO(server, {
	cors: {
		origin: (LOCAL_DEBUG) ? ["http://localhost:5020", "http://127.0.0.1:5020"] :
		["https://sokkai.jrmsoftworks.com", "https://www.sokkai.jrmsoftworks.com", "https://localhost:5020"]
	},
	pingTimeout: 1200000
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	let port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	let bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port;

	// Handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	let addr = server.address();
	let bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	debug('Listening on ' + bind);
}

// Allows compression of sent resources to reduce bandwidth used
app.use(compression(zlib.Z_BEST_COMPRESSION));

// Allows the server to send files to the client in response to an HTTP GET request
ALLOWED_FILES.forEach(function(a) {
	app.get('/' + a, function(req, res) {
		res.sendFile(__dirname + '/' + a);
	});
});

// Sends a 404 error if the requested resource is not found
app.use(function(req, res) {
	res.status(404).send('<title>404</title><h1>404: Oh noes! Page not Found</h1>');
});

// Sends a 500 error for internal server errors
app.use(function(req, res) {
	res.status(500).send('<title>500</title><h1>500: Oh noes! Internal server error</h1><br>If this error persists, please contact me at JRM.Softworks@gmail.com');
});

// Sanitizes the name, then checks if it is already being used for a specific room
function checkName(testName, room) {
	testName = sanitize(testName);
	room = sanitize(room);

	if (room?.length === 0 || !rooms.hasOwnProperty(room)) {
		return false;
	}

	// Returns true if username not found in current username list
	return (rooms[room].users.map(function(a) {return a.name}).indexOf(testName) === -1);
}

// Sanitization of user input to remove whitespace and clip length (input validation)
function sanitize(string) {
	string = (string + "").trim();
	if (string.length > 50) {
		return string.substring(0, 50);
	}
	return string;
}

// Adds new room object to rooms map
function addRoom(room) {
	if (room.constructor === Room) {
		rooms[room.name.toLowerCase()] = room;
	}
}

// Room object. Contains: name, list of active users, user who has buzzed, user who last buzzed, timestamp of last buzz, timestamp of current buzz
function Room(name) {
	this.name = name;
	this.users = [];
	this.buzzer = "";
	this.lastBuzzer = "";
	this.lastStamp = "";
	this.stamp = 0;

	// When the server receives a buzz, sends a lock signal to everyone but the buzzer, who gets a signal indicating it is their buzz. Includes rate limitation to prevent spamming from single user
	this.buzz = function(name) {
		if (this.buzzer === "") {
			if (this.lastBuzzer !== name || Date.now() - this.lastStamp > 500) {
				this.buzzer = name;
				this.users.forEach(function(u) {
					if (u.name === name) {
						u.socket.emit('your buzz', name, Date.now());
					}
					else {
						u.socket.emit('locked', name, Date.now());
					}
				});
				this.stamp = Date.now();
				this.lastStamp = Date.now();
				this.lastBuzzer = name;
			}
		}
	};

	// Clears the buzzer for the room. Includes rate limitation to prevent spam
	this.clear = function() {
		if (Date.now() - this.lastStamp > 100) {
			this.buzzer = "";
			this.users.forEach(function(u) {
				u.socket.emit('clear', "")
			});
			this.stamp = 0;
		}
	};

	// Adds a new user to the room. Sends new user a list of current users in the room. Sends all other users the new user
	this.addUser = function(user) {

		user.socket.emit("add names", JSON.stringify(this.users.map(function(u) {
			return u.name;
		})), JSON.stringify(this.users.map(function(u) {
			return md5.CryptoJS.MD5(u.socket.id).toString();
		})), false, Date.now());

		this.users.forEach(function(u) {
			u.socket.emit('add names', `["${user.name}"]`, `["${md5.CryptoJS.MD5(user.socket.id).toString()}"]`, true, Date.now());
		});

		if (this.buzzer.length > 0) {
			user.socket.emit("locked", this.buzzer, Date.now());
		}

		this.users.push(user);
	};

	// Removes a user from the room. Tells other users to remove the disconnected user
	this.removeUser = function (user) {

		this.users = this.users.filter((x) => x !== user);

		if (this.buzzer === user.name) {
			this.clear();
		}

		this.users.forEach(function(u) {
			u.socket.emit('remove name', user.name, Date.now(), md5.CryptoJS.MD5(user.socket.id).toString());
		});
	}
}

// Takes a room name as input and checks if the room has been locked for at least 5 seconds. If so, it clears the room (server-side backup if client-side autoclear is tampered with/fails)
function autoClear(room) {
	if (rooms[room].stamp > 0 && Date.now() - rooms[room].stamp >= 5000) {
		rooms[room].clear();
	}
}

// User object. Contains: username, room name, and socketID
function User(name, socketID, roomName) {
	users[socketID] = this;
	if (!rooms.hasOwnProperty(roomName)) {
		addRoom(new Room(roomName));
	}

	this.room = rooms[roomName];
	this.name = name;
	this.socket = getSocketByID(socketID);
}

function getSocketByID(id) {
	let out = false
	try {
		out = io.sockets.sockets.get(id);
	} catch {
		console.error(`Couldn't find socket with ID: ${id}`);
	}
	return out;
}

//generates a random room code
function genRandomRoomCode() {
	let string = "";
	const chars = "ABCDEFGHJKLMNPRSTUVWXYZ23456789";

	while (true) {
		for (let i = 0; i < 5; i++) {
			string += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		if (!rooms.hasOwnProperty(string)) {
			break;
		} else {
			string = "";
		}
	}

	return string;
}


// Socket connection stuff
io.on('connection', function(socket) {
	// Receives a buzz signal from the clients. Calls room's buzz method
	socket.on('buzz', function() {
		if (users.hasOwnProperty(socket.id)) {
			let user = users[socket.id];
			user.room.buzz(user.name);
		}
	});

	// Receives a clear signal from the clients. Calls the room's clear method
	socket.on('clear', function() {
		if (users.hasOwnProperty(socket.id)) {
			let user = users[socket.id];
			if (user.name === user.room.buzzer) {
				user.room.clear();
			}
		}
	});

	// Sends a list of rooms to clients that request it. Has rate limitations to prevent spam
	socket.on('get roomlist', function() {
		let names;
		let sendMap;

		if (!roomReq.hasOwnProperty(socket.id) || Date.now() - roomReq[socket.id] > 5000) {
			roomReq[socket.id] = Date.now();
			names = Object.keys(rooms);
			sendMap = {}
			names.forEach(function(i) {
				sendMap[rooms[i].name] = rooms[i].users.length;
			});
			getSocketByID(socket.id)?.emit('send roomlist', JSON.stringify(sendMap));
		}
	});

	// Checks if a name is usable (available and valid). Locks the buzzer if someone has already buzzed.
	// If the name is already used or is invalid, then rejects the name
	socket.on('check name', function(name) {
		let nameOK = false;
		name = sanitize(name);

		if (name.length !== 0 && checkName(name, socket.room)) {
			nameOK = true;
			let user = new User(name, socket.id, socket.room);
			user.room.addUser(user);
		}

		if (nameOK) {
			getSocketByID(socket.id)?.emit('good name', name);
		} else {
			getSocketByID(socket.id)?.emit('bad name', '');
		}

	});

	// Receives a room from the client. Checks to see if the room exists. If it does, then connects them to existing room. If it doesn't, creates a new room
	socket.on('send room', function(room) {
		room = sanitize(room);
		let cleanRoom = room.toLowerCase();

		if (cleanRoom.length === 0) {
			getSocketByID(socket.id)?.emit('null room');
			return;
		}

		if (!rooms.hasOwnProperty(cleanRoom)) {
			getSocketByID(socket.id)?.emit('no room', room);
			return;
		} else if (rooms[cleanRoom].users.length >= 41) {
			getSocketByID(socket.id)?.emit('room full', room);
			return;
		}

		socket.room = cleanRoom;
		socket.join(cleanRoom);
		getSocketByID(socket.id)?.emit('get room', rooms[cleanRoom].name);
		delete roomReq[socket.id];

	});

	socket.on('new room', function (room) {
		room = sanitize(room);
		let cleanRoom = room.toLowerCase();

		if (cleanRoom.length === 0) {
			getSocketByID(socket.id)?.emit('null room');
			return;
		}

		if (rooms.hasOwnProperty(cleanRoom)) {
			room = genRandomRoomCode();
			cleanRoom = room.toLowerCase();
			getSocketByID(socket.id)?.emit('room taken', room);
		}

		addRoom(new Room(room));
		socket.room = cleanRoom;
		socket.join(cleanRoom);
		getSocketByID(socket.id)?.emit('get room', rooms[cleanRoom].name);
		delete roomReq[socket.id];

	});

	// Responds to pings from the client
	socket.on('ping',function () {
		socket.emit('pong');
	});

	// Clears the buzzer when a user that has buzzed disconnects
	// Sends a message to all clients telling them to remove disconnected client from their lists
	// Frees up the username from the list of names and deletes the user from other maps that contain references to the socketid
	socket.on('disconnect', function() {
		let user = users[socket.id] || null;
		if (user) {
			let room = user.room;
			if (room) {
				room.removeUser(user);
				// Prevents race condition
				if (rooms.hasOwnProperty(room.name.toLowerCase()) && rooms[room.name.toLowerCase()].users.length === 0) {
					delete rooms[room.name.toLowerCase()];
				}
			}
		}

		delete users[socket.id];
		delete ips[socket.id];
		delete roomReq[socket.id];
	});
});

// Loops through the map of rooms to perform server-side autoclearing functions every second
setInterval(function() {
	Object.keys(rooms).forEach(function(e) {
		autoClear(e);
	});
}, 1000);

module.exports = {
	server: server,
	sio: io
};