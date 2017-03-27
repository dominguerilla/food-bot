var Botkit;
var controller;
var bot;

var eatstreet = require('./util/eatstreet.js');
var auth = require('./util/auth.js');
var restaurants = require('./util/restaurants.js');
var orders = require('./util/orders.js');

function Initialize(){
    Botkit = require('./node_modules/botkit/lib/Botkit.js');
    controller = Botkit.slackbot({});
    bot = controller.spawn({
        token: auth.slackbot
    }).startRTM();

    // Initialize the restaurant cache with restaurants around the listed
    // addresses in auth.js
    restaurants.Initialize();

    controller.hears(['menu'], 'direct_message,direct_mention', restaurants.Convo_GetMenu);
    controller.hears(['find', 'nearby', 'search', 'restaurant', 'restaurants'], 'direct_message,direct_mention', restaurants.Convo_FindRestaurants);
    controller.hears(['help'], 'direct_message,direct_mention', ShowHelp);
    controller.hears(['list', 'saved'], 'direct_message,direct_mention', restaurants.Convo_ListRestaurants);
    controller.hears('startorder (.*)', 'direct_message', orders.Convo_StartOrder);
}



function ShowHelp(bot, message){
    bot.reply(message, "1. Ask to *find* restaurants near you.\n2. Ask for a *menu* from one of those specific restaurants.\n3. *List* the restaurants you've already searched for.");
}


Initialize();