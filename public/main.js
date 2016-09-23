$(document).ready(function() {
  var socket = io();

  $('#slider_seek').hide();
  $('#currentTrackDiv').hide();
     
  // Load all songs from database on page load and build initial table 
  // upon connection or refresh 
  $.getJSON({
    url: '/songs',
    success: function(response){

      response.forEach(function(json){
        var row = `<tr data-track-image="${json.track_image}" id="${json.track_id}">
                    <td class="track_image_main">
                      <img class="addButtonImages" src="${json.track_image}"/>
                    </td>

                    <td class="track_info_main">
                      <ul class="list-unstyled">
                        <div class="tr_title_main"><h5><li class="text-left">${json.track_name}</li><h5></div>
                        <li class="text-left"><h6>${json.track_artist}</h6></li>
                      </ul>
                    </td>

                    <td class="tr_votes_main">
                      <span class="label label_main label-success">${json.votes}</span>
                    </td>
                   </tr>`;

        $('#mainPlaylistRow').append(row)
      })

      sort.refresh()
      $('#mainPlaylist').footable();
      hideInitialMessage(response);
    }
  });

  // adds user actions(user liked a track, user disliked a track, user added a track) 
  // to the activity feed in the main html
  function addToActivityFeed(activity, user_name, track_id, track_name, artist){
    if (user_name == null) {
      $('#activity_feed > p').fadeOut(2000, function() {
        $(this).remove();
        $('#activity_feed').append(`<p>A user ${activity} ${track_name} by ${artist}</p>`).hide().fadeIn(2000, function() {
          $(this).fadeOut(2000);
        });
        sort.refresh();
      })
    } else {
      $('#activity_feed > p').fadeOut(2000, function() {
        $(this).remove();
        $('#activity_feed').append(`<p>${user_name} ${activity} ${track_name} by ${artist}</p>`).hide().fadeIn(2000, function() {
          $(this).fadeOut(2000);
        })
        sort.refresh();
      })
    }
  }

  // adds user status to the activity feed(user connected/disconnected)
  function userStatus(status, user_name) {
    var user_name = user_name || "A user";
    if (status == true) {
      $('#activity_feed > p').fadeOut(1000, function() {
        $(this).remove();
        $('#activity_feed').append(`<p>${user_name} is now connected</p>`).hide().fadeIn(1000, function(){
          $(this).fadeOut(1000);
        });
      })
    } else if (status == false) {
      $('#activity_feed > p').fadeOut(1000, function() {
        $(this).remove();
        $('#activity_feed').append(`<p>${user_name} is now disconnected</p>`).hide().fadeIn(1000, function(){
          $(this).fadeOut(1000);
        });
      })
    } 
  }

  // activated on io.emit(broadcast track) from server.js
  // adds the user-added track to the main playlist
  socket.on('broadcast track', function(user_name, track_id, track_name, artist, track_image){
    var row = `<tr data-track-image="${track_image}" id="${track_id}">
                <td class="track_image_main">
                  <img class="addButtonImages" src="${track_image}"/>
                </td>

                <td class="track_info_main">
                  <ul class="list-unstyled">
                    <div class="tr_title_main"><h5><li class="text-left">${track_name}<h5></li></div>
                    <li class="text-left"><h6>${artist}</h6></li>
                  </ul>
                </td>

                <td class="tr_votes_main">
                  <span class="label label_main label-success">0</span>
                </td>
               </tr>`;

    $('#mainPlaylistRow').append(row)
    $('table').trigger('footable_redraw');
    checkIfPlaylistEmpty(track_id, track_image, track_name, artist);
    addToActivityFeed('added', user_name, track_id, track_name, artist); 
  });
 
  // increases the votes on the track selected on the main playlist and refreshes it
  // activated on io.emit(increase votes) from the server.js
  socket.on('increase votes', function(user_name, track_id, track_name, artist){
    addToActivityFeed('liked', user_name, track_id, track_name, artist);
    var votes = $(`#mainPlaylistRow>tr#${track_id}>td:nth-child(3)>span`).text()
    var votes = Number(votes) + 1
    $(`#mainPlaylistRow>tr#${track_id}>td:nth-child(3)>span`).text(votes) 
  })

  // decreases the votes on the track selected on the main playlist and refreshes it
  // activated on io.emit(decrease votes) from the server.js
  socket.on('decrease votes', function(user_name, track_id, track_name, artist){
    addToActivityFeed('disliked', user_name, track_id, track_name, artist);
    var votes = $(`#mainPlaylistRow>tr#${track_id}>td:nth-child(3)>span`).text()
    var votes = Number(votes) - 1
    $(`#mainPlaylistRow>tr#${track_id}>td:nth-child(3)>span`).text(votes)
  })

  // appends user_name to main.html
  // activated on io.emit(send name) from server.js
  socket.on('send name', function(name, id){
    $('#users').append(`<p data-id=${id}>${name} </p>`)
    userStatus(true, name);
  })
  
  // deletes user_name from main.html
  // activated on io.emit(delete name) from server.js
  socket.on('delete name', function(name, id){
    userStatus(false, name);
  })

  // displays user name on the activity feed
  // once a user has connected
  socket.on('user connected', function(name){
    userStatus(true, name);
  }) 

  // remove track from the main playlist
  // activated on io.emit(remove trackFromPlaylist) from server.js
  socket.on('remove track from playlist', function(track_id){
    $(`#tablePlaylist tr#${track_id}`).remove();
  })

  // retrieve the names of the users upon connection or refresh
  // activated on io.emit(populate names) from server.js
  socket.on('populate names', function(names){
    $('#users').empty()
    for(var i = 0; i < names.length; i++){
      $('#users').append(`<p data-id=${names[i]["id"]}>${names[i]["name"]} </p>`)
    }
  })

  // functionality for the picture upload ------
  var counter = 1

  // activated from io.emit(picture upload)
  socket.on('picture upload', function(picture, filename, height, width){
    var posx = 0
    var posY = 0 

    // calculates the position where the uploaded image 
    // will be positioned on the main.html
    function calcPosition() {
      var row = document.getElementById(`${filename}`).parentElement.parentElement.getBoundingClientRect();
      var section = document.getElementById(`${filename}`).parentElement.getBoundingClientRect();
      posX = Math.floor(Math.random()*(section.width - width))
      posY = Math.floor(Math.random()*(row.height - height))
      console.log("width " + width)
      console.log("height:" + height)
    }

    // posts the uploaded image to the main.html
    if ( counter % 2 == 0 ) {
      $('#section_left').empty().append($(`<img id="${filename}" class="user_pic" src="/uploads/${picture}">`).hide().fadeIn('slow', function(){
        $(this).delay(3200).fadeOut('slow')
      }));
      $(`<img id="${filename}" class="user_pic" src="/uploads/${picture}">`)
      calcPosition();
      $(`#${filename}`).css({ 'position': 'absolute', 'left': posX, 'top': posY })
    } 
    else if ( counter % 1 == 0 ) {
      $('#section_right').empty().append($(`<img id="${filename}" class="user_pic" src="/uploads/${picture}">`).hide().fadeIn('slow', function(){
        $(this).delay(3200).fadeOut('slow')
      }));
      $(`<img id="${filename}" class="user_pic" src="/uploads/${picture}">`)
      calcPosition();
      $(`#${filename}`).css({ 'position': 'absolute', 'left': posX, 'top': posY })
    } 
    counter++
  })
  //----------- 

  // functionality for the music player from Deezer----------

  // initializes the player
  DZ.init({
    appId  : '190182',
    channelUrl : 'https://example@example.com',
    player : {
      // container : 'player',
      // playlist : false,
      // size: 'big',
      onload : onPlayerLoaded
    }
  });

  // functionality for the track slider to enable the admin 
  // to advance the track manually
  $("#slider_seek").click(function(evt,arg){
    var left = evt.offsetX;
    DZ.player.seek((evt.offsetX/$(this).width()) * 100);
  });

  // hides the initial message "There are no songs in the playlist yet..."
  function hideInitialMessage(response) { 
    if (response.length == 0) {
      $("#initial_message").show(); 
    } else if (response.length > 0) {
      $("#initial_message").hide(); 
    }
  }

  // checks if the playlist is empty upon refresh or load
  // automatically starts player if there is a track in the queue
  function checkIfPlaylistEmpty(track_id, track_image, track_name, artist) {
    var playlist = $("#mainPlaylist>td")
    var current_track = $("#currentTrack").text()
    
    if ( (playlist.length == 0) && (current_track == "") ) {
      startPlayer(track_id, track_image, track_name, artist); 
    } 
  }

  // loads the track image from the Deezer API
  function loadTrackImage(track_image){
    $('.album_art > img').fadeOut(2000, function() {
      $('.album_art > img').css("height", "200px");
      $("#current_track_image").attr('src', `${track_image}`).hide().fadeIn(2000);
    })
  }

  // displays the title and artist of the current track being played
  function displayCurrentTrack(track_title, artist) {
    var current_track = `<h4 id="currentTrack" class="current_track_div">${track_title} <small>By ${artist}</small></h4>`
    $("#currentTrack").replaceWith(current_track);
  }

  // check if there is a next track in the queue
  // if there is a next track in the queue it loads that track to the player and
  // the player starts playing otherwise the player will be on standby
  function checkIfNextTrackEmpty(track_id, track_image, track_title, artist){
    if ( !(isNaN(track_id)) ) {
      startPlayer(track_id, track_image, track_title, artist); 
    } else if (isNaN(track_id)) {
      $("#slider_seek, #current_track_image").hide();
      $("#currentTrack").text("");
      $("#initial_message").show();
    }
  }
  
  // function to start the player
  function startPlayer(track_id, track_image, track_title, artist){
    $("#initial_message").hide();
    $('#slider_seek').show();
    $('#currentTrackDiv').show();
    $('#currentTrackDiv').css("animation", "growShake 1s infinite");

    DZ.player.playTracks([track_id], function(){
      $(`#${track_id}`).remove();
      loadTrackImage(track_image);
      displayCurrentTrack(track_title, artist);
      socket.emit('delete track', track_id)
      $('table').trigger('footable_redraw');
    });  
  }

  // function to autoplay on load or refresh as long
  // as the main playlist is not empty
  function autoPlayOnLoad() {
    var start_track_title = $("#mainPlaylist tbody tr:nth-child(1)>td:nth-child(2)>ul>div").text();
    var start_artist = $("#mainPlaylist tbody tr:nth-child(1)>td:nth-child(2)>ul>li").text();
    var start_track_id = parseInt($("#mainPlaylist tbody tr:nth-child(1)").attr('id'));
    var start_track_image = $("#mainPlaylistRow tr:nth-child(1)").data('track-image');

    checkIfNextTrackEmpty(start_track_id, start_track_image, start_track_title, start_artist); 
  };

  // function that will be called once the Deezer player
  // is initialized
  function onPlayerLoaded() {
    $("#initial_message").hide();
    autoPlayOnLoad();
    DZ.Event.subscribe('track_end', function(){ 
      var track_title = $("#mainPlaylist tbody tr:nth-child(1)>td:nth-child(2)>ul>div").text();
      var artist = $("#mainPlaylist tbody tr:nth-child(1)>td:nth-child(2)>ul>li").text();
      var track_id = parseInt($("#mainPlaylist tbody tr:nth-child(1)").attr('id'))
      var track_image = $("#mainPlaylistRow tr:nth-child(1)").data('track-image')
      $('table').trigger('footable_redraw');
      checkIfNextTrackEmpty(track_id, track_image, track_title, artist)
    })   
    DZ.Event.subscribe('player_position', function(arg){
      $("#slider_seek").find('.bar').css('width', (100*arg[0]/arg[1]) + '%');
    });
  }

  // auto table sort function which sorts the tracks depending on the number of votes
  sort = new Tablesort(document.getElementById('mainPlaylist'), {
           descending: true
         });

});