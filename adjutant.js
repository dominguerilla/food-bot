var Botkit;
var controller;
var bot;

var http = require('http');
var restaurants = require('./restaurant.json');


function Initialize(){
    Botkit = require('./node_modules/botkit/lib/Botkit.js');
    controller = Botkit.slackbot({});
    bot = controller.spawn({
        token: 'xoxb-62642765440-Wl0VpsOWjH49pKoCbvITCJKy'
    }).startRTM();

    controller.hears(['list'], 'direct_message,direct_mention,mention', ListRestaurants);
    controller.hears(['eatstreet'], 'direct_message,direct_mention,mention', Convo_GetRestaurantsForAddress);
}

function ListRestaurants(bot, message){
    var rest = "";
    var isFirst = true;
    restaurants.restaurants.forEach(function (element) { 
        if(isFirst){
            rest += element.name;
            isFirst = false;
        }else{
            rest += ", " + element.name;
        }
    });
    bot.reply(message, "Available restaurants: " + rest);
}

function Convo_GetRestaurantsForAddress(bot, message){
    bot.startConversation(message, function(err, convo){
    if(!err){
        var getmethod = "";
        convo.ask('Pickup, delivery, or both?', [
            {
                pattern: 'pickup',
                callback: function(response, convo){
                    convo.next();
                }
            },
            {
                pattern: 'delivery',
                callback: function(response, convo){
                    convo.next();
                }
            },
            {
                pattern: 'both',
                callback: function(response, convo){
                    convo.next();
                }
            },
            {
                default: true,
                callback: function(response, convo){
                    convo.repeat();
                }
            }
        ], {'key' : 'method'});

        convo.ask("Address?", function(response, convo){
            convo.ask("Your address is " + response.text + "?", [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    convo.repeat();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                }
                            }
            ]);
            convo.next();
        }, {'key' : 'address'});

        convo.on('end', function(convo){
            if(convo.status == 'completed'){
                convo.say( 'Making query....');
                var meth = convo.extractResponse('method');
                var addr = convo.extractResponse('address');
                bot.reply(message, 'You wanted to search near ' + addr + ' for delivery or pickup: ' + meth);
                /*
                var options = {
                    'host' : "https://api.eatstreet.com/publicapi/v1/restaurant/search?" + "method=" + getmethod + "&" + encodeURIComponent(address),
                    'X-Access-Token' :'8b70a7ee390274a3' 
                };
                */
            }else{
                bot.reply(message, 'Cancelling query.');
            }
        })
        
    }
    });
}

Initialize();