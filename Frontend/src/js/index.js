var APP = (function() {
    return {
        modules: {},
        group: null,
        init: function() {}
    }
})();
/**
 * module MAP
 * modÃ©lise la carte et les fonctionnalitÃ©s
 * associÃ©e
 *
 * @type {{init}}
 */
APP.modules.map = (function() {
    /**
     * attributs
     *  @var map : carte (objet Leaflet)
     *  @var markers : ensemble des marqueurs de la carte
     */
    var map, markers, areaSelect,circles;
    return {
        /**
         * methode d'initialisation
         *
         * @param htmlContainer
         *          container html de la carte
         */
        init: function(htmlContainer) {
            map = L.map(htmlContainer, {
                center: [51.505, -0.09],
                zoom: 4
            });
            var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            var ign = L.tileLayer(
            'https://wxs.ign.fr/9bci2kf4ow18mxkruzqcl3pi/geoportail/wmts?service=WMTS&request=GetTile&version=1.0.0&tilematrixset=PM&tilematrix={z}&tilecol={x}&tilerow={y}&layer=ORTHOIMAGERY.ORTHOPHOTOS&format=image/jpeg&style=normal',
            {
                minZoom : 0,
                maxZoom : 18,
                tileSize : 256,
                attribution : "IGN-F/Géoportail"
            }).addTo(map);
            var baseLayers = {"IGN" : ign, "OpenStreetMap" : osm};
            L.control.scale({'position':'bottomleft','metric':true,'imperial':false}).addTo(map);
            L.control.layers(baseLayers, {}).addTo(map);
            $(document).keydown(function(event) {
                if (event.which == "17") {
                    areaSelect = L.areaSelect({
                        width: 300,
                        height: 300
                    });
                    areaSelect.addTo(map);
                }
            });
            $(document).keyup(function(event) {
                if (event.which == "17") {
                    bounds = areaSelect.getBounds();
                    APP.modules.service.searchlithologyanddateandmesure($("input[name='lithology']")[0].value, $("input[name='measurement_abbreviation']")[0].value, $('input[name=mindate]')[0].value, $('input[name=maxdate]')[0].value, bounds['_southWest']['lat'], bounds['_northEast']['lat'], bounds['_northEast']['lng'], bounds['_southWest']['lng']);
                    areaSelect.remove();
                    delete areaSelect;
                }
            });
        },
        /**
         * methode d'affichage
         * @param data
         */
        affichagePoi: function(data, all, updatedate, updatemesure, updatelithology) {
            if(circles){
                circles.clearLayers();
            }
            map.on('click',function(){
                if(circles){
                circles.clearLayers();
                }
            })
            data = JSON.parse(data);
            $('.message').empty();
            if (APP.group != null) {
                APP.group.clearLayers();
            }
            if (data == null || data.length == 0) {
                $('.message').append('<div class="ui container"><div class="column"><div class="ui negative message">  <div class="header"> No data found </div> <p>Please try again later or with others filters</p></div></div></div>');
            } else {
                var markers = []
                markers._popup = "";
                markers._popup._content = ""
                var icon = 'station-icon.png';
                var icon2x = 'station-icon-2x.png';
                var stationIcon = L.icon({
                    iconUrl: 'js/images/' + icon,
                    iconRetinaUrl: 'js/images/' + icon2x,
                    iconSize: [25, 41], // size of the icon
                    iconAnchor: [12, 40]
                });
                var array = $.map(data, function(value, index) {
                    return [value];
                });
                var lithology = [];
                var creationdate = [];
                lithology['all'] = 'all';
                var measurement_abbreviation = [];
                var measurement_nature = [];
                array.forEach(function(k, v) {
                    if (k.SAMPLE_KIND!=null) {
                       
                    lithology[k.SAMPLE_KIND] = (k.SAMPLE_KIND);
                        }
                    creationdate.push(k.SAMPLING_DATE);
                    k.MEASUREMENT.forEach(function(k, v) {
                        mesure = k.ABBREVIATION.split("_");
                        if (mesure && new RegExp('_RAW').test(k.ABBREVIATION) == false) {
                            measurement_abbreviation[k.ABBREVIATION] = (k.ABBREVIATION);
                            measurement_nature[k.ABBREVIATION] = (k.NATURE);
                        }
                    });
                    var long = k.SAMPLING_POINT[0].LONGITUDE.replace(/\s+/g, '');
                    var lat = k.SAMPLING_POINT[0].LATITUDE.replace(/\s+/g, '');
                    var Lambert93 = "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs "
                    var gps = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
                    var latlng =proj4(Lambert93,gps,[long,lat]);
                    var marker = L.marker([latlng[1], latlng[0]]);
                    marker.bindPopup(k.STATION);
                                circles = L.featureGroup().addTo(map);

                    marker.on('click', function(e) {
                        var circle = new L.Circle(e.latlng, 50, {
                color: 'black',
                opacity : 0.8,
                fillOpacity : 0.5
            });
            circles.clearLayers();
                        circle.addTo(circles)

                        measurements = '';
                        rawdatas = '';
                        if (k.FILES) {
                            k.FILES.forEach(function(k, v) {
                                if ((new RegExp('_RAW')).test(k.DATA_URL)) {
                                    rawdata = ' <div class="item measurement_abbreviation_raw" ><input type="hidden" value="' + k.DATA_URL + '"> <div class="content"> <div class="header">' + k.DATA_URL + '</div><div>' + k.DATA_URL + '</div>  </div> </div>'
                                    rawdatas += rawdata;
                                } else {
                                    measurement = ' <div class="item measurement_abbreviation" ><input type="hidden" value="' + k.DATA_URL + '"> <div class="content"> <div class="header">' + k.DATA_URL.substring(0, k.DATA_URL.indexOf('_DATA'))+ '</div><div>' + k.DATA_URL.substring(0, k.DATA_URL.indexOf('_DATA')) + '</div> </div> </div>'
                                    measurements += measurement;
                                }
                            });
                            if (measurements != '') {
                                measurements = '<div class="ui middle aligned selection list">' + measurements + '</div>'
                            }
                            if (rawdatas != '') {
                                rawdatas = '<div class="ui middle aligned selection list">' + rawdatas + '</div>'
                            }
                        }
                        if (measurements != '') {
                            measurements = '<div class="title"> <i class="dropdown icon"></i> Data </div> <div class="content">' + measurements + ' </div>'
                        }
                        if (rawdatas != '') {
                            rawdatas = '<div class="title"> <i class="dropdown icon"></i> Raw data </div> <div class="content">' + rawdatas + ' </div>';
                        }
                        pictures = '';
                        picturemetas = '';
                        if (k.PICTURES) {
                            for (key in k.PICTURES) {
                                picture = k.PICTURES[key].NAME;
                                name =  k.PICTURES[key].ID;
                                picture = ' <div class="item pictures" ><input type="hidden" value="' + k.PICTURES[key].NAME + '"> <div class="content"> <div class="header">' + k.PICTURES[key].NAME + '</div></div> </div>'
                                pictures += picture;
                                
                            }
                            picturemetas = '<div class="ui middle aligned selection list">' + picturemetas + '</div>';
                            pictures = '<div class="ui middle aligned selection list">' + pictures + '</div>';
                            pictures = '<div class="title"> <i class="dropdown icon"></i> Pictures </div> <div class="content">' + pictures + ' </div>';
                        }
                        setTimeout(function() {
                            $('.ui.sidebar.right').sidebar('setting', 'transition', 'overlay').sidebar('show');
                        }, 50);
                        setTimeout(function() {
                            $('.pusher').removeClass('dimmed');
                        }, 200);
                        $('.ui.sidebar.right').empty();
                        referent = '';
                        /*if (k.SUPPLEMENTARY_FIELDS.NAME_REFERENT) {
                            referent = '<br> Referent Name: ' + k.SUPPLEMENTARY_FIELDS.NAME_REFERENT + '<br> Referent First name: ' + k.SUPPLEMENTARY_FIELDS.FIRST_NAME_REFERENT;
                        }*/
                        $('.ui.sidebar.right').append('<div class="ui styled accordion"> <div class="active title"> <i class="dropdown icon"></i> ' + k.STATION + ' </div> <div class="active content"> <h3>' + k.TITLE + '</h3><p> Description: ' + k.SAMPLING_POINT[0].DESCRIPTION + '<br><br> Latitude: ' + k.SAMPLING_POINT[0].LATITUDE + ' Longitude: ' + k.SAMPLING_POINT[0].LONGITUDE + '</p>' + picturemetas + '</div>' + measurements + pictures + rawdatas)
                        $('.ui.accordion').accordion();
                        $('.item.measurement_abbreviation').on('click', function(e) {
                            window.open('/Backend/src/index.php/download_poi_data/'+$(this).children()[0].value);
                           // mesure = $(this).children()[0].value;
                           // mesure = mesure.replace("/ /g", "");
                            //name = k.SUPPLEMENTARY_FIELDS.SAMPLE_NAME + "_" + mesure;
                          //  name = name.replace("/ /g", "");
                           // $("#preview").empty();
                            //$("#preview").append('<iframe src="/Backend/src/index.php/preview_poi_data/' + name + '" style="width:100%; height:550px;" frameborder="0"></iframe>');
                            //$(".actions a").remove();
                            //$(".actions .download").remove();
                            //$(".actions").append(' <a href="/Backend/src/index.php/download_poi_data/' + name + '"><div class="ui green  button">Download</div></a>')

                           // $('.ui.modal.preview').modal('show');
                        });
                         $('.item.measurement_abbreviation_raw').on('click', function(e) {
                            window.open('/Backend/src/index.php/download_poi_raw_data/'+$(this).children()[0].value);
                        });
                        $('.item.pictures').on('click', function(e) {
                            picture = $(this).children()[0].value;
                            //name = k.SUPPLEMENTARY_FIELDS.SAMPLE_NAME;
                            name = name.replace("/ /g", "");
                            $("#preview").empty();
                            $("#preview").append('<img class="ui fluid image" src="/Backend/src/index.php/preview_img/' + name + '/' + picture + '""</img>');
                            $(".actions a").remove();
                            $(".actions .download").remove();
                            $(".actions").append(' <a href="/Backend/src/index.php/download_img/' + name + '/' + picture + '"><div class="ui green  button">Download</div></a>')
                            setTimeout(function() {
                            $('.ui.modal.preview').modal('show');
                        }, 100);
                        });
                    });
                    marker.on('mouseover', function(e) {
                        this.openPopup();
                    });
                    marker.on('mouseout', function(e) {
                        this.closePopup();
                    });
                    markers.push(marker);
                });
                append = "";
                var minDate = creationdate.reduce(function(a, b) {
                    return a < b ? a : b;
                });
                var maxDate = creationdate.reduce(function(a, b) {
                    return a > b ? a : b;
                });
                for (key in measurement_abbreviation) {
                    item = '<div class="item" title="' + measurement_nature[key] + '">' + key + '</div>';
                    measurement_abbreviation += item;
                }
                if (all == true) {
                    $('.control').empty();
                    $('.control button').remove();
                    $('.control').append('<h1>Sort results</h1>')
                    for (key in lithology) {
                        item = '<div class="item">' + key + '</div>';
                        lithology += item;
                        
                    }
                    lithology = '<div class="ui one column"><div class="ui selection dropdown lithology"><input type="hidden" name="lithology"> <i class="dropdown icon"></i><div class="default text">All</div><div class="menu">' + lithology + ' </div></div></div>';
                    append += lithology;
                }
                if (updatelithology == true) {
                    $('.control .lithology').remove();
                    for (key in lithology) {
                        item = '<div class="item">' + key + '</div>';
                        lithology += item;
                        
                    }
                    lithology = '<div class="ui one column"><div class="ui selection dropdown lithology"><input type="hidden" name="lithology"> <i class="dropdown icon"></i><div class="default text">All</div><div class="menu">' + lithology + ' </div></div></div>';
                    append += lithology;
                }
                if (updatedate == true) {
                    $('.control button').remove();
                    $('.control .dates').remove();
                    date = '<div class="dates"><div class="ui input"><input  type="text" name="mindate" value="' + minDate + '"></div><div class="ui input"><input class="ui input" type="text"   name="maxdate" value="' + maxDate + '"></div></div>';
                    append += date;
                }
                if (updatemesure == true) {
                    $('.control .button').remove();
                    $('.control .measurement_abbreviation').remove();
                    measurement_abbreviation = '<div class="ui one column"><div class="ui selection dropdown measurement_abbreviation"><input type="hidden" name="measurement_abbreviation"> <i class="dropdown icon"></i><div class="default text">Select a mesure</div><div class="menu">' + measurement_abbreviation + ' </div></div></div>';
                    append += measurement_abbreviation;
                }
                $('.control').append(append);
                $(".control .dates input").datepicker({
                    minDate: new Date(minDate),
                    maxDate: new Date(maxDate),
                    dateFormat: 'yy-mm-dd'
                });
                $('input[name=measurement_abbreviation]').unbind('change');
                $("input[name='measurement_abbreviation']").on('change', function(e) {
                    APP.modules.service.searchlithologyanddateandmesure($("input[name='lithology']")[0].value, $("input[name='measurement_abbreviation']")[0].value, $('input[name=mindate]')[0].value, $('input[name=maxdate]')[0].value);
                })
                $('.filter').on('click', function(e) {
                    $('.sidebar.left').sidebar('setting', 'transition', 'overlay').sidebar('toggle');
                })
                $('.ui.dropdown.lithology').dropdown({
                    onChange: function(value, text, $selectedItem) {
                        if (value == 'all') {
                            APP.modules.service.getallpoi();
                        } else {
                            APP.modules.service.searchlithology(value);
                        }
                    }
                });
                $('.ui.dropdown.measurement_abbreviation').dropdown();
                $('.ui.dropdown.lithology').dropdown({
                    onChange: function(value, text, $selectedItem) {
                        if (value == 'all') {
                            APP.modules.service.getallpoi();
                        } else {
                            APP.modules.service.searchlithology(value);
                        }
                    }
                });
                $('.ui.dropdown.measurement_abbreviation').dropdown();
                $('input[name=mindate]').unbind('change');
                $('input[name=maxdate]').unbind('change');
                $('input[name=mindate]').on('change', function(e) {
                    APP.modules.service.searchlithologyanddate($('input[name=lithology]')[0].value, $('input[name=mindate]')[0].value, $('input[name=maxdate]')[0].value);
                })
                $('input[name=maxdate]').on('change', function(e) {
                    APP.modules.service.searchlithologyanddate($('input[name=lithology]')[0].value, $('input[name=mindate]')[0].value, $('input[name=maxdate]')[0].value);
                })
                APP.group = L.featureGroup(markers); // on met le groupe de markers dans une layer
                APP.group.getLayers().length;
                APP.group.addTo(map);
                bounds = APP.group.getBounds();
                map.fitBounds(bounds);
            }
        },
    }
})();
APP.modules.service = (function() {
    return {
        getallpoi: function() {
            $.get("/Backend/src/index.php/get_all_poi", function(data) {
                APP.modules.map.affichagePoi(data, true, true, true);
            });
        },
        getpoisorted: function(json, updatedate, updatemesure, updatelithology) {
            $.post("/Backend/src/index.php/get_poi_sort", {
                json: json
            }, function(data) {
                APP.modules.map.affichagePoi(data, false, updatedate, updatemesure, updatelithology);
            });
        },
        getdata: function(json) {
            $.post("/Backend/src/index.php/get_poi_type_data", {
                json: json
            }, function(data) {
                $("#preview").empty();
                $("#preview").append(data);
                $(".actions a").remove();
                $(".actions .download").remove();
                $(".actions").append('<div class="ui green button download">Download</div>')
                $(".actions .download").on('click', function(e) {
                    APP.modules.service.downloaddata(json);
                });
            });
        },
        downloaddata: function(json) {
            $.post("/Backend/src/index.php/download_poi_type_data", {
                json: json
            }, function(data) {
                var pom = document.createElement('a');
                pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
                json = JSON.parse(json);
                pom.setAttribute('download', json.mesure + '_' + json.lithology + '_' + json.mindate + '_' + json.maxdate + '.csv');
                if (document.createEvent) {
                    var event = document.createEvent('MouseEvents');
                    event.initEvent('click', true, true);
                    pom.dispatchEvent(event);
                } else {
                    pom.click();
                }
            });
        },
        searchlithologyanddateandmesure: function(lithology, mesure, mindate, maxdate, lat1, lat2, lon1, lon2) {
            obj = {
                "lithology": lithology,
                'mesure': mesure,
                "mindate": mindate,
                "maxdate": maxdate,
                "lat": {
                    "lat1": lat1,
                    "lat2": lat2
                },
                "lon": {
                    "lon1": lon1,
                    "lon2": lon2
                },
            };
            json = JSON.stringify(obj);
            if (lat1 && lat2 && lon1 && lon2) {
                APP.modules.service.getpoisorted(json, true, true, true);
            } else {
                APP.modules.service.getpoisorted(json, false, false, false);
            }
            APP.modules.service.getdata(json);
        },
        searchlithology: function(lithology) {
            obj = {
                "lithology": lithology
            };
            json = JSON.stringify(obj);
            APP.modules.service.getpoisorted(json, true, true);
        },
        searchlithologyanddate: function(lithology, mindate, maxdate) {
            obj = {
                "lithology": lithology,
                "mindate": mindate,
                "maxdate": maxdate
            };
            json = JSON.stringify(obj);
            APP.modules.service.getpoisorted(json, false, true);
        },
    }
})();
window.onload = (function() {
    APP.modules.map.init('map');
    APP.init();
    APP.modules.service.getallpoi();
})();