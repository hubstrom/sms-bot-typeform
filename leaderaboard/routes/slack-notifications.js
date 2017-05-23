'use strict';
var Bot = require('slackbots');
var express = require('express');
var router = express.Router();
var NodeGeocoder = require('node-geocoder');
var twilio = require('./twilio');

var config = require('../config');
var pg = require('pg');
var pgClient_dropbyke = new pg.Client(config.postgre_dropbyke);

// create a bot
var bot = new Bot(config.slack);
var geocoder = NodeGeocoder(config.nodegeocoder);

var params = {
    link_names: 1,
    as_user: true
};

// Twilio textmessage
var sms_text = {
    registered: "Thank you for choosing Dropbyke! Need any help? Contact us by: Messenger: m.me/dropbyke, Email: ride@dropbyke.com, Phone: +34 644 85 4466. To open the lock just pull the black part, do not press any buttons.",
    during_ride: "You look great on a bike!:) Send few pictures to: ride@dropbyke.com, we will share in Dropbyke community. Get 20% off your next daily ride price.",
    after_ride: "Thank you for using Dropbyke! Help us to improve our service with 2min survey: ride.dropbyke.com, Contact before next ride to redeem -20% discount.",
    bad_rating: "You have rated your Drobyke experience less than 5 stars. Could you share your experience via ride@dropbyke.com or m.me/dropbyke? Thank you.",
    flex_drop: "A short reminder. If you finish ride not in a starting point, additional pricing will apply. Otherwise, prices are the same as mentioned on a bike. Have fun!",
    late_night: "We hope that you are having fun. Just a short reminder: do not foget to lock the bike safely for the night and if you are not planning to use it further to stop the ride. Dropbhyke team."
}
var time_interval = 5000;
pgClient_dropbyke.connect(function(err, client) {
  if (err) throw err;
  console.log('Connected to Dropbyke postgres! Getting schemas...');

bot.on('message', function(message) {

    var current_time = new Date();
    var hours = current_time.getHours() * 3600000;
    var midnight = Math.floor(new Date()) - hours;

    var me = this.users.filter(function (user) {
        return user.name === 'frank';
    })[0];

    if( message.type === 'message' && Boolean(message.text) ) {

      if( message.text.toLowerCase().indexOf('fr fleet') > -1
              || message.text.toLowerCase().indexOf(this.name) > -1
              || message.text.indexOf(me.id) > -1) {

          if( message.user !== me.id ) {

              var fleet = {
                active: 0,
                in_ride: 0,
                inactive: 0
              };

              var fromUser = this.users.filter(function(user) {
                  return user.id === message.user;
              })[0]['name'];

              var channel = this.channels.filter(function (item) {
                  return item.id === message.channel;
              })[0];

                pgClient_dropbyke.query("SELECT * FROM bikes WHERE deleted = FALSE and name LIKE 'BC%'", function (err, result) {
                  if (err) throw err;
                  for (var i = 0; i < result.rows.length; i ++) {
                    if (result.rows[i].shepard_status == "ACTIVE") {fleet.active++}
                    else if (result.rows[i].shepard_status == "INACTIVE" && result.rows[i].deleted == false) {fleet.inactive++}
                  };
                pgClient_dropbyke.query("SELECT * FROM bike_rides", function (err, result) {
                  if (err) throw err;
                  fleet.in_ride = result.rows.length;
                  bot.postMessageToChannel(channel.name, '@' + fromUser + ' ' + 'Active bikes: ' + fleet.active + '. Inactive bikes: ' + fleet.inactive + '. Bikes in ride: ' + fleet.in_ride, params);
                });
                });
          }
        };
      if( message.text.toLowerCase().indexOf('fr users') > -1
            || message.text.toLowerCase().indexOf(this.name) > -1
            || message.text.indexOf(me.id) > -1) {

        if( message.user !== me.id ) {


            var users = {
              registered: 0,
              added_card: 0,
              in_ride: 0
            }

            var fromUser = this.users.filter(function(user) {
                return user.id === message.user;
            })[0]['name'];

            var channel = this.channels.filter(function (item) {
                return item.id === message.channel;
            })[0];

              pgClient_dropbyke.query("SELECT * FROM users WHERE created > " + midnight, function (err, result) {
                if (err) throw err;
                users.registered = result.rows.length
                for (var i = 0; i < result.rows.length; i ++) {
                  if (result.rows[i].default_card_number != "") {users.added_card++}
                  if (result.rows[i].ride_status == "RIDING") {users.in_ride++}
                };
              bot.postMessageToChannel(channel.name, '@' + fromUser + ' ' + 'Registered users: ' + users.registered + '. Added card: ' + users.added_card + '. Users in ride: ' + users.in_ride, params);
              });
        }
      };
      if( message.text.toLowerCase().indexOf('fr issues') > -1
            || message.text.toLowerCase().indexOf(this.name) > -1
            || message.text.indexOf(me.id) > -1) {

        if( message.user !== me.id ) {


            var issues = [];

            var fromUser = this.users.filter(function(user) {
                return user.id === message.user;
            })[0]['name'];

            var channel = this.channels.filter(function (item) {
                return item.id === message.channel;
            })[0];

              pgClient_dropbyke.query("SELECT * FROM bikes WHERE shepard_status = 'INACTIVE' AND deleted = FALSE AND comment_text != 'MISSING' AND name LIKE 'BC%'", function (err, result) {
                if (err) throw err;
                if (result.rows.length > 0) {
                for (var i = 0; i < result.rows.length; i++) {
                  issues[i] = '\n' + (i + 1) + '. ' + result.rows[i].name + ' ' + result.rows[i].comment_text;
                };
              bot.postMessageToChannel(channel.name, '@' + issues, params);
            } else {
              bot.postMessageToChannel(channel.name, '@' + 'I am sorry to dissapoint you, but all bikes are in good condition. Have a nice day!', params);
            };
              });
        }
      };
      if( message.text.toLowerCase().indexOf('fr rides') > -1
            || message.text.toLowerCase().indexOf(this.name) > -1
            || message.text.indexOf(me.id) > -1) {

        if( message.user !== me.id ) {


            var rides = {
              completed: {
                amount: 0,
                time: 0,
                revenue: 0
              },
              flexdrops: 0,
              in_ride: 0
            }

            var fromUser = this.users.filter(function(user) {
                return user.id === message.user;
            })[0]['name'];

            var channel = this.channels.filter(function (item) {
                return item.id === message.channel;
            })[0];

            pgClient_dropbyke.query("SELECT * FROM rides WHERE start_time > " + midnight, function (err, result) {
              if (err) throw err;
              rides.completed.amount = result.rows.length;
              for (var i = 0; i < result.rows.length; i++) {
                rides.completed.time += (result.rows[i].stop_time - result.rows[i].start_time) / 3600000;
                rides.completed.revenue += result.rows[i].price_value/100;
                if ((result.rows[i].price_value % 500) != 0) {
                  rides.flexdrops++;
                }
              }
                pgClient_dropbyke.query("SELECT * FROM bike_rides", function (err, result) {
                  if (err) throw err;
                  rides.in_ride = result.rows.length;
                  bot.postMessageToChannel(channel.name, '@' + fromUser + ' ' + 'Completed rides: ' + rides.completed.amount + ' finished, was in ride for ' + Math.round(rides.completed.time,0) + ' hours and generated €' + rides.completed.revenue + '. Flexible drops: ' + rides.flexdrops + '. Bikes in ride: ' + rides.in_ride, params);
                });
            });
        }
      };
      if( message.text.toLowerCase().indexOf('fr help') > -1
        //      || message.text.toLowerCase().indexOf(this.name) > -1
              || message.text.indexOf(me.id) > -1) {

          if( message.user !== me.id ) {

              var fromUser = this.users.filter(function(user) {
                  return user.id === message.user;
              })[0]['name'];

              var channel = this.channels.filter(function (item) {
                  return item.id === message.channel;
              })[0];

              bot.postMessageToChannel(channel.name, '@' + fromUser + ' ' + 'Information about fleet: *fr fleet*. Information about users: *fr users*. Information about rides: *fr rides*. Information about issues with bikes: *fr issues*. Get it all instantly: *frank*', params);
          }

        };
    };
  });
  setInterval(function(){scanforsometing();}, time_interval);

});

function scanforsometing() {
  var moments_ago = Math.floor(new Date()) - time_interval;
  var moments_ago_for_real = moments_ago + time_interval;
  var two_hours_ago = moments_ago - 7200000;
  var two_hours_ago_for_real = two_hours_ago + time_interval;
  var fifteen_minutes_ago = moments_ago - 900000;
  var fifteen_minutes_ago_for_real = fifteen_minutes_ago + time_interval;

  // User registered
  pgClient_dropbyke.query('SELECT type, name, phone, device_platform, ST_X(auth_location), ST_Y(auth_location), default_card_number FROM users WHERE created > ' + moments_ago, function (err, result) {
    if (err) throw err;
    var registration_address = '';
    var needtopost = true;
    if (result.rows.length > 0) {
        for (var i = 0; i < result.rows.length; i++) {
          var textmessage = {
            address: 'From: ',
            user: ''
          };
          if (result.rows[i].name == null) {result.rows[i].name = ''};
          if (result.rows[i].phone == null) {result.rows[i].phone = ''};
          geocoder.reverse({lat: result.rows[i].st_y, lon: result.rows[i].st_x}, function(err, res){
            registration_address = res[0].formattedAddress;
            if (needtopost){
            textmessage.user = '';
            bot.postMessageToChannel('notifications-dr', textmessage.address + res[0].formattedAddress, params);
          };
          });
            if(registration_address != '') {needtopost = false; textmessage.user = 'From: '};
            bot.postMessageToChannel('notifications-dr', 'New user ' + result.rows[i].name + result.rows[i].phone + ' registered with ' + result.rows[i].device_platform + '. ' + textmessage.user + registration_address, params);
          if(result.rows[i].default_card_number > 0) {
            bot.postMessageToChannel('notifications-dr', 'User ' + result.rows[i].name + result.rows[i].phone + ' added card.', params);
          };
        // Send SMS to user
        if(result.rows[i].type == 'PHONE') {
          twilio.messages.create({
              to: '+' + result.rows[i].phone,
              from: '+18556811800',
              body: sms_text.registered,
          }, function (err, message) {
              console.log(message.sid);
          });
        }
      };
    }
  });
  // User added card

  // User reserved bike
  pgClient_dropbyke.query('SELECT users.name, users.phone, bikes.serial, ST_X(bikes.point), ST_Y(bikes.point) FROM user_reserves INNER JOIN users on user_reserves.user_id = users.id INNER JOIN bikes on user_reserves.bike_id = bikes.id WHERE user_reserves.started > ' + moments_ago, function (err, result) {
    if (err) throw err;
    var bike_address = '';
    var needtopost = true;
    if (result.rows.length > 0) {
        for (var i = 0; i < result.rows.length; i++) {
          if (result.rows[i].name == null) {result.rows[i].name = ''};
          if (result.rows[i].phone == null) {result.rows[i].phone = ''};
          if (result.rows[i].serial.slice(0,2) === 'BC'){
            bot.postMessageToChannel('notifications-dr', 'User ' + result.rows[i].name + result.rows[i].phone + ' *reserved* bike ' + result.rows[i].serial + '.', params);
        };
      };
    }
  });
  // User rented bike
  pgClient_dropbyke.query('SELECT users.name, users.phone, bikes.serial, ST_X(bikes.point), ST_Y(bikes.point) FROM bike_rides INNER JOIN users on bike_rides.user_id = users.id INNER JOIN bikes on bike_rides.bike_id = bikes.id WHERE bike_rides.start_time> ' + moments_ago, function (err, result) {
    if (err) throw err;
    var bike_address = '';
    var needtopost = true;
    if (result.rows.length > 0) {
        for (var i = 0; i < result.rows.length; i++) {
          if (result.rows[i].name == null) {result.rows[i].name = ''};
          if (result.rows[i].phone == null) {result.rows[i].phone = ''};
          if (result.rows[i].serial.slice(0,2) === 'BC'){
            bot.postMessageToChannel('notifications-dr', 'User ' + result.rows[i].name + result.rows[i].phone + ' *rented* bike ' + result.rows[i].serial + '.', params);
          };
        }
      };
    });


  // User dropped bike
  pgClient_dropbyke.query('SELECT users.type, users.name, users.phone, bikes.serial, ST_X(bikes.point), ST_Y(bikes.point), rides.price_value, rides.riding_time, rides.rating, rides.comment_text FROM rides INNER JOIN users on rides.user_id = users.id INNER JOIN bikes on rides.bike_id = bikes.id WHERE rides.stop_time >  ' + moments_ago + 'AND rides.stop_time < ' + moments_ago_for_real, function (err, result) {
    if (err) throw err;
    var bike_address = '';
    var needtopost = true;
    if (result.rows.length > 0) {
        for (var i = 0; i < result.rows.length; i++) {
          if (result.rows[i].name == null) {result.rows[i].name = ''};
          if (result.rows[i].phone == null) {result.rows[i].phone = ''};
          if (result.rows[i].serial.slice(0,2) === 'BC'){
            bot.postMessageToChannel('notifications-dr', 'User ' + result.rows[i].name + result.rows[i].phone + ' *dropped* bike ' + result.rows[i].serial + '. Paid €' + (result.rows[i].price_value/100) + ' was riding for ' + Math.round((result.rows[i].riding_time/3600000),0) + 'h, and commented: ' + result.rows[i].comment_text + '.', params);
          };
  };
    };
  });
};
