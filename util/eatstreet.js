// Handles dealing with the Eatstreet API.

var http = require('http');
var request = require('request');
var auth = require('./auth.js');

var host = "api.eatstreet.com";
var restaurant_endpoint = "/publicapi/v1/restaurant";
var method = "delivery";
var address = "618 Allison Road Piscataway NJ";


var access_token = auth.eatstreet;

// Gets the restaurants near this address.
function GetRestaurants(address, callback){
    // need to encode the given address to use as a URL
    address = encodeURIComponent(address);

    var path_url = restaurant_endpoint + "/search?method=delivery&street-address=" + address;
    console.log('Path URL: ' + path_url);

    var options = {
        'host' : host,
        'path' : path_url,
        'headers' : {'X-Access-Token' : access_token}
    };

    
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

function GetMenu(apiKey, callback){
    var path_url = restaurant_endpoint + "/" + encodeURIComponent(apiKey) + "/menu";
    console.log('Path URL: ' + path_url);

    var options = {
        'host' : host,
        'path' : path_url,
        'headers' : {'X-Access-Token' : access_token}
    };

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
module.exports.GetMenu = GetMenu;