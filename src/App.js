import React, {Component} from 'react';
import LocationList from './components/LocationList';

class App extends Component {
    /**
     * Constructor
     */
    constructor(props) {
        super(props);
        this.state = {
            'alllocations': [
                {
                    'name': "SoHi Grilled Sandwiches",
                    'type': "Sandwich",
                    'latitude': 39.51034448077775,
                    'longitude': -84.74191121838116,
                    'streetAddress': "17 E High St, Oxford, OH 45056"
                },
                {
                    'name': "Sushi Nara",
                    'type': "Sushi",
                    'latitude': 39.51130181716352,
                    'longitude': -84.74577849823227,
                    'streetAddress': "22 N College Ave, Oxford, OH 45056"
                },
                {
                    'name': "Wild Bistro",
                    'type': "Asian",
                    'latitude': 39.510439,
                    'longitude': -84.741223,
                    'streetAddress': "37 E High St, Oxford, OH 45056"
                },
                {
                    'name': "Phan Shin",
                    'type': "Asian",
                    'latitude': 39.510749781439216,
                    'longitude': -84.74444795658592,
                    'streetAddress': "104 W High St "
                },
                {
                    'name': "Chipotle",
                    'type': "Mexican",
                    'latitude': 39.51041533597652,
                    'longitude': -84.74244472111516,
                    'streetAddress': "1 W High St, Oxford, OH 45056"
                },
            ],
            'map': '',
            'infowindow': '',
            'prevmarker': ''
        };

        // retain object instance when used in the function
        this.initMap = this.initMap.bind(this);
        this.openInfoWindow = this.openInfoWindow.bind(this);
        this.closeInfoWindow = this.closeInfoWindow.bind(this);
    }

    componentDidMount() {
        // Connect the initMap() function within this class to the global window context,
        // so Google Maps can invoke it
        window.initMap = this.initMap;
        // Asynchronously load the Google Maps script, passing in the callback reference
        loadMapJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyAYl7fXe6az_XekYLHtiX4VsBmO1C_-768&callback=initMap')
    }

    /**
     * Initialise the map once the google map script is loaded
     */
    initMap() {
        var self = this;

        var mapview = document.getElementById('map');
        mapview.style.height = window.innerHeight + "px";
        var map = new window.google.maps.Map(mapview, {
            center: {lat: 39.510504, lng:  -84.741223,},
            zoom: 17,
            mapTypeControl: false
        });

        var InfoWindow = new window.google.maps.InfoWindow({});

        window.google.maps.event.addListener(InfoWindow, 'closeclick', function () {
            self.closeInfoWindow();
        });

        this.setState({
            'map': map,
            'infowindow': InfoWindow
        });

        window.google.maps.event.addDomListener(window, "resize", function () {
            var center = map.getCenter();
            window.google.maps.event.trigger(map, "resize");
            self.state.map.setCenter(center);
        });

        window.google.maps.event.addListener(map, 'click', function () {
            self.closeInfoWindow();
        });

        var alllocations = [];
        this.state.alllocations.forEach(function (location) {
            var longname = location.name + ' - ' + location.type;
            var marker = new window.google.maps.Marker({
                position: new window.google.maps.LatLng(location.latitude, location.longitude),
                animation: window.google.maps.Animation.DROP,
                map: map
            });

            marker.addListener('click', function () {
                self.openInfoWindow(marker);
            });

            location.longname = longname;
            location.marker = marker;
            location.display = true;
            alllocations.push(location);
        });
        this.setState({
            'alllocations': alllocations
        });
    }

    /**
     * Open the infowindow for the marker
     * @param {object} location marker
     */
    openInfoWindow(marker) {
        this.closeInfoWindow();
        this.state.infowindow.open(this.state.map, marker);
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        this.setState({
            'prevmarker': marker
        });
        this.state.infowindow.setContent('Loading Data...');
        this.state.map.setCenter(marker.getPosition());
        this.state.map.panBy(0, -200);
        this.getMarkerInfo(marker);
    }

    /**
     * Retrive the location data from the foursquare api for the marker and display it in the infowindow
     * @param {object} location marker
     */
    getMarkerInfo(marker) {
        var self = this;
        var clientId = "WFRT4LO0VGGPSUBEQK2Y3Y3PYY4IRJERYE5XGTZVPOU2X2QW";
        var clientSecret = "W5G4C2O4LYJTD0FFNYI3ZO4HUDWMQOYBP0LIGU1EPXPDJKCJ";

        var url = "https://api.foursquare.com/v2/venues/search?client_id=" + clientId + "&client_secret=" + clientSecret + "&v=20130815&ll=" + marker.getPosition().lat() + "," + marker.getPosition().lng() + "&limit=1";

        console.log(url);
        fetch(url)
            .then(
                function (response) {
                    if (response.status !== 200) {
                        self.state.infowindow.setContent("Sorry data can't be loaded");
                        return;
                    }

                    // get the venue id first and then get the venue details from it
                    response.json().then(function (data) {
                      var venue_id = data.response.venues[0].id;

                      var venue_url = "https://api.foursquare.com/v2/venues/" + venue_id  + "?client_id=" + clientId + "&client_secret=" + clientSecret + "&v=20181024";

                      fetch(venue_url)
                        .then(
                          function (response) {
                            if (response.status !== 200) {
                              self.state.infowindow.setContent("Sorry data can't be loaded");
                              return;
                            }

                            response.json().then(function (data) {
                              var venue_data = data.response.venue;
                              var name = '<b>' + venue_data.name + '<br>';
                              var contact = '<b>Phone: </b>' + venue_data.contact.formattedPhone  + '<br>';
                              var price = '<b>Price: </b>' + venue_data.price.currency + '<br>';
                              var hours = '<b>Hours: </b>' + venue_data.hours.status + '<br>';
                              var rating = '<b>Rating: </b>' + venue_data.rating + '<br>';
                              var readMore = '<a href="' + venue_data.shortUrl +'" target="_blank">Read More on Foursquare Website</a>'
                              self.state.infowindow.setContent(name + contact + price + hours + rating + readMore);
                            });
                        })
                      })
                    })
            .catch(function (err) {
                self.state.infowindow.setContent("Sorry data can't be loaded");
            });
    }

    /**
     * Close the infowindow for the marker
     * @param {object} location marker
     */
    closeInfoWindow() {
        if (this.state.prevmarker) {
            this.state.prevmarker.setAnimation(null);
        }
        this.setState({
            'prevmarker': ''
        });
        this.state.infowindow.close();
    }

    /**
     * Render function of App
     */
    render() {
        return (
            <div>
                <LocationList key="100" alllocations={this.state.alllocations} openInfoWindow={this.openInfoWindow}
                              closeInfoWindow={this.closeInfoWindow}/>
                <div id="map"></div>
            </div>
        );
    }
}

export default App;

/**
 * Load the google maps Asynchronously
 * @param {url} url of the google maps script
 */
function loadMapJS(src) {
    var ref = window.document.getElementsByTagName("script")[0];
    var script = window.document.createElement("script");
    script.src = src;
    script.async = true;
    script.onerror = function () {
        document.write("Google Maps can't be loaded");
    };
    ref.parentNode.insertBefore(script, ref);
}