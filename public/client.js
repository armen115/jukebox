$(document).ready(function() {

      playDefault = function(){
        // 222240
        var default_src = `https://embed.spotify.com/?uri=spotify:trackset:PREFEREDTITLE:2xmJNIkGmYBVoiu1WqA9il`;
        $("#spotifyPlayer").attr("src", default_src);
      };

      playNow = function(track) {

      }
      
      addTrackToPlaylist = function(track_id, track_name, artist){
        // $(this).prop('disabled', true);
        getTrackDuration(track_id);

        socket.emit('add track', track_id, track_name, artist);

        // var src = `https://embed.spotify.com/?uri=spotify:trackset:PREFEREDTITLE:${current_track}`;
        
        // $("#spotifyPlayer").attr("src", src);
        
      }

      displayResult = function(track) {
        var artists = [];
        
        track.artists.forEach(function(artist){
          artists.push(artist.name);
        })

        var artist = artists.join(' / ');

        var addToPlaylist = `<button onclick="addTrackToPlaylist('${track.id}', '${track.name}', '${artist}')" class="btn btn-danger btn-xs">Add to Playlist</button>`;
        var resultRow = `<tr id="${track.id}">
                    <td class="text-center">${track.name}</td>
                    <td class="text-center">${artist}</<td>
                    <td class="text-center">
                      <audio controls>
                        <source src="${track.preview_url}" type="audio/ogg">
                        <source src="${track.preview_url}" type="audio/mpeg">
                      </audio>
                    <td class="text-center">${addToPlaylist}</td>
                   </tr>`;
        $('#searchResults').append(resultRow);
      }

      searchForTracks = function(){

        $("#tableResults, #search").show();
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
                $("#tableResults").show();
                response.tracks.items.forEach(function(track){
                  displayResult(track);
                })

              },
              error: function(error) {
                console.log(error); 
              }
            }); 
          }
        });

      }

      vote = function(){
        $("#tableResults, #search").hide();
        $("#tablePlaylist").show();
        // get the playlist from the main app 
        console.log("Gets the playlist")       

      }

      getTrackDuration = function(track_id){
        $.ajax({
          url: `https://api.spotify.com/v1/tracks/${track_id}`,
          method: 'GET',
          success: function(response) {     

            console.log(response.duration_ms)

          },
          error: function(error) {
            console.log(error); 
          }
        }); 
      }

      playDefault();

      $("#tableResults, #search, #tablePlaylist").hide();

      initUpClick = function() { 
        document.querySelector('.up').onclick = function() {
          track_id = this.parentElement.parentElement.getAttribute('id')
          socket.emit('upvote', track_id) 
        }
      }

    });
