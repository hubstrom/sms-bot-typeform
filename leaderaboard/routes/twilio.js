var config = require('../config');

//require the Twilio module and create a REST client
var client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);


module.exports = client;
