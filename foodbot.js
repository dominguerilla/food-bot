var Botkit;
var controller;
var bot;

var eatstreet = require('./util/eatstreet.js');
var auth = require('./util/auth.js');
var restaurants = require('./restaurants.js');

function Initialize(){
    Botkit = require('./node_modules/botkit/lib/Botkit.js');
    controller = Botkit.slackbot({});
    bot = controller.spawn({
        token: auth.slackbot
    }).startRTM();

    controller.hears(['menu'], 'direct_message,direct_mention', restaurants.GetMenu);
    controller.hears(['find', 'nearby', 'search', 'restaurant', 'restaurants'], 'direct_message,direct_mention', restaurants.FindRestaurants);
    controller.hears(['help'], 'direct_message,direct_mention', ShowHelp);
    controller.hears(['list', 'saved'], 'direct_message,direct_mention', restaurants.ListRestaurants);
}



function ShowHelp(bot, message){
    bot.reply(message, "1. Ask to *find* restaurants near you.\n2. Ask for a *menu* from one of those specific restaurants.\n3. *List* the restaurants you've already searched for.");
}


function StartOrder(bot, message){
    bot.reply(message, "", function(err, convo){

    });
}

Initialize();