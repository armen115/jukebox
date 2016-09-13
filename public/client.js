$(document).ready(function() {
  // Hide everything on page load
  $("#tableSearchResults, #search, #tablePlaylist, #pictureDiv").hide();

  // Load all songs from database on page load and build initial table 
  $.getJSON({
    url: '/songs',
    success: function(response){
      response.forEach(function(json){
        var row = `<tr id="${json.track_id}">
                   <td class="text-center">${json.track_name}</td>
                   <td class="text-center">${json.track_artist}</<td>
                   <td class="text-center">${json.votes}</td>
                   <td><button class="btn btn-primary up">Vote up</button><button class="btn btn-warning down">Vote down</button></td>
                   </tr>`;
        $('#playlist').append(row)
      })
    }
  });

  addTrackToPlaylist = function(e) {
    var track_title = e.getAttribute("data-track-title");
    var track_id = e.getAttribute("data-track-id");
    var artist = e.getAttribute("data-artist");
    var track_image = e.getAttribute("data-track-image");
    
    var $row = $(`#tablePlaylist tr#${track_id}`);

    if ($row.length == 0) {
      socket.emit('add track', track_id, track_title, artist, track_image);
      disableButton(e);
    } else if ($row.length == 1) {
      trackExisting(e);
    } 
  }

  disableButton = function(e) {
    e.disabled = true;
    e.innerHTML =`<img class="addButtonImages disabledButton" src="images/success.png"/></button>`;
  }

  trackExisting = function(e) {
    e.disabled = true;
    e.innerHTML =`<img class="addButtonImages disabledButton" src="images/music.png"/></button>`;
  }

  $('#tableSearchResults').on('click', '.addButton', function(e){ 
    addTrackToPlaylist(this);
  });

  displayResult = function(track) {
    var artist = track.artist.name;
    var track_image = track.album.cover_medium;

    var addPlaylistButton = `<button data-track-title="${track.title_short}" data-track-id=${track.id} data-artist="${artist}" data-track-image="${track_image}" class="addButton"><img class="addButtonImages" src="images/plus.png"/></button>`;

    var resultRow = `<tr id="${track.id}">
                       <td><img src="${track.album.cover_small}" class="img-responsive img-circle"></img></td>
                       <td colspan="3">
                        <ul class="list-unstyled">
                          <div class="tr_title"><li class="text-left">${track.title_short}</li></div>
                          <li class="ext-left"><small>${artist}</small></li>
                        </ul>
                       </td>
                       <td class="text-center button_td">
                         <button track=${track.id} class="play" id="pButton"></button>
                         <audio id="music" track=${track.id} controls="controls" style="visibility: hidden;width: 1px;height: 1px;">
                          <source src="${track.preview}" type="audio/ogg">
                          <source src="${track.preview}" type="audio/mpeg">
                         </audio>
                       </td>
                       <td class="img_td">${addPlaylistButton}</td>
                     </tr>`;
    $('#searchResults').append(resultRow);
  }

  displayTablePlaylist = function(){
   $("#tableSearchResults, #search").hide();
   $("#tablePlaylist").show();
   $("#pictureDiv").hide()
   $("#welcome_h1").hide()
   sort.refresh()
  }

  searchForTracks = function(){

    $("#tableSearchResults, #autocomplete, #search").show();
    $("#tablePlaylist").hide();
    $("#pictureDiv").hide()
    $("#welcome_h1").hide()

    $("#search").on("keyup", function(e) {

      var query = $("#search").val();
      var searchTrack = query.split(' ').join('+');

      if(query.length > 0) {
        $.ajax({
          url: `http://api.deezer.com/search/track?strict=on&q=${searchTrack}&limit=5&output=jsonp`,
          type: 'GET',
          dataType: "jsonp",
          success: function( response ) {

            $("#searchResults").empty();
            $("#tableSearchResults").show();

            response.data.forEach(function(track){
              displayResult(track);
            })
          } 
        });
      } else if (query.length == 0) {
        $("#searchResults").empty();
      };
    });
  }

  $('#tablePlaylist').on('click', '.up', function(){
    var track_id = this.parentElement.parentElement.getAttribute('id')
    var track_name = $(`tr#${track_id} td:nth-child(1)`).first().text()
    var artist = $(`tr#${track_id} td:nth-child(2)`).first().text()

    socket.emit('upvote', track_id, track_name, artist)
    this.disabled = true;
  });

  $('#tablePlaylist').on('click', '.down', function(){    
    var track_id = this.parentElement.parentElement.getAttribute('id')
    var track_name = $(`tr#${track_id} td:nth-child(1)`).first().text()
    var artist = $(`tr#${track_id} td:nth-child(2)`).first().text()
    var currentVotes = $(`tr#${track_id} td:nth-child(3)`).text()

    if (currentVotes > 0) { 
      socket.emit('downvote', track_id, track_name, artist)
      this.disabled = true;
    } else if (currentVotes == 0) {
      this.disabled = true;
     }  
  });

  socket.on('refresh button', function(track_id){
    var $buttonToBeRefreshed = $(`#searchResults > tr#${track_id} > td:nth-child(4) > button`);
    var $iconToBeRefreshed = $(`#searchResults > tr#${track_id} > td:nth-child(4) > button > img`);
    $iconToBeRefreshed.attr({src: "images/plus.png", class: "addButtonImages"})
    $buttonToBeRefreshed.prop('disabled', false);
  })

  $('#tableSearchResults').on('click', '#pButton', function(){
    playAudio(this);
  });

  playAudio = function(e){
    var trackNum = e.getAttribute('track');
    var audio = document.querySelector(`audio[track='${trackNum}']`);
    var pButton = document.querySelector(`button[track='${trackNum}']`);

    // start music
    if (audio.paused) {
      audio.play(e);
      // remove play, add pause
      pButton.className = "";
      pButton.className = "pause";
    } else { // pause music
      audio.pause(e);
      // remove pause, add play
      pButton.className = "";
      pButton.className = "play";
    }
  }

  hideAll = function(){
    $('#tablePlaylist, #tableSearchResults, #autocomplete, #users, #welcome_h1').hide()
    $('#pictureDiv').show()
  }

 $('#mainSearchTab').on('click', searchForTracks)
 $('#mainVoteTab').on('click', displayTablePlaylist)
 $('#mainPictureTab').on('click', hideAll)

 $('#uploadForm').submit(function(e) {
  e.preventDefault();
  var allowedFiles = [".png", ".jpg", ".jpeg", ".gif"];
  var fileUpload = $("#picture_select");
  var messageBox = $("#message");
  var regex = new RegExp("([a-zA-Z0-9\s_\\.\-:])+(" + allowedFiles.join('|') + ")$");
  if (!regex.test(fileUpload.val().toLowerCase())) {
      messageBox.html("Please select a picture!");
      return false;
  }
    $.ajax({
      url: '/uploads',
      type: 'POST',
      data: new FormData( this ),
      processData: false,
      contentType: false,
      success: function(data){
        $('#message').empty()
        $('#message').append('Upload complete!')
      }
    });
 });


});

