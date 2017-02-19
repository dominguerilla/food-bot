var Botkit;
var controller;
var bot;

// Should be populated with 
// { address : string, time_of_cache: long, 
//   restaurants : [ { name : string, apiKey : string } ] }
var query_cache = [];

var http = require('http');
var restaurants = require('./restaurant.json');
var eatstreet = require('./eatstreet.js');

function Initialize(){
    Botkit = require('./node_modules/botkit/lib/Botkit.js');
    controller = Botkit.slackbot({});
    bot = controller.spawn({
        token: 'xoxb-62642765440-fD85sUDyn1WQj3V8IZHDvD3h'
    }).startRTM();

    controller.hears(['list'], 'direct_message,direct_mention,mention', ListRestaurants);
}

// Caches the restaurants that are close to the given address, to mitigate repetitive calls to Eatstreet API
function CacheRestaurants(address, restaurants){
    if(restaurants.length > 0){
        var existing_index = query_cache.indexOf(o => o.address === address);
        if (existing_index !== -1){
            // this address has been looked up already--delete previous entry
            console.log('Deleting previous entry for ' + query_cache[existing_index].address);
            query_cache.splice(existing_index, 1);
        }

        var rest_tuples = [];
        // first, get the restaurant names and their apiKeys
        restaurants.forEach((element) => {rest_tuples.push({'name' : element.name, 'apiKey' : element.apiKey}); });

        query_cache.push(
            {
                'address' : address,
                'time_of_cache' : Date.now(),
                'restaurants' : rest_tuples
            }
        );
    }
}

function PrintCache(){
    console.log('\n PRINTING CACHE');
    console.log('Number of cache entries: ' + query_cache.length);
    console.log('===================');
    query_cache.forEach((e) => {
        console.log('-------------------');
        console.log('Restaurant: ' + e.address);
        console.log('Time of cache: ' + e.time_of_cache);
        console.log('Available restaurants:');
        e.restaurants.forEach((r) => {console.log(r.name + ', ' + r.apiKey)});
        console.log('-------------------');
    });
    console.log('===================');

}

function ListRestaurants(bot, message){
    var response = '';
    var restaurant_list = [];

    bot.startConversation(message, function(err, convo){
        if(!err){
            console.log('Conversation started.');
            convo.ask("Address of delivery?", function(response, convo){
                convo.ask("Your address is " + response.text + "?", [
                                {
                                    pattern: bot.utterances.yes,
                                    callback: function(response, convo) {
                                        // since no further messages are queued after this,
                                        // the conversation will end naturally with status == 'completed'
                                        convo.next();
                                    }
                                },
                                {
                                    pattern: bot.utterances.no,
                                    callback: function(response, convo) {
                                        convo.say('Try asking again.');
                                        convo.stop();
                                    }
                                },
                                {
                                    pattern: ['cancel', 'never mind', 'nvm'],
                                    callback: function(response, convo){
                                        convo.say('No problem.');
                                        convo.stop();
                                    }
                                },
                                {
                                    default: true,
                                    callback: function(response, convo) {
                                        convo.repeat();
                                        convo.next();
                                    }
                                }
                ]);
                convo.next();
            }, {'key' : 'address'});
            convo.on('end', function(convo){
                if(convo.status == 'completed'){
                        bot.reply(message, 'Searching for restaurants....');
                        var address = convo.extractResponse('address');
                        eatstreet.GetRestaurants(address,  function(rez){
                            response = JSON.parse(rez);
                            if(response.restaurants.length == 0){
                                bot.reply(message, 'No restaurants found for ' + address + ".");
                            }else{
                                CacheRestaurants(address, response.restaurants);
                                PrintCache();
                                response.restaurants.forEach((element) => {restaurant_list.push(element.name); });
                                bot.reply(message, 'Available restaurants for ' + address + ': \n' + restaurant_list.join('\n'));
                            }
                        });
                }else{
                    bot.reply(message, 'Try asking again.');
                }
            });
        }else{
            console.log('Error has occured: ' + err);
        }
    });
}



Initialize();