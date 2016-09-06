var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


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

io.on('connection', function(socket){
	console.log('A user has connected')
	
	socket.on('disconnect', function(){
		console.log('user disconnected')
	})

	socket.on('name submit', function(name){
		console.log(name + ' has joined');
		io.emit('name submit', name)
	})

  socket.on('add track', function(track_id, track_title, artist){
    console.log(`Song added: ID: ${track_id}, NAME: ${track_title}, ARTIST: ${artist}`)
    io.emit('broadcast track', track_id, track_title, artist)
  })

  socket.on('upvote', function(track_id){
  	io.emit('increase votes', track_id)
  })

  socket.on('downvote', function(track_id){
  	io.emit('decrease votes', track_id)
  })
})

http.listen(3000, function(){
	console.log('Listening on port 3000')
});




