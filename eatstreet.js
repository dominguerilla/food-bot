var http = require('http');

var host = "api.eatstreet.com";
var path = "/publicapi/v1/restaurant/search?";
var method = "delivery";
var address = "618 Allison Road Piscataway NJ";

var total_url = path + "method=" + method + "&street-address=" + encodeURIComponent(address);



var options = {
    'host' : host,
    'path' : total_url,
    'headers' : {'X-Access-Token' : '8b70a7ee390274a3'}
};

console.log(host + total_url);

callback = function(response) {
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

http.request(options, callback).end();