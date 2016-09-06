$(document).ready(function() {
 // Hide everything on page load
 $("#tableSearchResults, #search, #tablePlaylist").hide();

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

 addTrackToPlaylist = function(e){
   var track_title = e.getAttribute("data-track-title");
   var track_id = e.getAttribute("data-track-id");
   var artist = e.getAttribute("data-artist");

   var $table = $('#tablePlaylist')[0];
   
   if ( !($table.rows['${track_id}']) ){
     socket.emit('add track', track_id, track_title, artist); 
     disableButton(e);
   } else {
     trackExisting(e);
   }     
 }

 disableButton = function(e) {
   e.disabled = true;
   e.innerHTML = "Added to playlist";
   e.setAttribute("class", "btn btn-success btn-xs");
 }

 trackExisting = function(e) {
   e.innerHTML = "Track is already in the playlist! Vote for it!";
   e.setAttribute("class", "btn btn-warning btn-xs");
 }

 $('#tableSearchResults').on('click', '.addButton', function(){ 
   addTrackToPlaylist(this);
 });
 
 displayResult = function(track) {
   var artist = track.artist.name;

   var addPlaylistButton = `<button data-track-title='${track.title}' data-track-id=${track.id} data-artist='${artist}' class="btn btn-danger btn-xs addButton">Add to Playlist</button>`;
   
   var resultRow = `<tr id="${track.id}">
                     <td class="text-center">${track.title}</td>
                     <td class="text-center">${artist}</<td>
                     <td class="text-center">
                       <audio controls>
                         <source src="${track.preview}" type="audio/ogg">
                         <source src="${track.preview}" type="audio/mpeg">
                       </audio>
                     <td class="text-center">${addPlaylistButton}</td>
                    </tr>`;
   $('#searchResults').append(resultRow);
 }

 displayTablePlaylist = function(){
   $("#tableSearchResults, #search").hide();
   $("#tablePlaylist").show();
   sort.refresh()
 }

  searchForTracks = function(){

    $("#tableSearchResults, #search").show();
    $("#tablePlaylist").hide();

    $("#search").on("keyup", function(e) {

      var query = $("#search").val();
      var searchTrack = query.split(' ').join('+');

      if(query.length > 0) {
        $.ajax({
          url: `http://api.deezer.com/search/track?q=${searchTrack}&limit=5&output=jsonp`,
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

// Assign clicks for new songs added to playlist table
 $('#tablePlaylist').on('click', '.up', function(){
     track_id = this.parentElement.parentElement.getAttribute('id')
     socket.emit('upvote', track_id)
 });

 $('#tablePlaylist').on('click', '.down', function(){
     track_id = this.parentElement.parentElement.getAttribute('id')
     socket.emit('downvote', track_id)  
 });

 $('#mainSearchTab').on('click', searchForTracks)
 $('#mainVoteTab').on('click', displayTablePlaylist)

  // Add tracks from tracksArray on page load
 socket.emit('need tracks')
 socket.on('give tracks', function(tracksArray){
  // console.log(tracksArray)
  // tracksArray.forEach(function(item){
    // track_id = item[0]
    // track_name = item[1]
    // track_artist = item[2]
    // track_votes = item[4]
    // var playlistRow = `<tr id="track_id">
    //              <td class="text-center">${track_name}</td>
    //              <td class="text-center">${track_artist}</<td>
    //              <td class="text-center"></td>
    //              <td><button class="btn btn-primary up">Vote up</button><button class="btn btn-warning down">Vote down</button></td>
    //              </tr>`;
    $('#tablePlaylist').append(playlistRow);
    console.log(playlistRow)
  // })
 })


});