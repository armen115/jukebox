$(document).ready(function() {
 $("#tableSearchResults, #search, #tablePlaylist").hide();

 addTrackToPlaylist = function(e){
   var track_name = e.getAttribute("data-track-name");
   var track_id = e.getAttribute("data-track-id");
   var artist = e.getAttribute("data-artist");

   var $table = $('#tablePlaylist')[0];

   if ( !($table.rows[`${track_id}`]) ){
     getTrackDuration(track_id, function(response){
       var track_duration = response.duration_ms;
       socket.emit('add track', track_id, track_name, artist, track_duration); 
     })

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

 // Adds click event handler on buttons. You can do the same thing for the upvote/downvote.
 $('#tableSearchResults').on('click', '.addButton', function(){ 
   addTrackToPlaylist(this);
 });
 
 displayResult = function(track) {
   var artists = [];
   
   track.artists.forEach(function(artist){
     artists.push(artist.name);
   })

   var artist = artists.join(' / ');

   var addPlaylistButton = `<button data-track-name=${track.name} data-track-id=${track.id} data-artist=${artist} class="btn btn-danger btn-xs addButton">Add to Playlist</button>`;
   
   var resultRow = `<tr id="${track.id}">
                     <td class="text-center">${track.name}</td>
                     <td class="text-center">${artist}</<td>
                     <td class="text-center">
                       <audio controls>
                         <source src="${track.preview_url}" type="audio/ogg">
                         <source src="${track.preview_url}" type="audio/mpeg">
                       </audio>
                     <td class="text-center">${addPlaylistButton}</td>
                    </tr>`;
   $('#searchResults').append(resultRow);
 }


 displayTablePlaylist = function(){
   $("#tableSearchResults, #search").hide();
   $("#tablePlaylist").show();
 }

 searchForTracks = function(){

   $("#tableSearchResults, #search").show();
   $("#tablePlaylist").hide();

   $("#search").on("keyup", function(e) {

     var query = $("#search").val();
     var searchTrack = query.split(' ').join('+');

     if(query.length > 0) {

       $.ajax({
         url: `https://api.spotify.com/v1/search?q=${searchTrack}&type=track&market=CA&limit=5&offset=0`,
         method: 'GET',
         success: function(response) {  

           $("#searchResults").empty();
           $("#tableSearchResults").show();

           response.tracks.items.forEach(function(track){
             displayResult(track);
           })

         },
         error: function(error) {
           console.log(error); 
         }
       });

     } else if (query.length == 0) {
       $("#searchResults").empty();
     }
   });

 }

 getTrackDuration = function(track_id, callback){
   $.ajax({
     url: `https://api.spotify.com/v1/tracks/${track_id}`,
     method: 'GET',
     success: callback
   }); 
 }

 $('#tablePlaylist').on('click', '.up', function(){
     track_id = this.parentElement.parentElement.getAttribute('id')
     socket.emit('upvote', track_id) 
 });

 $('#mainSearchTab').on('click', searchForTracks)
 $('#mainVoteTab').on('click', displayTablePlaylist)

});