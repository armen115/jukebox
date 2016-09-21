$(document).ready(function() {

  var socket = io();

  // submit nickname
  $('#nickname_form').submit(function(){

    // sends the submitted name to server.js
    socket.emit('name submit', $('#nickname').val(), socket.id);
    $('#nickname_form').hide();
    $('#message_form').show();
    return false;
  })

  // display user_name to client.html
  // activated on io.emit(send name) from server.js
  socket.on('send name', function(name, id){
    $('#users').append(`<p data-id=${id}>${name} </p>`)
  })

  // delete user_name from client.html
  // activated on io.emit(delete name) from server.js
  socket.on('delete name', function(name, id){
    $(`p[data-id=${id}]`).remove();
  })

  // retrieve the names of the users upon connection
  // activated on io.emit(populate names) from server.js
  socket.on('populate names', function(names){
    $('#users').empty()
    for(var i = 0; i < names.length; i++){
      $('#users').append(`<p data-id=${names[i]["id"]}>${names[i]["name"]} </p>`)
    }
  })

  // displays the current tracks in the main playlist
  // activated on io.emit(broadcast track) from server.js
  socket.on('broadcast track', function(user_name, track_id, track_title, artist, track_image){

    var playlistRow = `<tr id="${track_id}">
                         <td class="track_info_voting">
                          <ul class="list-unstyled">
                            <div class="tr_title"><li class="text-left">${track_title}</li></div>
                            <li class="ext-left"><small class="one_one_em">${artist}</small></li>
                          </ul>
                         </td>
                         <td class="img_td_2">
                          <button class="up"><img class="addButtonImages" src="images/thumbs_up.png"/></button>
                         </td>
                         <td class="img_td_2">
                          <button class="down"><img class="addButtonImages" src="images/thumbs_down.png"/></button>
                         </td>
                         <td class="img_td_2">
                          <span class="label label-success">0</span>
                         </td>
                       </tr>`;

    $('#playlist').append(playlistRow);
  })

  // increases the votes on the track selected and refreshes the voting table
  // activated on io.emit(increase votes) from the server.js
  socket.on('increase votes', function(user_name, track_id){
    var votes = $(`tr#${track_id} td:nth-child(4)>span`).text();
    votes = Number(votes) + 1 
    $(`tr#${track_id} td:nth-child(4)>span`).html(votes);
    sort.refresh()
  })

  // decreases the votes on the track selected and refreshes the voting table
  // activated on io.emit(decrease votes) from the server.js
  socket.on('decrease votes', function(user_name, track_id){
    var votes = $(`tr#${track_id} td:nth-child(4)>span`).text();
    votes = Number(votes) - 1 
    $(`tr#${track_id} td:nth-child(4)>span`).html(votes);
    sort.refresh()
  })

  // removes the track from the voting table as soon as the track 
  // starts playing on  the main playlist
  // activated on io.emit(remove trackFromPlaylist) from the server.js
  socket.on('remove trackFromPlaylist', function(track_id){
    $(`#tablePlaylist tr#${track_id}`).remove();
  })

  // refreshes the state of the add to playlist button on the 
  // search results table if the track is now available to be
  // added to playlist ex: (track has finished playing on the playlist)
  // activated on io.emit(refresh button) from the server.js
  socket.on('refresh button', function(track_id){
    var $buttonToBeRefreshed = $(`#searchResults > tr#${track_id} > td:nth-child(4) > button`);
    var $iconToBeRefreshed = $(`#searchResults > tr#${track_id} > td:nth-child(4) > button > img`);
    $iconToBeRefreshed.attr({src: "images/plus.png", class: "addButtonImages"})
    $buttonToBeRefreshed.prop('disabled', false);
  })

});