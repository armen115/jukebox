$(document).ready(function() {
  var socket = io();

  // Hide everything on page load
  $("#tableSearchResults, #search, #tablePlaylist, #pictureDiv").hide();

  // Load all songs from database on page load and build initial table 
  // upon connection or refresh
  $.getJSON({
    url: '/songs',
    success: function(response){
      response.forEach(function(json){
        var row = `<tr id="${json.track_id}">
                     <td class="track_info_voting">
                      <ul class="list-unstyled">
                        <div class="tr_title"><li class="text-left">${json.track_name}</li></div>
                        <li class="ext-left"><small>${json.track_artist}</small></li>
                      </ul>
                     </td>
                     <td class="img_td_2">
                      <button class="up"><img class="addButtonImages" src="images/thumbs_up.png"/></button>
                     </td>
                     <td class="img_td_2">
                      <button class="down"><img class="addButtonImages" src="images/thumbs_down.png"/></button>
                     </td>
                     <td class="img_td_2">
                      <span class="label label-success">${json.votes}</span>
                     </td>
                   </tr>`;            
        $('#playlist').append(row)
      })
    }
  });

  // adds track to main playlist
  addTrackToPlaylist = function(e) {
    var track_title = e.getAttribute("data-track-title");
    var track_id = e.getAttribute("data-track-id");
    var artist = e.getAttribute("data-artist");
    var track_image = e.getAttribute("data-track-image");
    
    var $row = $(`#tablePlaylist tr#${track_id}`);

    if ($row.length == 0) {

      // sends the track to server.js
      socket.emit('add track', track_id, track_title, artist, track_image);
      disableButton(e);
    } else if ($row.length == 1) {
      trackExisting(e);
    } 
  }

  // disables the add-to-playlist button
  disableButton = function(e) {
    e.disabled = true;
    e.innerHTML =`<img class="addButtonImages disabledButton" src="images/success.png"/></button>`;
  }

  // changes the add-to-playlist button 
  // to indicate that the track selected is already
  // on the main playlist
  trackExisting = function(e) {
    e.disabled = true;
    e.innerHTML =`<img class="addButtonImages disabledButton" src="images/music.png"/></button>`;
  }

  // binds the click event on the add-to-playlist button while being
  // displayed on the search results table
  $('#tableSearchResults').on('click', '.addButton', function(e){ 
    addTrackToPlaylist(this);
  });

  // searches for tracks using the Deezer API
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
          url: `https://api.deezer.com/search/track?strict=on&q=${searchTrack}&limit=5&output=jsonp`,
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

  // displays the search results on the search results table
  displayResult = function(track) {
    var artist = track.artist.name;
    var track_image = track.album.cover_medium;

    var addPlaylistButton = `<button data-track-title="${track.title_short}" data-track-id=${track.id} data-artist="${artist}" data-track-image="${track_image}" class="addButton"><img class="addButtonImages" src="images/plus.png"/></button>`;

    var resultRow = `<tr id="${track.id}">
                       <td><img src="${track.album.cover_small}" class="img-responsive img-circle"></img></td>
                       <td class="track_info_results" colspan="3">
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

  // displays the tracks on the playlist when the
  // vote button is clicked
  displayTablePlaylist = function(){
   $("#tableSearchResults, #search").hide();
   $("#tablePlaylist").show();
   $("#pictureDiv").hide()
   $("#welcome_h1").hide()
   sort.refresh()
  }

  // function for the upvote
  $('#tablePlaylist').on('click', '.up', function(){
    var track_id = this.parentElement.parentElement.getAttribute('id');
    var track_name = $(`tr#${track_id} td:nth-child(1)>ul>div>li`).text();
    var artist = $(`tr#${track_id} td:nth-child(1)>ul>li`).text()

    // sends the upvote to server.js
    socket.emit('upvote', track_id, track_name, artist)

    this.disabled = true;
    this.children[0].className += " disabledButton";
  });

  // function for the downvote
  $('#tablePlaylist').on('click', '.down', function(){    
    var track_id = this.parentElement.parentElement.getAttribute('id')
    var track_name = $(`tr#${track_id} td:nth-child(1)>ul>div>li`).text();
    var artist = $(`tr#${track_id} td:nth-child(1)>ul>li`).text()
    var currentVotes = $(`tr#${track_id} td:nth-child(4)>span`).text()

    if (currentVotes > 0) { 

      // sends the downvote to server.js
      socket.emit('downvote', track_id, track_name, artist)

      this.disabled = true;
      this.children[0].className += " disabledButton";
    } else if (currentVotes == 0) {
      var $this = this;
      $this.children[0].className += " disabledButton";

      setTimeout(function () { 
        $this.children[0].classList.remove('disabledButton');
      }, 100);
    }  
  });

  // binds the click event on the preview button while being
  // displayed on the search results table
  $('#tableSearchResults').on('click', '#pButton', function(){
    playAudio(this);
  });

  // function to preview the track on the search results table
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

  // hides the other tables when post a picture button is clicked
  hideAll = function(){
    $('#tablePlaylist, #tableSearchResults, #autocomplete, #users, #welcome_h1').hide()
    $('#pictureDiv').show()
  }

  // function for clicking on the Search button
  $('#mainSearchTab').on('click', searchForTracks)

  // function for clicking the Vote buton
  $('#mainVoteTab').on('click', displayTablePlaylist)

  // function for clicking the Post A Picture! button
  $('#mainPictureTab').on('click', hideAll)

  // function for posting a picture
  $('#uploadForm').submit(function(e) {
    e.preventDefault();
    var allowedFiles = [".png", ".jpg", ".jpeg", ".gif"];
    var fileUpload = $("#picture_select");
    var messageBox = $("#message");
    var regex = new RegExp("([a-zA-Z0-9\s_\\.\-:])+(" + allowedFiles.join('|') + ")$");

    // validity check for the file being posted
    if (!regex.test(fileUpload.val().toLowerCase())) {
      messageBox.html("Please select a picture!");
      return false;
    }

    // uploading the picture to /public/uploads folder
    $('#picture_select_submit').val("Uploading..")
    $.ajax({
      url: '/uploads',
      type: 'POST',
      data: new FormData( this ),
      processData: false,
      contentType: false,
      success: function(data){
        $('#message').empty()
        $('#message').append('Upload complete!')
        $('#picture_select_submit').val("Upload")
      }
    });
  });

  // auto table sort function which sorts the tracks depending on the number of votes 
  sort = new Tablesort(document.getElementById('tablePlaylist'),{
           descending: true
         });

});

