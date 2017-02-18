var http = require('http');
var request = require('request');

var host = "api.eatstreet.com";
var restaurant_search_path = "/publicapi/v1/restaurant/search?";
var method = "delivery";
var address = "618 Allison Road Piscataway NJ";

function Hello(){
    console.log('hello');
}

function GetNum(){
    return 5;
}

function GetSampleJSON(){
    return {'key1' : 'val1', 'key2' : 'val2', 'key3' : 'val3'};
}

function PrintResponse(response){
    var str = '';

    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
        str += chunk;
    });

    //the whole response has been recieved, so we just print it out here
    response.on('end', function () {
        console.log(str);
    });
}

// Gets the restaurants near this address.
function GetRestaurants(address, method){
    console.log('Received address: ' + address);
    address = encodeURIComponent(address);
    console.log('Encoded address: ' + address);

    console.log('Received method: ' + method);

    var path_url = restaurant_search_path + "method=" + method + "&street-address=" + address;
    console.log('Path URL: ' + path_url);

    var options = {
        'host' : host,
        'path' : path_url,
        'headers' : {'X-Access-Token' : '8b70a7ee390274a3'}
    };

    
    http.request(options, PrintResponse).end();
}

module.exports.GetRestaurants = GetRestaurants;
module.exports.Hello = Hello;
module.exports.GetNum = GetNum;
module.exports.GetSampleJSON = GetSampleJSON;