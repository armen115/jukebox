var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var fs = require("fs");
var file = "hello.db";
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();

var mime = require('mime')
var multer = require('multer')
var storage = multer.diskStorage({
	destination: function(req, file, callback){
		callback(null, './public/uploads');
	},
	filename: function(req, file, callback){
		callback(null, file.fieldname + '-' + Date.now() + '.' + mime.extension(file.mimetype))
	}
})
var upload = multer({ storage: storage }).single('userPhoto')
var db = new sqlite3.Database(file);
db.serialize(function() {
  if(!exists) {
    db.run("CREATE TABLE songs (track_id STRING, track_name STRING, track_artist STRING, votes INTEGER)");
  }
});

// Load all files the public folder
app.use(express.static('public'))

// Route '/' to index.html 
app.get('/', function(req, res){
	console.log(__dirname)
	res.sendFile(__dirname + '/public/client.html');
});

app.post('/uploads', function(req, res){
	upload(req, res, function(err){
		if (err){
			return res.end('Error uploading file.')
		}
		res.sendStatus(200)
		io.emit("picture upload", req["file"]["filename"])
	})	
})

app.get('/admin', function(req, res){
	res.sendFile(__dirname + '/public/main.html')
})

app.get('/songs', function(req, res){
  var dbMusic = db.all("SELECT * FROM songs", function(err, rows){
	  res.json(rows)
	})
})

app.get('/setup', function(req, res){
	res.sendFile(__dirname + '/public/setup.html')
})


// Store objects of current users in this array
currentUsers = []

io.on('connection', function(socket){
	console.log('A user has connected')
	
	function getUserInfo() {
		var name, id;
		for(var i = 0; i < currentUsers.length; i++ ) {
			if (socket.id.replace('/#','') == currentUsers[i]['id']) {
				name = currentUsers[i]['name'],
				id = currentUsers[i]['id']
			}
		}
		return {
			name: name,
			id: id
		}
	}

	socket.on('disconnect', function(){
		var user = getUserInfo();
		console.log(user.name + ' disconnected')
		io.emit('delete name', user.name, user.id)
	})

	socket.on('name submit', function(name, id){
		var obj = {	name: name,
								id: id
							}
		currentUsers.push(obj)
		console.log(name + ' has joined');
		io.emit('send names', name, id)
	})

  socket.on('add track', function(track_id, track_title, artist){
    db.run("INSERT INTO songs VALUES (?, ?, ?, ?)", [track_id, track_title, artist, 0]);
    console.log(`Song added: ID: ${track_id}, NAME: ${track_title}, ARTIST: ${artist}`)
    io.emit('broadcast track', track_id, track_title, artist)
  })

  socket.on('delete track', function(track_id){
    db.run("DELETE FROM songs WHERE track_id = ?", [track_id]);
    console.log(`Song deleted: ID: ${track_id}`)
  })

  socket.on('upvote', function(track_id){
    db.run("UPDATE songs SET votes = votes + 1 WHERE track_id = ?", [track_id], function(err, res){
    	if (err) {
    		console.log('vote could not be processed')
    	}
    });
    var user = getUserInfo();
  	io.emit('increase votes', user.name, track_id)
  })

  socket.on('downvote', function(track_id){
    console.log(track_id)
    db.run("UPDATE songs SET votes = votes + 1 WHERE track_id = ?", [track_id], function(err, res){
	  	if (err){
    		console.log('vote could not be processed')
	  	}
  	})
  	var user = getUserInfo();
  	console.log(user.name)
  	io.emit('decrease votes', user.name, track_id)
	})

})

http.listen(3000, function(){
	console.log('Listening on port 3000')
});




