var eatstreet = require('./eatstreet.js');
var Q = require('q');

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

/*
    Finds the restaurants available for a given address.
    Also caches the search into address_cache, as well as the restaurants found in restaurant_cache.
*/
function Convo_FindRestaurants(bot, message){
    var response = '';
    var restaurant_list = [];

    bot.startConversationInThread(message, function(err, convo){
        if(!err){
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
                        eatstreet.GetRestaurants( address ,  function(rez){
                            response = JSON.parse(rez);
                            if(response.restaurants.length == 0){
                                bot.reply(message, 'No restaurants found for ' + address + ".");
                            }else{
                                CacheAddressAndRestaurants( address , response.restaurants);
                                //PrintRestaurantCache();
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
function Convo_GetMenu(bot, message){
    bot.startConversationInThread(message, function(err, convo){
        if(!err){
            convo.ask('Name of restaurant?', function(response, convo){convo.next();},{'key' : 'name'});
            convo.on('end', function(convo){
                if(convo.status == 'completed'){
                    bot.reply(message, 'Finding menu....');
                    var name = convo.extractResponse('name');
                    Q.nfcall(GetMenu, name)
                    .then( function (value) {
                        console.log('Successfully got menu!');
                        bot.reply(message, 'Menu:\n' + value.join(''));
                    }, function(error){
                        console.log('Error in Convo_GetMenu(): ' + error + "\n" + error.stack);
                        bot.reply(message, "Error: " + error);
                    })
                }
            });
        }else{
            console.log('*** ERROR STARTING CONVERSATION: ' + err + ' ***');
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

function Convo_ListRestaurants(bot, message){
    var allRes = "";
    restaurant_cache.forEach((e) => {
        allRes += e.name + "\n";
    });
    bot.replyInThread(message, "Restaurants cached:\n" + allRes);
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

function GetMenu(restaurant_name, callback){
    var reply_string = [];
    var rest_index = IndexOfObject(restaurant_cache, restaurant_name, function(element, targetval){
        return element.name === targetval;
    });
    if(rest_index > 0){
        console.log(restaurant_name + " found. Getting menu...");
        eatstreet.GetMenu(restaurant_cache[rest_index].apiKey, function(response){
            response = JSON.parse(response);
            if(response.error == 'true'){
                console.log('Error getting restaurant: ' + response.error_message);
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
            console.log('Got menu for ' + restaurant_name + ' successfully.');
            return callback(null, reply_string);
        });
    }else{
        console.log('restaurant ' + restaurant_name + ' not found.');
        return callback("Restaurant " + restaurant_name + " not found.", null);
    }
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

module.exports.GetMenu = GetMenu;
module.exports.Convo_GetMenu = Convo_GetMenu;
module.exports.Convo_FindRestaurants = Convo_FindRestaurants;
module.exports.Convo_ListRestaurants = Convo_ListRestaurants;