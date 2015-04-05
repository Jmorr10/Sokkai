var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var canbuzz = new Array();
var names = [""];
var rooms = ["default"];
var roomsandnames = {};
var currentbuzzer = new Array();
var currentusers = new Array();


// allows server to send all files needed for the website
files=['','index.html','style.css','pop.mp3','socketio.js','qbbuzzer.js','buzzsound.mp3'];
files.forEach(function(a){
	app.get('/'+a, function(req, res){
		res.sendFile(__dirname + '/'+a);
	});
});


// has the server start and listen on port 8080
http.listen(8080, function(){
  console.log('listening on *:8080');
});


// sanitizes the name then checks if it is already being used
function checkname(testname,room){
	testname = sanitize(testname);
	for (i =0;i<roomsandnames[room].length;i++){
		if(roomsandnames[room][i]== testname){
			return false;
		}
	}
	return true;
}
// sanitization to prevent XSS attacks
function sanitize(string){
	return string.trim().replace(/[<'"]/g,"");
}



io.on('connection', function(socket){
	// recieves a buzz
	// sends a lock signal to everyone but the buzzer, who gets a signal indicating it is their buzz
	socket.on('buzz',function(buzz){
		var name = roomsandnames[socket.room][roomsandnames[socket.room].indexOf(currentusers[socket.id])];
		if(canbuzz[socket.room]){
			socket.broadcast.to(socket.room).emit('locked',name);
			io.sockets.connected[socket.id].emit('your buzz', name)
			currentbuzzer[socket.room]= name;
			canbuzz[socket.room] = false
		}
	});
	
	// sends a clear signal to all clients and allows anyone to buzz again
	socket.on('clear',function(buzz){
		io.sockets.connected[socket.id].emit('clear',"");
		socket.broadcast.to(socket.room).emit('clear',"");
		currentbuzzer[socket.room]="";
		canbuzz[socket.room] = true
	});

	// checks if a name is useable. locks the buzzer if someone has already buzzed. 
	// broadcasts to all clients to add the new name
	// adds all current names to new client
	// if the name is already used, then rejects the name
	socket.on('check name',function(name){
		if(checkname(name,socket.room)){
			name = sanitize(name);
			io.sockets.connected[socket.id].emit('good name', name);
			if (!canbuzz[socket.room]){
				io.sockets.connected[socket.id].emit('locked', currentbuzzer[socket.room]);
			}
			socket.broadcast.to(socket.room).emit('add name',name);
			roomsandnames[socket.room].forEach(function(a){
				io.sockets.connected[socket.id].emit('add name', a);
			});
			//roomsandnames[socket.room][roomsandnames[socket.room].length] = name;
			for (var i=0;i<=roomsandnames[socket.room].length;i++){
				if(roomsandnames[socket.room][i]==undefined){
					roomsandnames[socket.room][i] = name;
					break;
				}
			}
			currentusers[socket.id] = name;
		}
		else{
			 io.sockets.connected[socket.id].emit('bad name', '');
		}
	});
	
	
	socket.on('send room',function(room){
			room = sanitize(room);
			if (room.length>0){
				socket.room = room;
				socket.join(room);
				io.sockets.connected[socket.id].emit('get room', room);
				if(rooms.indexOf(room) == -1){
					rooms[rooms.length]= room;
					canbuzz[socket.room] = true;
					roomsandnames[room]=new Array();
					//roomsandnames[room][0]= 1;
				}
				else{
					//roomsandnames[room][0]++;
				}
			}
			else{
				socket.room = "default";
				socket.join("default");
				io.sockets.connected[socket.id].emit('get room', "default");
			}
	});
	
	// clears the buzzer when a user that has buzzed disconnects
	// sends a message to all clients telling them to remove disconnected client from their lists
	// frees up the username from the list of names
	socket.on('disconnect', function(){
		var name = currentusers[socket.id];
		var room = socket.room;
		
		
		if(name == currentbuzzer[socket.room]){
			socket.broadcast.to(socket.room).emit('clear');
			canbuzz[socket.room]=true;
		}
		socket.broadcast.to(socket.room).emit('remove name',name);

		
		if(Object.keys(roomsandnames).indexOf(room)!=-1){
			delete roomsandnames[room][roomsandnames[room].indexOf(name)];	
		}
		delete currentusers[socket.id];
	});
});