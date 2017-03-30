// After adding your tokens, be sure to run 'git update-index --assume-unchanged auth.js'
// If not done, every time you pull from the repo, the tokens will be overwritten.
var eatstreet_token = ''; // EATSTREET API TOKEN HERE
var slackbot_token = ''; // SLACKBOT TOKEN HERE

// Will get and cache these addresses on bot startup.
var initial_addresses = [];

module.exports.eatstreet = eatstreet_token;
module.exports.slackbot = slackbot_token;
module.exports.initial_addresses = initial_addresses;
