$( document ).ready(function() {

// -- Global Variables --
  var baseUrl = "https://"+user+":"+pass+"@"+user+".cloudant.com/";
  var speedLine = L.layerGroup; // LayerGroup for car positions

// -- Helper Functions --
  // - Set Colors for car position -
  speedGrades = [0, 10, 30, 50, 80, 100, 120, 150];
  colorGrades = ['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026']
  function getColor(d) {
    return  d > speedGrades[7]   ? colorGrades[7] :
               d > speedGrades[6]   ? colorGrades[6] :
               d > speedGrades[5]   ? colorGrades[5] :
               d > speedGrades[4]   ? colorGrades[4] :
               d > speedGrades[3]   ? colorGrades[3] :
               d > speedGrades[2]   ? colorGrades[2] :
               d > speedGrades[1]   ? colorGrades[1] :
                                                 colorGrades[0];
  }

  // - Check the online status of the app -
  setInterval(checkOnline, 1000);

  var onlineStat = false;
  function checkOnline() {
    var online = navigator.onLine;
    console.log(online);
    if(online) {
      $("#online_status").html("Online");
      $("#status").css("color", "#390");
      if(!onlineStat) {
        onlineStat = true;
        // Sync remote Couch here
      }
    }else{
      $("#online_status").html("Offline");
      $("#status").css("color", "#C30");
      onlineStat = false;
    }
  }

  // - Clean Map -
  function cleanMap() {
    if(map.hasLayer(speedLine)) {
      map.removeLayer(speedLine);
    }
    $('.legend').hide();
  }

  // - Get Location by latLong -
  function getLocation(eobj) {
    var geocoder = new google.maps.Geocoder();
    if(eobj.latlng) { // Leaflet uses "latlng" and leaflet:draw uses layer._latlng
      var latlng = new google.maps.LatLng(eobj.latlng.lat, eobj.latlng.lng);
    }else{
      var latlng = new google.maps.LatLng(eobj.layer._latlng.lat, eobj.layer._latlng.lng);
    }

    if (geocoder) {
      geocoder.geocode({'latLng': latlng}, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          resp = results[0].formatted_address;
        }else{
          resp = 'No location found';
        }
        if(eobj.type=="click") { // It's a car position
          eobj.target.bindPopup(eobj.target._popup._content+"<b>Location: </b>"+resp+"<br />");
        }else if(eobj.type=="draw:created") { // it's a handmade marker
            eobj.layer.bindPopup("<b>Location: </b>"+resp+"<br />"+"<b>Geo: </b>"+eobj.layer._latlng.lat+","+eobj.layer._latlng.lng+"<br />").openPopup();
        }
      });
    }
  }

// -- Functions --
  // - Create the default map -
  function createMap() {
    key = 'pk.eyJ1IjoiZGVtb2VobiIsImEiOiJ3TWtKUmFNIn0.PhNsdyuZmBprwq6bNLQjmQ';
    // Replace 'examples.map-i87786ca' with your map id.
    var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/demoehn.k6ecah3n/{z}/{x}/{y}.png', {minZoom: 2, maxZoom: 18,
        attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
    });

    var map = L.map('map')
        .addLayer(mapboxTiles)
        .setView(new L.LatLng(50.56928286558243, 10.30517578125), 5);

    map.addLayer(mapboxTiles); // Add map to layer
    var featureGroup = L.featureGroup().addTo(map);
    // Definition of leaflet draw
    var options = { position: 'topleft',
                          draw: {
                            polygon: {
                              allowIntersection: false, // Restricts shapes to simple polygons
                              drawError: {
                                color: '#e1e100', // Color the shape will turn when intersects
                                message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
                              },
                              shapeOptions: {
                                color: '#0CF'
                              }
                            },
                            circle: {
                              shapeOptions: {
                                color: '#0CF'
                              }
                            }, // Turns off this drawing tool
                            rectangle: {
                              shapeOptions: {
                                color: '#0CF',
                                clickable: false
                              }
                            },
                            marker: true,
                            polyline: false,
                          },
                          edit: {
                            featureGroup: featureGroup
                          }
                        };

    var drawControl = new L.Control.Draw(options).addTo(map);

    map.on('draw:created', function(e) {
      featureGroup.addLayer(e.layer);
      handleDrawing(e);
    });

    map.on('draw:editstop', function(e) {
      handleDrawing(e);
    });

    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info legend');
      labels = [];
      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < speedGrades.length; i++) {
        div.innerHTML += '<i style="background:' + getColor(speedGrades[i] + 1) + '"></i> ' +speedGrades[i] + (speedGrades[i + 1] ? '&ndash;' + speedGrades[i + 1] + ' km/h<br>' : '+ km/h');
      }
      return div;
    };

    legend.addTo(map);
    $('.legend').hide();
    return map;
  }

  // Load Regions for Germany
  function createRegions() {
    var docUrl = baseUrl + "regions" + "/_all_docs?include_docs=true"; // URL of the Playlists view

    $.ajax({ // Start AJAX Call to Playlists view
      url: docUrl,
      xhrFields: { withCredentials: true },
      type: "GET",
      error: errorHandler,
      complete: completeHandler
    }).done(function( data ) { // After the call is done
      var doc = JSON.parse(data); // Parse JSON Data into Obj. doc
      var states;
      doc.rows.forEach(function(point) {
        var states = L.geoJson(point.doc).addTo(map).on('click', function(e) {
            swal({   title: "Fahrten suchen?",
                        text: "Sollen alle Fahrten für: "+point.doc.properties.NAME_1+" gesucht werden?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#33CC33",
                        confirmButtonText: "Ja suchen!",
                        closeOnConfirm: false },
                        function(){   swal("Deleted!", "Your imaginary file has been deleted.", "success"); });
          });
      });

      map.setView(new L.LatLng(53, 9), 5);
    });
  }

  // - Load the Geo Data -
  function createHeatmap() {
    var addressPoints2 = [];
    var docUrl = baseUrl + db + "/_design/cars/_view/heatmap?group_level=1"; // URL of the Playlists view

    $.ajax({ // Start AJAX Call to Playlists view
      url: docUrl,
      xhrFields: { withCredentials: true },
      type: "GET",
      error: errorHandler,
      complete: completeHandler
    }).done(function( data ) { // After the call is done
      var doc = JSON.parse(data); // Parse JSON Data into Obj. doc
      //$.JSONView(JSON.stringify(doc), $("#car-data"));
      //map.setView([doc.rows[0].value[0], doc.rows[0].value[1]], 10);
      /*var newArr = Array();
      doc.rows.forEach(function(point) {
        newArr.push([point.value[0],point.value[1], point.value[2]]);
      });*/
      console.log(doc.rows[0]);
      var heat = L.heatLayer([[
              48.933995,
              8.558263
            ],
            [
              48.932281,
              8.572706
            ],
            [
              48.929186,
              8.580791
            ]], {radius:50, maxZoom: 14}).addTo(map);
    });
  }

  // - Load the Speed Data -
  function drawSpeedLine(key, maxGeo) {
    var docUrl = baseUrl + db + '/_design/location/_view/latLong?limit='+maxGeo+'&key="'+key+'"'; // URL of the Playlists view
    var color = 'red';
    var circles = Array();

    $.ajax({ // Start AJAX Call to Playlists view
      url: docUrl,
      xhrFields: { withCredentials: true },
      type: "GET",
      error: errorHandler,
      complete: completeHandler
    }).done(function( data ) { // After the call is done
      var doc = JSON.parse(data); // Parse JSON Data into Obj. doc
      doc.rows.forEach(function(point) {
        point = point.value;
        color = getColor(point.speed);
        var options = {
          color: color,
          fillColor: color,
          fillOpacity: 0.5
        };
        circle = L.circle([point.geometry.coordinates[0],point.geometry.coordinates[1]], 200, options);
        circles.push(circle);

        circle.speed = "<b>Speed: </b>"+point.speed+" km/h<br />";
        circle.altitude = "<b>Altitude: </b>"+point.geometry.coordinates[2]+" m<br />";
        circle.direction = "<b>Direction: </b>"+point.direction+" Degree<br />";
        circle.eventtime = "<b>Event-Time: </b>"+point.time+"<br />";
        circle.closePopup();
        circle.on('click', function(e) {
          var obj = e.target;
          obj.bindPopup(obj.speed+obj.altitude+obj.direction+obj.eventtime);
          getLocation(e)
          obj.openPopup();
        });
      });
      map.setView([doc.rows[0].value.geometry.coordinates[0], doc.rows[0].value.geometry.coordinates[1]], 6);
      speedLine = L.layerGroup(circles).addTo(map);
    });
  }

  // Geodaten anhand der Freihandzeichnungen Laden
  function handleDrawing(e) {
    var docUrl = baseUrl+db+"/_design/geo/_geo/location"; // Basis Dokument URL

    // Abfrage des Typs der Zeichnung
    if(e.layerType == "circle") {
      docUrl += '?radius='+e.layer._radius+'&lat='+e.layer._latlng.lat+'&lon='+e.layer._latlng.lng+'&relation=within'; // Cloudant Geo für Kreise
      console.log("circle");
    }else if( (e.layerType == "rectangle") || (e.layerType == "polygon") ) {
      docUrl += '?g=POLYGON( ('; // Cloudant Geo Polygon
      // Füge für jeden Punkt Lat und Lng ein
      e.layer._latlngs.forEach(function(latlng) {
        docUrl += latlng.lat+'%20'+latlng.lng+',';
      });
      docUrl = docUrl.slice(0, docUrl.length-1); // Letztes Zeichen (Komma) abschneiden
      docUrl += '))&relation=within'; // Alle Punkte die innerhalt des Polygons sind anzeigen
      console.log(e.layerType);
    }else if(e.layerType == "marker"){
      getLocation(e);
    }else{
      console.log(e);
    }

    if(e.handler == "edit") {
      swal("Error", "Editing is not supported right now", "error")
    }

    console.log("Query: "+docUrl); // Show final docUrl
  }

  // - Load the available cars -
  function getCars() {
    var docUrl = baseUrl+ db + "/_design/cars/_view/showCars?group=true"; // URL of the Playlists view
    $.ajax({ // Start AJAX Call to Playlists view
      url: docUrl,
      xhrFields: { withCredentials: true },
      type: "GET",
      error: errorHandler,
      complete: completeHandler
    }).done(function( data ) { // After the call is done
      var doc = JSON.parse(data); // Parse JSON Data into Obj. doc
      for(var i=0; i < doc.rows.length; i++) { // Go through each Document and insert into Dropdown
        $("<option data-geo='"+doc.rows[i].value+"' value='"+doc.rows[i].key+"'> Car Number "+(i+1)+": "+doc.rows[i].value+" Geo-Points</option>").appendTo("#cars_combo");
      }
    });
  }

  // - Handle errors -
  function errorHandler(jqXHR, textStatus, errorThrown) {
    $.JSONView(jqXHR, $("#output-data")); // Add the default JSON error data
  }

  // - Handle AJAX Completion -
  function completeHandler(jqXHR, textStatus, errorThrown) {
    $.JSONView(jqXHR, $("#output-data")); // Add the default JSON error data
  }

// -- Start Settings --
  $( "#wrapper-status" ).hide(); // Hide the Container including status messages

  var doc = "{}";
  $.JSONView(doc, $("#output-data")); // Add the default JSON '{}' to the JSON Output container
  $.JSONView(doc, $("#car-data")); // Add the default JSON '{}' to the JSON Car container

  var map = createMap(); // Create the default map

  getCars();

  $( "#load" ).click(function( event ) {
    cleanMap();
   createHeatmap();
  });

  $( "#regions" ).click(function( event ) {
      cleanMap();
      createRegions();
  });

  $( "#tester" ).click(function( event ) {
    cleanMap()
  });

  $( "#line" ).click(function( event ) {
    cleanMap();
    drawSpeedLine($('#cars_combo').val(), $("#slider-range-min").slider( "value" )); // Draw the speed line with DEVICE_ID and MaxGeo Points
    $('.legend').show(); // Show legend for cars
  });

  $('#cars_combo').click(function( event ) {
    var comboVal = $(this.options[this.selectedIndex]).attr('data-geo');

    // Set the Slider to the Value
    $( "#slider-range-min" ).slider({
      range: "min",
      value: comboVal,
      min: 1,
      max: comboVal,
      disabled: false
    });

    $("#amount").val($("#slider-range-min").slider( "value" ));
  });

  $( "#slider-range-min" ).slider({
      range: "min",
      value: 37,
      min: 1,
      max: 700,
      disabled: true,
      slide: function( event, ui ) {
        $("#amount").val(ui.value );
      }
    });
  $("#amount").val("none");
});
