$( document ).ready(function() {

   var baseUrl = "https://" + user + ":" + pass + "@" + user + ".cloudant.com/" + db;

    // -- Functions --

    // - Create Playlists DropDown -
    function refreshDropdown() {
      $("#playlists").empty(); // Clears the DropDown
      var docUrl = baseUrl + "/"+"_all_docs"; // Shows all docs
      $.ajax({
         url: docUrl,
         xhrFields: { withCredentials: true },
         type: "GET",
         error: errorHandler
      }).done(function( data ) {
         var doc = JSON.parse(data);
         var list = document.getElementById('playlists');
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
      $( "#songs" ).empty(); // Clears the Playlist field
      $( "#toodle" ).text("Status: Playlist found - "+doc._id);
      $( "#Playlist" ).text("Playlist: "+doc._id);
      // Add every Song to the Playlist
      if(doc.songs.length > 0) {
        for(var i = 0; i < doc.songs.length; i++) {
          $( "#songs" ).append("<p>"+doc.songs[i].artist+" - "+doc.songs[i].title+"</p>"); // Creating Text-Element with Information
        }
      }else{
        $( "#songs" ).append("No Songs included!");
      }
    }

    // on start of the application
    window.onload = function() {
      refreshDropdown(); // Refresh/Load the Playlist DropDown
      $( "#wrapper-status" ).hide(); // Hide the Container including status messages

      artistAutocomplete();

      var doc = "{}";
      $.JSONView(doc, $("#output-data")); // Add the default JSON '{}' to the JSON Output container

      $( "#sortable" ).sortable(); // Make the Song-List sortable
      $( "#sortable" ).disableSelection(); // Disable Text-Selection on sortables
    };

   function errorHandler(jqXHR, textStatus, errorThrown) {
      $( "#output-data" ).text(JSON.stringify(jqXHR, null, 2));

      var error = "";
      if(jqXHR.status == "404") {
        error = "File not Found";
      }else if(jqXHR.status == "409") {
        error = "Document update conflict (Documents already exists)";
      }
      $( "#toodle" ).text("Status: "+error);
   }

   // on create
   $( "#create" ).click(function( event ) {
      var newplaylist = $( "#newplaylistname" ).val();
      if(newplaylist) {
         $.ajax({
            url: baseUrl,
            xhrFields: { withCredentials: true },
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({_id: newplaylist, songs: []}),
            error: errorHandler
         }).done(function( data ) {
           var doc = JSON.parse(data);
           $( "#output-data" ).text(JSON.stringify(doc, null, 2));
           $( "#toodle" ).text("Test");
           $( "#newplaylistname" ).val("");
           refreshDropdown();
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
       $.JSONView(doc, $("#output-data"));
       handlePlaylist(doc);
       $( "#readplaylistname" ).val("");
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
      var docUrl = baseUrl + "/" + playlist;
      if(playlist && artist && song) {
         $.ajax({
            url: docUrl,
            xhrFields: { withCredentials: true },
            type: "GET",
            error: errorHandler
         }).done(function( data ) {
            var doc = JSON.parse(data);
            doc['songs'].push({"artist":artist,"title":song});
            $.ajax({
	       url: docUrl,
               xhrFields: { withCredentials: true },
	       type: "PUT",
	       data: JSON.stringify(doc),
	       contentType: "application/json",
	       error: errorHandler
            }).done(function( data ) {
	       var doc2 = JSON.parse(data);
	       $( "#output-data" ).text(JSON.stringify(doc2, null, 2));
	       $( "#artistname" ).val("<Artist Name>");
	       $( "#songname" ).val("<Song Title>");
         readPlaylists();
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
            var rev = doc['_rev'];
            $.ajax({
	       url: docUrl + "?rev=" + rev,
               xhrFields: { withCredentials: true },
	       type: "DELETE",
	       error: errorHandler
            }).done(function( data ) {
	       var doc2 = JSON.parse(data);
	       $( "#output-data" ).text(JSON.stringify(doc2, null, 2));
         refreshDropdown(); // DropDown aktualisieren
         $( "#song-wrapper" ).hide(); // Song - Liste verstecken
            });
         });
      }
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
