$( document ).ready(function() {

   var baseUrl = "https://" + user + ":" + pass + "@" + user + ".cloudant.com/" + db;

    // -- Functions --

    // - Create Playlists DropDown -
    function refreshDropdown() {
      $("#playlists").empty(); // Clears the DropDown
      var docUrl = baseUrl + "/"+"_design/Playlist/_view/getNames"; // URL of the Playlists view
      $.ajax({
         url: docUrl,
         xhrFields: { withCredentials: true },
         type: "GET",
         error: errorHandler
      }).done(function( data ) {
         var doc = JSON.parse(data);
        for(var i=0; i < doc.rows.length; i++) {
          $("#playlists").append(new Option(doc.rows[i].id, doc.rows[i].id)); // Set Value and Text of Select Option
        }
      });
    }

    // - Create Autocomplete for artists -
    function artistAutocomplete() {
        var availableArtists = []; // Array for all Artists
        var docUrl = baseUrl + "/"+"_design/Songs/_view/showArtists?group=true"; // URL to the Artists View

        $.ajax({ // Load all Artists
           url: docUrl,
           xhrFields: { withCredentials: true },
           type: "GET",
           error: errorHandler
        }).done(function( data ) {
          var doc = JSON.parse(data); // Parse the JSON data
          for(var i=0; i < doc.rows.length; i++) {
            availableArtists.push(doc.rows[i].key); // Push the Artist to the Array
          }
        });

        $( "#artistname" ).autocomplete({ // Activate Autocomplete
          source: availableArtists
        });
    }

    // -  Show Songs in Playlist -
    function handlePlaylist(doc) {
      $( "#sortable" ).empty(); // Clears the Playlist field
      $( "#songs-playlist" ).text("Songs of "+doc._id);
      // Add every Song to the Playlist
      if(doc.songs.length > 0) {
        for(var i = 0; i < doc.songs.length; i++) {
          $( "#sortable" ).append('<li class="song-item"><div class="song-list"><div id="number" style="display:inline">'+(i+1)+'</div>) <div id="artist" style="display:inline">'+doc.songs[i].artist+'</div> - <div id="song" style="display:inline">'+doc.songs[i].title+'</div></div></li>');
        }
      }else{
        $( "#songs" ).append("No Songs included!");
      }
    }

    // - Show the Status Message on top of the page -
    function showStatus(mood, text) {
      if(mood == "bad") {
        $( "#wrapper-status" ).css( "background-color", "#C30"); // Change div color to red
      }else{
        $( "#wrapper-status" ).css( "background-color", "#390"); // Change div color to green
      }

      if ($("#wrapper-status").is(':visible')) {
        $( "#toodle" ).append("</br>"+text);
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
       if(jqXHR.status == "404") {
         error = "File not Found";
       }else if(jqXHR.status == "409") {
         error = "Document update conflict (Documents already exists)";
       }else{
         error = jqXHR.status;
       }

      showStatus("bad", "<b>Status:</b> "+error); // Show Status Message
    }

    function saveSortedSongs(songs) {
        var playlist = $( "#playlists" ).val();
        var docUrl = baseUrl + "/" + playlist;

           $.ajax({
              url: docUrl,
              xhrFields: { withCredentials: true },
              type: "GET",
              error: errorHandler
           }).done(function( data ) {
              var doc = JSON.parse(data);
              doc.songs = songs;
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
                 showStatus("good", "<b>Status:</b> Updated Songs successfull"); // Show Status Message
                 readPlaylists(); // Read Playlist again to verify update
              });
           });
    }

    // -- Start Settings --

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
           refreshDropdown(); // Refresh the DropDown Menu
         });
      }
   });

  function readPlaylists()  {
    var readplaylist = $( "#playlists" ).val();
    var docUrl = baseUrl + "/" + readplaylist;
       $.ajax({
          url: docUrl,
          xhrFields: { withCredentials: true },
          type: "GET",
          error: errorHandler
       }).done(function(data) { // if done, push data to function "readPlaylist"
           var doc = JSON.parse(data);
           $.JSONView(doc, $("#output-data")); // Create JSON optimized text-output
           handlePlaylist(doc);
          showStatus("good", "<b>Status:</b> Reading successfull"); // Show Status Message
     });
  }

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
     var artist = "";
     var song = "";
     var songs = [];

     $(this).removeAttr('data-previndex');
     if(newIndex-oldIndex > 0) {
       for(var i=0; i <= newIndex-oldIndex; i++) {
         $("#sortable li:eq("+(oldIndex+i)+")").find("#number").text(oldIndex+i+1);
        // artist = $("#sortable li:eq("+(oldIndex+i)+")").find("#artist").text();
        // song = $("#sortable li:eq("+(oldIndex+i)+")").find("#song").text();
        // songs.push({"artist":artist,"title":song, "position":(oldIndex+i)});
       }
     }else if(newIndex-oldIndex < 0) {
       for(var o=(newIndex-oldIndex)+1; o <= oldIndex; o++) {
         $("#sortable li:eq("+(oldIndex-o)+")").find("#number").text(oldIndex-o+1);
        // artist = $("#sortable li:eq("+(oldIndex-o)+")").find("#artist").text();
        // song = $("#sortable li:eq("+(oldIndex-o)+")").find("#song").text();
        // songs.push({"artist":artist,"title":song, "position":(oldIndex-o)});
       }
     }

    if(newIndex-oldIndex !== 0) {
      for(var p=0; p < $("#sortable li").length; p++) {
        artist = $("#sortable li:eq("+p+")").find("#artist").text();
        song = $("#sortable li:eq("+p+")").find("#song").text();
        songs.push({"artist":artist,"title":song, "position":p});
      }
      saveSortedSongs(songs);
    }
  });

  $( "#sortable" ).on( "sortstart", function(e, ui) {
        $(this).attr('data-previndex', ui.item.index());
    });

   // reset the artist name field if it is empty
   $( "#artistname" ).blur(function() {
      if($( "#artistname" ).val() == "") {
         $( "#artistname" ).val("<Artist Name>");
      }
   });

   // Delete the Placeholder on Focus
   $( "#artistname" ).focus(function() {
      if ($( "#artistname" ).val() == "<Artist Name>") {
         $( "#artistname" ).val("");
      }
   });

   // reset the song name field if it is empty
   $( "#songname" ).blur(function() {
      if($( "#songname" ).val() == "") {
         $( "#songname" ).val("<Song Title>");
      }
   });

  // Delete the Placeholder on Focus
   $( "#songname" ).focus(function() {
       if($( "#songname" ).val() == "<Song Title>") {
         $( "#songname" ).val("");
       }
   });
});
