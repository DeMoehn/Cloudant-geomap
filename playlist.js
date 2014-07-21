$( document ).ready(function() {

  // -- Global Variables --
  var baseUrl = "https://" + user + ":" + pass + "@" + user + ".cloudant.com/" + db;

  // -- Functions --

  // - Read the Playlists for the DropDown -
  function refreshDropdown(playl) {
    $("#playlists").empty(); // Clear the DropDown

    var docUrl = baseUrl + "/"+"_design/Playlist/_view/getNames"; // URL of the Playlists view
    $.ajax({ // Start AJAX Call to Playlists view
      url: docUrl,
      xhrFields: { withCredentials: true },
      type: "GET",
      error: errorHandler
    }).done(function( data ) { // After the call is done
      var doc = JSON.parse(data); // Parse JSON Data into Obj. doc
      for(var i=0; i < doc.rows.length; i++) { // Go through each Document and insert into Dropdown
        $("#playlists").append(new Option(doc.rows[i].id, doc.rows[i].id)); // Set Value and Text of Select Option
      }
    });

    if(playl) { // If new Playlist was created
      $("#playlists").selectmenu('refresh'); // Refresh Dropdown
      $("#playlists").val(playl); // Select the Value of the new Playlist
      readPlaylists(); // Read the Songs of the new Playlist
    }
  }

  // - Create Autocomplete for artists-field -
  function artistAutocomplete() {
    var docUrl = baseUrl + "/"+"_design/Songs/_view/showArtists?group=true"; // URL to the Artists View
    var availableArtists = []; // Array for all Artists

      $.ajax({ // AJAX Call to load all Artists
        url: docUrl,
        xhrFields: { withCredentials: true },
        type: "GET",
        error: errorHandler
      }).done(function( data ) { // After the call is done
        var doc = JSON.parse(data); // Parse the JSON data
        for(var i=0; i < doc.rows.length; i++) {
          availableArtists.push(doc.rows[i].key); // Push the Artist to the Array
        }
      });

      $( "#artistname" ).autocomplete({ // Activate Autocomplete
        source: availableArtists
      });
  }

  // - Create delete button for a song -
  function createDeleteButtons() {
    $(".delete-icon").css('cursor', 'pointer'); // Change cursor

    $(".delete-icon").hover(function () {
      this.src = 'img/delete_hover.png'; // Show this image on hover
    }, function () {
      this.src = 'img/delete_icon.png'; // Show this image when normal
    });

    $(".delete-icon").click(function () { // Delete this song
        goThroughSonglist($(this).closest("li").index()); // Go trough song-list an exclude this one
    });
  }

  // - Iterate through the Songs and save them -
  function goThroughSonglist(deleter) {
    var songs = []; // Array for all songs
    var artist, song, id; // Define variables

    for(var p=0; p < $("#sortable li").length; p++) { // For all songs in the <ul> item
      if(p !== deleter) { // if the song should not be deleted
        artist = $("#sortable li:eq("+p+")").find("#artist").text(); // Search for div id=artist in <li>
        song = $("#sortable li:eq("+p+")").find("#song").text(); // Search for div id=song in <li>
        songs.push({"artist":artist,"title":song, "position":p}); // Push song in the array
      }
    }

    saveSortedSongs(songs); // Save the songs array
  }

  // - Save the song list after it has been reordered -
  function saveSortedSongs(songs) {
    var playlist = $( "#playlists" ).val(); // Get the recent playlist
    var docUrl = baseUrl + "/" + playlist;

    $.ajax({ // AJAX Call to GET the recent playlist
      url: docUrl,
      xhrFields: { withCredentials: true },
      type: "GET",
      error: errorHandler
    }).done(function( data ) { // After the call is done
      var doc = JSON.parse(data); // Parse data into Object
      doc.songs = songs;  // Replace songs - Array with the songs in the JSON

      $.ajax({ // AJAX Call to Save the recent playlist
        url: docUrl,
        xhrFields: { withCredentials: true },
        type: "PUT",
        data: JSON.stringify(doc),
        contentType: "application/json",
        error: errorHandler
      }).done(function( data ) { // After the call is done
        var doc2 = JSON.parse(data); // Parse data into Object
        $.JSONView(doc, $("#output-data")); // Create JSON optimized text-output
        showStatus("good", "<b>Status:</b> Updated Songs successfull"); // Show Status Message
        readPlaylists(); // Read Playlist again to verify update
      });
    });
  }

  // - Read the current playlist -
  function readPlaylists()  {
    var readplaylist = $( "#playlists" ).val(); // get current playlist
    var docUrl = baseUrl + "/" + readplaylist;

    $.ajax({ // AJAX Call to get playlist
      url: docUrl,
      xhrFields: { withCredentials: true },
      type: "GET",
      error: errorHandler
    }).done(function(data) { // if done, push data to function "readPlaylist"
      var doc = JSON.parse(data);
      $.JSONView(doc, $("#output-data")); // Create JSON optimized text-output
      showStatus("good", "<b>Status:</b> Reading successfull"); // Show Status Message
      handlePlaylist(doc); // Read all Songs in the playlist
    });
  }

  // -  Shows all Songs in a Playlist -
  function handlePlaylist(doc) {
    $( "#sortable" ).empty(); // Clears all Songs
    $( "#songs-playlist" ).text("Songs of "+doc._id); // Changes the title

    if(doc.songs.length > 0) { // If there are songs in the playlist
      for(var i = 0; i < doc.songs.length; i++) { // Add every Song to the Playlist
        $( "#sortable" ).append('<li class="song-item"><div class="song-list" id='+doc._id+'><div id="number" style="display:inline">'+(i+1)+'</div>) <div id="artist" style="display:inline">'+doc.songs[i].artist+'</div> - <div id="song" style="display:inline">'+doc.songs[i].title+'</div><img src="img/delete_icon.png" class="delete-icon" width="15" height=""></div></li>');
      }
    }else{ // If there are no songs in the playlist
      $( "#songs" ).append("No Songs included!"); // Show that no songs are available
    }

    createDeleteButtons(); // Create delete button for all songs
  }

  // - Show the Status Message on top of the page -
  function showStatus(mood, text) {
    if(mood == "bad") { // Depending on the "mood" change the color of the div
      $( "#wrapper-status" ).css( "background-color", "#C30"); // Change div color to red
    }else{
      $( "#wrapper-status" ).css( "background-color", "#390"); // Change div color to green
    }

    if ($("#wrapper-status").is(':visible')) { // When the div is visible
      $( "#toodle" ).append("</br>"+text); // Just appent the text
    }else{
      $( "#wrapper-status" ).show("Blind"); // Show the Error - div
      $( "#toodle" ).empty().append(text); // Add Message to the Error - div
      $("#wrapper-status").delay(5000).hide("Blind"); // Remove the Error - div after 5sec
    }
  }

  // - Handle errors -
  function errorHandler(jqXHR, textStatus, errorThrown) {
    $.JSONView(jqXHR, $("#output-data")); // Add the default JSON error data
    var error = "";

    if(jqXHR.status == "404") { // If status is 404
      error = "File not Found"; // say "File not Found"
    }else if(jqXHR.status == "409") { // If status is 409
      error = "Document update conflict (Documents already exists)"; // Say error-msg
    }else{
      error = jqXHR.status; // Else just say the error message
    }

    showStatus("bad", "<b>Status:</b> "+error); // Show Status Message
  }

  // -- Start Settings --

  // - On Load of the Website -
  window.onload = function() {
      refreshDropdown(); // Refresh/Load the Playlist DropDown
      $( "#wrapper-status" ).hide(); // Hide the Container including status messages

      artistAutocomplete();

      var doc = "{}";
      $.JSONView(doc, $("#output-data")); // Add the default JSON '{}' to the JSON Output container

      $( "#sortable" ).sortable();
      $( "#sortable" ).disableSelection(); // Disable Text-Selection on sortables
      $( "#sortable" ).sortable({ axis: "y" });
      $( "#sortable" ).sortable({ cursor: "move" });

      doTheButtons();
    };

   // on create
   $( "#create" ).click(function( event ) {
      var newplaylist = $( "#newplaylistname" ).val();
      if(newplaylist) {
         $.ajax({
            url: baseUrl,
            xhrFields: { withCredentials: true },
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({_id: newplaylist, type: "playlist",songs: []}),
            error: errorHandler
         }).done(function( data ) {
           var doc = JSON.parse(data);
           $.JSONView(doc, $("#output-data")); // Create JSON optimized text-output
           $( "#toodle" ).text("Test");
           $( "#newplaylistname" ).val("");
           refreshDropdown(newplaylist); // Refresh the DropDown Menu
         });
      }
   });

   // on read
   $( "#read" ).click(function( event ) {
        readPlaylists(); // read the Playlist
   });

   // on update
   $( "#update" ).click(function( event ) {
      var playlist = $( "#playlists" ).val();
      var artist = $( "#artistname" ).val();
      var song = $( "#songname" ).val();
      var pos = 0;

      var docUrl = baseUrl + "/" + playlist;
      if(playlist && artist && song) {
         $.ajax({
            url: docUrl,
            xhrFields: { withCredentials: true },
            type: "GET",
            error: errorHandler
         }).done(function( data ) {
            var doc = JSON.parse(data);
            pos = doc.songs.length;
            doc.songs.push({"artist":artist,"title":song, "position":pos});
            $.ajax({
	             url: docUrl,
               xhrFields: { withCredentials: true },
	             type: "PUT",
	             data: JSON.stringify(doc),
	             contentType: "application/json",
	             error: errorHandler
            }).done(function( data ) {
      	       var doc2 = JSON.parse(data);
      	       $.JSONView(doc, $("#output-data")); // Create JSON optimized text-output
      	       $( "#artistname" ).val("<Artist Name>");
      	       $( "#songname" ).val("<Song Title>");
               showStatus("good", "<b>Status:</b> Update successfull"); // Show Status Message
               readPlaylists(); // Read Playlist again to verify update
            });
         });
      }
   });

   // on delete
   $( "#delete" ).click(function( event ) {
      var playlist = $( "#playlists" ).val();
      var docUrl = baseUrl + "/" + playlist;
      if(playlist) {
         $.ajax({
            url: docUrl,
            xhrFields: { withCredentials: true },
            type: "GET",
            error: errorHandler
         }).done(function( data ) {
            var doc = JSON.parse(data);
            var rev = doc._rev;
            $.ajax({
	             url: docUrl + "?rev=" + rev,
               xhrFields: { withCredentials: true },
	             type: "DELETE",
	             error: errorHandler
            }).done(function( data ) {
      	       var doc2 = JSON.parse(data);
      	       $.JSONView(doc2, $("#output-data")); // Create JSON optimized text-output
               refreshDropdown(); // DropDown aktualisieren
               showStatus("good", "<b>Status:</b> Successfully deleted"); // Show Status Message
               $( "#songs-playlist" ).text(""); // Delete the songs title
            });
         });
      }
   });


  $( "#sortable" ).on( "sortstop", function( event, ui ) {
     var newIndex = Number(ui.item.index());
     var oldIndex = Number($(this).attr('data-previndex'));

     $(this).removeAttr('data-previndex');
     if(newIndex-oldIndex > 0) {
       for(var i=0; i <= newIndex-oldIndex; i++) {
         $("#sortable li:eq("+(oldIndex+i)+")").find("#number").text(oldIndex+i+1);
       }
     }else if(newIndex-oldIndex < 0) {
       for(var o=(newIndex-oldIndex)+1; o <= oldIndex; o++) {
         $("#sortable li:eq("+(oldIndex-o)+")").find("#number").text(oldIndex-o+1);
       }
     }

    if(newIndex-oldIndex !== 0) {
      goThroughSonglist(-1);
    }
  });

  $( "#sortable" ).on( "sortstart", function(e, ui) {
      ($(this).attr('data-previndex', ui.item.index()));
    });

   // reset the artist name field if it is empty
   $( "#artistname" ).blur(function() {
      if($( "#artistname" ).val() === "") {
         $( "#artistname" ).val("<Artist Name>");
      }
   });

   // - Delete the Placeholder on Focus -
   $( "#artistname" ).focus(function() {
      if ($( "#artistname" ).val() == "<Artist Name>") {
         $( "#artistname" ).val("");
      }
   });

   // - Reset the song name field if it is empty -
   $( "#songname" ).blur(function() {
      if($( "#songname" ).val() === "") {
         $( "#songname" ).val("<Song Title>");
      }
   });

  // - Delete the Placeholder on Focus -
   $( "#songname" ).focus(function() {
       if($( "#songname" ).val() == "<Song Title>") {
         $( "#songname" ).val("");
       }
   });
});
