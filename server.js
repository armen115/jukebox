var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var fs = require("fs");
var file = "hello.db";
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database(file);

db.serialize(function() {
  if(!exists) {
    db.run("CREATE TABLE songs (track_id STRING, track_name STRING, track_artist STRING, votes INTEGER)");
  }
});

// tracksArray = []

// Load all files the public folder
app.use(express.static('public'))

// Route '/' to index.html 
app.get('/', function(req, res){
	console.log(__dirname)
	res.sendFile(__dirname + '/public/client.html');
});

app.get('/admin', function(req, res){
	res.sendFile(__dirname + '/public/main.html')
})

app.get('/songs', function(req, res){
  var dbMusic = db.all("SELECT * FROM songs", function(err, rows){
	  res.json(rows)
	})
})

io.on('connection', function(socket){
	console.log('A user has connected')
	
	socket.on('disconnect', function(){
		console.log('user disconnected')
	})

	socket.on('user gone', function(){
		console.log('user said bye')
	})

  currentUsers = []

	socket.on('name submit', function(name){
		currentUsers.push(name)
		console.log(name + ' has joined');
		io.emit('send names', name)
	})

  socket.on('add track', function(track_id, track_title, artist){
    db.run("INSERT INTO songs VALUES (?, ?, ?, ?)", [track_id, track_title, artist, 0]);
    console.log(`Song added: ID: ${track_id}, NAME: ${track_title}, ARTIST: ${artist}`)
    io.emit('broadcast track', track_id, track_title, artist)
  })

  socket.on('upvote', function(track_id){
    db.run("UPDATE songs SET votes = votes + 1 WHERE track_id = ?", [track_id], function(err, res){
    	if (err) {
    		console.log('vote could not be processed')
    	}
    });
  	io.emit('increase votes', track_id)
  })

  socket.on('downvote', function(track_id){
    db.run("UPDATE songs SET votes = votes + 1 WHERE track_id = ?", [track_id], function(err, res){
	  	if (err){
    		console.log('vote could not be processed')
	  	}
  	})
  	io.emit('decrease votes', track_id)
	})

})

http.listen(3000, function(){
	console.log('Listening on port 3000')
});




