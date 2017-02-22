var Botkit;
var controller;
var bot;

// Should be populated with 
// { address : string, time_of_cache: long, 
//   restaurants : [ { name : string, apiKey : string } ] }
// TODO: Based on the time_of_cache, decide whether or not to query EatStreet for the list of restaurants near an address that has previously been queried.
var address_cache = [];

// A cache of available restaurants from EatStreet.
// Should be populated with 
// {name : string, apiKey : string }
// This will make it easier to search Eatstreet for a specific restaurant.
var restaurant_cache = [];

var http = require('http');
var eatstreet = require('./util/eatstreet.js');
var auth = require('./util/auth.js');

function Initialize(){
    Botkit = require('./node_modules/botkit/lib/Botkit.js');
    controller = Botkit.slackbot({});
    bot = controller.spawn({
        token: auth.slackbot
    }).startRTM();

    controller.hears(['menu'], 'direct_message', GetMenu);
    controller.hears(['list'], 'direct_message', ListRestaurants);
}

/*
    Lists the restaurants available for a given address.
    Also caches the search into address_cache, as well as the restaurants found in restaurant_cache.
*/
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
                                CacheAddressAndRestaurants(address, response.restaurants);
                                PrintRestaurantCache();
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

/*
    Given the name of a restaurant that is saved in restaurant_cache, queries EatStreet for their menu and displays the full content 
    to the chatter.
*/
function GetMenu(bot, message){
    bot.startConversation(message, function(err, convo){
        if(!err){
            convo.ask('Name of restaurant?', function(response, convo){convo.next();},{'key' : 'name'});
            convo.on('end', function(convo){
                if(convo.status == 'completed'){
                    var reply_string = [];
                    bot.reply(message, 'Finding menu....');
                    var name = convo.extractResponse('name');
                    var rest_index = IndexOfObject(restaurant_cache, name, function(element, targetval){
                        return element.name === targetval;
                    });
                    if(rest_index > 0){
                        eatstreet.GetMenu(restaurant_cache[rest_index].apiKey, function(response){
                            response = JSON.parse(response);
                            if(response.error == 'true'){
                                bot.reply(message, 'Error getting restaurant: ' + response.error_message);
                                return;
                            }

                            // iterating over each category
                            response.forEach((element) => {
                                reply_string.push('----------------------------------------\n');
                                reply_string.push( element.name + '\n');
                                reply_string.push('----------------------------------------\n');

                                // iterating over inner 'items' array
                                element.items.forEach((inner_element) => {
                                    reply_string.push(inner_element.name + " " + inner_element.basePrice + '\n');
                                });
                            });
                            bot.reply(message, "Menu items for " + restaurant_cache[rest_index].name +  ":\n" + reply_string.join(''));
                        });
                    }else{
                        bot.reply(message, "Couldn't find " + name + ' in saved restaurants.');
                    }
                }
            });
        }else{
            console.log('*** ERROR STARTING CONVERSATION ***');
        }
    });
}

// Caches the restaurants that are close to the given address, to mitigate repetitive calls to Eatstreet API
// Also caches the restaurants found into the restaurant_cache
function CacheAddressAndRestaurants(address, restaurants){
    if(restaurants.length > 0){
        // See if the address entry already exists in cache
        var existing_index = IndexOfObject(address_cache, address, function(element, targetval){
            return element.address === targetval;
        });
        if (existing_index !== -1){
            // this address has been looked up already--delete previous entry
            console.log('Deleting previous entry for ' + address_cache[existing_index].address);
            address_cache.splice(existing_index, 1);
        }

        var rest_tuples = [];
        // first, get the restaurant names and their apiKeys
        restaurants.forEach((element) => {
            r = {'name' : element.name, 'apiKey' : element.apiKey};
            
            // check if restaurant is already in restaurant_cache
            var r_index = IndexOfObject(restaurant_cache, r.name, function(element, targetval){
                return element.name === targetval;
            });
            // if it's not already in there, push it to restaurant cache
            if(r_index == -1){
                restaurant_cache.push(r);
            }
            // add to address_cache entry
            rest_tuples.push(r); 
        });

        address_cache.push(
            {
                'address' : address,
                'time_of_cache' : Date.now(),
                'restaurants' : rest_tuples
            }
        );
    }
}

// Check if something exists in an array of object, based on the given checkFunc
// checkFunc should be = function(element, targetval) that returns true if 
// there's a match, false otherwise
function IndexOfObject(arr, targetval, checkFunc){
    for(var i = 0; i < arr.length; i++){
        if(checkFunc(arr[i], targetval)){
            return i;
        }
    }
    return -1;
}

function PrintAddressCache(){
    console.log('\nPRINTING ADDRESS CACHE');
    console.log('Number of cache entries: ' + address_cache.length);
    console.log('===================');
    address_cache.forEach((e) => {
        console.log('Restaurant: ' + e.address);
        console.log('Time of cache: ' + e.time_of_cache);
        console.log('Available restaurants:');
        e.restaurants.forEach((r) => {console.log(r.name + ', ' + r.apiKey)});
        console.log('-------------------');
    });
    console.log('===================');

}

function PrintRestaurantCache(){
    console.log('\nPRINTING RESTAURANT CACHE');
    console.log('Number of cache entries: ' + restaurant_cache.length);
    console.log('===================');
    restaurant_cache.forEach((e) => {
        console.log('Restaurant: ' + e.name);
        console.log('apiKey: ' + e.apiKey);
        console.log('-------------------');
    });
    console.log('===================');
}

Initialize();