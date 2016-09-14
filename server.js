var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path')
var fs = require("fs");
var os = require( 'os' );
var file = "hello.db";
var PORT = 3000
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();
var sharp = require('sharp')
var mime = require('mime')
var multer = require('multer')
var publicStorage = multer.diskStorage({
	destination: function(req, file, callback){
		callback(null, './public/uploads');
	},
	filename: function(req, file, callback){
		callback(null, file.fieldname + '-' + Date.now() + '.' + mime.extension(file.mimetype))
	}
})
var publicUpload = multer({ storage: publicStorage },{limits: {}}).single('userPhoto')
var setupStorage = multer.diskStorage({
	destination: function(req, file, callback){
		callback(null, './public/images');
	},
	filename: function(req, file, callback){
		callback(null, file.fieldname + '-' + Date.now() + '.' + mime.extension(file.mimetype))
	}
})
var setupUpload = multer({ storage: setupStorage },{limits: {}}).single('setupPhoto')

var db = new sqlite3.Database(file);
db.serialize(function() {
  if(!exists) {
    db.run("CREATE TABLE songs (track_id STRING, track_name STRING, track_artist STRING, votes INTEGER, track_image STRING)");
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
	publicUpload(req, res, function(err){
		if (err){
			return res.end('Error uploading file.')
		}
		res.sendStatus(200)
		// console.log(req)
		sharp(req["file"]["path"]).resize(300, 200).max().toFile(`public/uploads/SMALL-${req["file"]["filename"]}`).then(function(){

			pictureName = `SMALL-${req["file"]["filename"]}`
			sharp(`public/uploads/${pictureName}`).metadata(function(err, metadata){ 
				
			io.emit("picture upload", pictureName, req["file"]["filename"].replace(/\.[^/.]+$/, ""), metadata.height, metadata.width)
			})
			
		})
	})	
})

app.post('/setupWallpaper', function(req, res){
	setupUpload(req, res, function(err){
		console.log(req['file']['filename'])
		if (err){
			return res.end('Error uploading file.')
		}
		var newString = "background: url(/images/" + req['file']['filename'] + ") no-repeat center center fixed;" 
		res.sendStatus(200)
		fs.readFile('public/main.css', 'utf8', function(err, data){
		var result = data.replace(/background: url\(\/images\/.+\) no-repeat center center fixed;/g, newString )
			if (err) {
				console.log(err)
			}
			fs.writeFile('public/main.css', result, 'utf8', function(err){
				if (err){
					console.log(err)
				}
				console.log("done")
			})
		})
	})
})

app.post('/setupLogo', function(req, res){
	
	setupUpload(req, res, function(err){
		if (err){
			return res.end('Error uploading file.')
		}
		var newString = ("<img id='mic' src='/images/" + req['file']['filename'] + "'>")
		res.sendStatus(200)
		fs.readFile('public/main.html', 'utf8', function(err, data){
		var result = data.replace(/<img id='mic' src='.+'>/g, newString )
			if (err) {
				console.log(err)
			}
			fs.writeFile('public/main.html', result, 'utf8', function(err){
				if (err){
					console.log(err)
				}
			})
		})
		fs.readFile('public/client.html', 'utf8', function(err, data){
		var result = data.replace(/<img id='mic' src='.+'>/g, newString )
			if (err){
				console.log(err)
			}
			fs.writeFile('public/client.html', result, 'utf8', function(err){
				if (err){
					console.log(err)
				}
			})
		})	
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
  io.emit('user connected', null)
  io.emit('populate names', currentUsers)
	
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
		for (var i = 0; i < currentUsers.length; i++){
			if (currentUsers[i]["id"] == user.id){
				currentUsers.splice(i, 1)
			}
		}
		console.log(user.name + ' disconnected')
		io.emit('populate names', currentUsers)
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

  socket.on('add track', function(track_id, track_title, artist, track_image){
    db.run("INSERT INTO songs VALUES (?, ?, ?, ?, ?)", [track_id, track_title, artist, 0, track_image]);
    console.log(`Song added: ID: ${track_id}, NAME: ${track_title}, ARTIST: ${artist}, IMAGE: ${track_image}`)
    var user = getUserInfo();
    io.emit('broadcast track', user.name, track_id, track_title, artist, track_image)
  })

  socket.on('delete track', function(track_id){
    db.run("DELETE FROM songs WHERE track_id = ?", [track_id]);
    console.log(`Song deleted: ID: ${track_id}`)
    io.emit('remove trackFromPlaylist', track_id)
    io.emit('refresh button', track_id)
  })

  socket.on('upvote', function(track_id, track_name, artist){
    db.run("UPDATE songs SET votes = votes + 1 WHERE track_id = ?", [track_id], function(err, res){
    	if (err) {
    		console.log('vote could not be processed')
    	}
    });
    var user = getUserInfo();
  	io.emit('increase votes', user.name, track_id, track_name, artist)
  })

  socket.on('downvote', function(track_id, track_name, artist){
    console.log(track_id)
    db.run("UPDATE songs SET votes = votes - 1 WHERE track_id = ?", [track_id], function(err, res){
	  	if (err){
    		console.log('vote could not be processed')
	  	}
  	})
  	var user = getUserInfo();
  	console.log(user.name)
  	io.emit('decrease votes', user.name, track_id, track_name, artist)
	})

})

// var networkInterfaces = os.networkInterfaces();
// console.log("Connect to: " + networkInterfaces["wlan0"][0]["address"] + ":" + PORT + " to start adding songs!")

http.listen(PORT, function(){
	console.log('Listening on port 3000')
});
