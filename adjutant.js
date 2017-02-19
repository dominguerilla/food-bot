var Botkit;
var controller;
var bot;
var query_cache = [];

var http = require('http');
var restaurants = require('./restaurant.json');
var eatstreet = require('./eatstreet.js');

function Initialize(){
    Botkit = require('./node_modules/botkit/lib/Botkit.js');
    controller = Botkit.slackbot({});
    bot = controller.spawn({
        token: 'xoxb-142754318753-jqdOuX5RQs6mpSwKlhP8kzlQ'
    }).startRTM();

    controller.hears(['list'], 'direct_message,direct_mention,mention', ListRestaurants);
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
                                        convo.repeat();
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
                                    }
                                }
                ]);
                convo.next();
            }, {'key' : 'address'});
            convo.on('end', function(convo){
                if(convo.status == 'completed'){
                        bot.reply(message, 'Searching for restaurants....');
                        eatstreet.GetRestaurants(convo.extractResponse('address'),  function(rez){
                            response = JSON.parse(rez);
                            response.restaurants.forEach((element) => {restaurant_list.push(element.name); });
                            bot.reply(message, 'Available restaurants: \n' + restaurant_list.join('\n'));
                        });
                }
            });
        }else{
            console.log('Error has occured: ' + err);
        }
    });
}



Initialize();