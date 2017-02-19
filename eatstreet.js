// Handles dealing with the Eatstreet API.

var http = require('http');
var request = require('request');

var host = "api.eatstreet.com";
var restaurant_search_path = "/publicapi/v1/restaurant/search?";
var method = "delivery";
var address = "618 Allison Road Piscataway NJ";

// Gets the restaurants near this address.
function GetRestaurants(address, callback){
    console.log('Received address: ' + address);
    address = encodeURIComponent(address);
    console.log('Encoded address: ' + address);

    console.log('Received method: ' + method);

    var path_url = restaurant_search_path + "method=delivery&street-address=" + address;
    console.log('Path URL: ' + path_url);

    var options = {
        'host' : host,
        'path' : path_url,
        'headers' : {'X-Access-Token' : '8b70a7ee390274a3'}
    };

    
    var res = null;
    http.request(options, function (response){
        var str = '';
        response.on('data', function (chunk){
            str += chunk;
        });

        response.on('end', function(){
            return callback(str);
        })
    }).end();
}

module.exports.GetRestaurants = function (address, callback){
    GetRestaurants(address, callback);
};