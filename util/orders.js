var eatstreet = require('./eatstreet.js')
var restaurants = require('./restaurants.js');
var announcementchannelid = ""; //The channel id where the bot will announce an order being made
var Q = require('q');

// list of currently active orders
var activeOrders = [];
//OBJECTS--------------------------------------------------------------
function Item(id, name, quantity, price){
    this.id = id;
    this.name = name;
    this.quantity = quantity;
    this.price = price; // price per item, not total price
}

Item.prototype = {
    constructor: Item
}

function Investor(name){
    this.name = name;
    this.items = [];
    this.total = 0.0;
}

Investor.prototype = {
    constructor: Investor,
    addItem: function(id, name, quantity, price) {
        this.items.push(new Item(id, name, quantity, price));
        this.total += price;
    }
}

function Order(buyer, restaurant){
    this.buyer = buyer;
    this.restaurant = restaurant;
    this.investors = [];
}

Order.prototype = {
    constructor: Order,
    addInvestor: function(investor){
        this.items.push(investor);
    }
}


//FUNCTIONS--------------------------------------------------------------
function Convo_StartOrder(bot, message){
    bot.startConversation(message, function(err, convo){
        if(!err){
            var restaurantName = message.match[1];
            MenuQuery(err, convo, restaurantName);
        }else{
            console.log("Error starting order: " + err);
        }
    });
}

function MenuQuery(err, convo, restaurantName){
    if(!err){               
        Q.nfcall(restaurants.GetMenu, restaurantName)
            .then(function(value){
                console.log('Successfully got menu query.');
                convo.say('Menu:\n' + value.join(''));
            }, function(error){
                console.log('Error in Convo_StartOrder(): ' + error + "\n" + error.stack);
                convo.say("Error: " + error);
            });
    }else{
        console.log('MenuQuery() error: ' + err);
    }
}

function OrderItem(err, convo, item){
    // check if item exists
    // ask how many of it
    // add to order of person
    if(!err){
        convo.ask("How many ");
    }else{
        console.log('OrderItem() error: ' + err);
    }
}

module.exports.Convo_StartOrder = Convo_StartOrder;