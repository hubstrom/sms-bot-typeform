let config = require("../config.json");
const TelegramBot = require('node-telegram-bot-api');
var watson = require('watson-developer-cloud');
var express = require('express');
var request = require('request');
var twilio = require('./twilio');
var router = express.Router();
// replace the value below with the Telegram token you receive from @BotFather
const token = config.botToken;
const testToken = config.botTokenTest;
const activeToken = token;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(activeToken, {polling: true});

let pg = require('pg');

let client = new pg.Client(config.connectionConfig);
let clientDropbyke = new pg.Client(config.connectionConfigDropbyke);

let timelength, lastmidnight, asked_date, phone_number, userid_to_show, revenuesum, bike_issues, helpsection, specialcase;
let scanninginterval = 10000;
let chatids = {
  barcelona: -206973971,
  personal: 325631898
}
let activeID = chatids.barcelona;
let brugesID = -215835699;

// Twilio support
// router.get('/twilio', function(req, res) {
//         console.log(res);
//     });


client.connect(function(err) {
  if(err) {
    return console.error('error fetching client', err);
  }
  console.log("Connection with Frank established");

  // -----------------------------------------------------------------
  // Matches "/echo [whatever]"
  bot.onText(/\/(.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
    // send back the matched "whatever" to the chat
    // Dropbyke Barcelona ID = -206973971
    // My personal = 325631898
    if (chatId === activeID) {
      switch(resp.slice(0, 4)) {
        case 'user':
          if (resp === 'users') {
            timelength = 0;
          } else if (resp.length > 5 && resp.match(/\d+/)[0] > 0) {
            timelength = resp.match(/\d+/)[0];
          }
          lastmidnight = new Date();
          lastmidnight = Math.floor(lastmidnight.setHours(0,0,0,0));
          asked_date = lastmidnight - 86400000 * timelength;
          client.query('SELECT id FROM users WHERE created > ' + asked_date, function(err, result) {
            if(err) {
              return console.error('error running query', err);
            }
            if (timelength === 0) {
              bot.sendMessage(chatId, 'New users today: ' + JSON.stringify(result.rows.length));
            } else if (timelength == 1) {
              bot.sendMessage(chatId, 'New users since yesterday: ' + JSON.stringify(result.rows.length));
            } else if (timelength > 1) {
              bot.sendMessage(chatId, 'New users since ' + timelength + ' days ago: ' + JSON.stringify(result.rows.length));
            };
          });
          break;
        case 'ride':
          if (resp === 'rides') {
            timelength = 0;
          } else if (resp.length > 5 && resp.match(/\d+/)[0] > 0) {
            timelength = resp.match(/\d+/)[0];
          }
          lastmidnight = new Date();
          lastmidnight = Math.floor(lastmidnight.setHours(0,0,0,0));
          asked_date = lastmidnight - 86400000 * timelength;
          client.query("SELECT rides.price_value FROM rides INNER JOIN bikes ON rides.bike_id = bikes.id WHERE bikes.name LIKE 'BC%' AND stop_time > " + asked_date, function(err, result) {
            if(err) {
              return console.error('error running query', err);
            }
            revenuesum = 0;
            for (let i = 0; i < result.rows.length; i++) {
              specialcase = 0
              if (parseInt(result.rows[i].price_value) === 376200) { revenuesum -= 3762 };
              revenuesum += parseInt(result.rows[i].price_value)/100;
            }
            if (timelength === 0) {
              bot.sendMessage(chatId, 'Amount of Rides today: ' + JSON.stringify(result.rows.length) + '. Revenue generated: € ' + revenuesum + '.');
            } else if (timelength == 1) {
              bot.sendMessage(chatId, 'Amount of Rides since yesterday: ' + JSON.stringify(result.rows.length) + '. Revenue generated: € ' + revenuesum + '.');
            } else if (timelength > 1) {
              bot.sendMessage(chatId, 'Amount of Rides since ' + timelength + ' days ago: ' + JSON.stringify(result.rows.length) + '. Revenue generated: € ' + revenuesum + '.');
            };
          });
          break;
        case 'bike':
          if (resp === 'bikes') {
            timelength = 1;
          } else if (resp.length > 5 && resp.match(/\d+/)[0] > 0) {
            timelength = resp.match(/\d+/)[0];
          }
          lastmidnight = new Date();
          lastmidnight = Math.floor(lastmidnight.setHours(0,0,0,0));
          asked_date = lastmidnight - 86400000 * timelength;
            client.query('SELECT * FROM bikes_status_log WHERE timestamp > ' + asked_date + 'ORDER BY timestamp ASC LIMIT 1', function(err, result) {
              if(err) {
                return console.error('error running query', err);
              }
              if (timelength === 0) {
                bot.sendMessage(chatId, 'Bike status today: Healthy:' + result.rows[0].healthy + ' Sick: ' + result.rows[0].sick + ' Dead: ' + result.rows[0].dead + ' Missing: ' + result.rows[0].missing + '.');
              } else if (timelength == 1) {
                bot.sendMessage(chatId, 'Bike status yesterday: Healthy:' + result.rows[0].healthy + ' Sick: ' + result.rows[0].sick + ' Dead: ' + result.rows[0].dead + ' Missing: ' + result.rows[0].missing + '.');
              } else if (timelength > 1) {
                bot.sendMessage(chatId, 'Bike status ' + timelength + ' days ago: Healthy:' + result.rows[0].healthy + ' Sick: ' + result.rows[0].sick + ' Dead: ' + result.rows[0].dead + ' Missing: ' + result.rows[0].missing + '.');
              };
            });
          break;
        case 'issu':
          bike_issues = [];
          client.query("SELECT name, comment_text FROM bikes WHERE shepard_status = 'INACTIVE' AND deleted = FALSE AND comment_text != 'MISSING' AND name LIKE 'BC%'", function(err, result) {
            if(err) {
              return console.error('error running query', err);
            }
            if (result.rows.length > 0) {
              for (var i = 0; i < result.rows.length; i++) {
                    bike_issues[i] = '\n' + (i + 1) + '. ' + result.rows[i].name + ' ' + result.rows[i].comment_text;
                  };
              } else {
                bike_issues[0] = 'None';
              }
            bot.sendMessage(chatId, 'Bikes issues:' + bike_issues);
          });
          break;
        case 'loca':
          if (resp.length === 16) {
            client.query("SELECT name, ST_X(point), ST_Y(point), photo_path FROM bikes WHERE name = '" + resp.slice(9, 16) + "'", function (err, result) {
              if(err) {
                return console.error('error running query', err);
              };
              if (result.rows.length > 0 ) {
                bot.sendLocation(chatId, result.rows[0].st_y, result.rows[0].st_x);
                bot.sendPhoto(chatId, result.rows[0].photo_path);
              } else {
                bot.sendMessage(chatId, 'Wrong request, try again. Please use this format: /location BC-0001');
              };
            });
          } else {
            bot.sendMessage(chatId, 'Wrong request, try again');
          }
          break;
        case 'send':
          phone_number = resp.split('::');
          twilio.messages.create({
              to: phone_number[1],
              from: '+18556811800',
              body: phone_number[2],
          }, function (err, message) {
              console.log(message.sid);
          });
          break;
        case 'help':
          helpsection = [];

          helpsection[0] = 'Frank commands, execute them with proper caution:';
          helpsection[1] = '\n"/users 1" - shows amount of new users since some days ago (e.g. /users 7 - will show how many users registered from 7 days ago until this moment)';
          helpsection[2] = '\n"/rides 1" - shows amount of rides and accumulated revenue since some days ago (e.g. /rides 7 - will show how many rides were done from 7 days ago until this moment)';
          helpsection[3] = '\n"/bikes 1" - shows bike status in given period (e.g. /bikes 0 - will show bikes status today and /bikes 7 - will show bikes status 7 days ago)';
          helpsection[4] = '\n"/issues" - shows current bike issues.';
          helpsection[5] = '\n"/location BC-0001" - shows bike location link and last bike photo';
          helpsection[6] = '\n"/help" - shows this help section';

          bot.sendMessage(chatId, helpsection[0] + helpsection[1] + helpsection[2] + helpsection[3] + helpsection[4] + helpsection[5] + helpsection[6]);
          break;
        default:
          bot.sendMessage(chatId, 'I am not sure if you want me to do right thing...');
          break;
      }

    } else if (chatId === brugesID) {
      switch(resp.slice(0, 4)) {
        case 'user':
          if (resp === 'users') {
            timelength = 0;
          } else if (resp.length > 5 && resp.match(/\d+/)[0] > 0) {
            timelength = resp.match(/\d+/)[0];
          }
          lastmidnight = new Date();
          lastmidnight = Math.floor(lastmidnight.setHours(0,0,0,0));
          asked_date = lastmidnight - 86400000 * timelength;
          client.query('SELECT id FROM users WHERE created > ' + asked_date, function(err, result) {
            if(err) {
              return console.error('error running query', err);
            }
            if (timelength === 0) {
              bot.sendMessage(chatId, 'New users today: ' + JSON.stringify(result.rows.length));
            } else if (timelength == 1) {
              bot.sendMessage(chatId, 'New users since yesterday: ' + JSON.stringify(result.rows.length));
            } else if (timelength > 1) {
              bot.sendMessage(chatId, 'New users since ' + timelength + ' days ago: ' + JSON.stringify(result.rows.length));
            };
          });
          break;
        case 'ride':
          if (resp === 'rides') {
            timelength = 0;
          } else if (resp.length > 5 && resp.match(/\d+/)[0] > 0) {
            timelength = resp.match(/\d+/)[0];
          }
          lastmidnight = new Date();
          lastmidnight = Math.floor(lastmidnight.setHours(0,0,0,0));
          asked_date = lastmidnight - 86400000 * timelength;
          client.query("SELECT rides.price_value FROM rides INNER JOIN bikes ON rides.bike_id = bikes.id WHERE bikes.name LIKE 'BG%' AND stop_time > " + asked_date, function(err, result) {
            if(err) {
              return console.error('error running query', err);
            }
            revenuesum = 0;
            for (let i = 0; i < result.rows.length; i++) {
              specialcase = 0
              if (parseInt(result.rows[i].price_value) === 376200) { revenuesum -= 3762 };
              revenuesum += parseInt(result.rows[i].price_value)/100;
            }
            if (timelength === 0) {
              bot.sendMessage(chatId, 'Amount of Rides today: ' + JSON.stringify(result.rows.length) + '. Revenue generated: € ' + revenuesum + '.');
            } else if (timelength == 1) {
              bot.sendMessage(chatId, 'Amount of Rides since yesterday: ' + JSON.stringify(result.rows.length) + '. Revenue generated: € ' + revenuesum + '.');
            } else if (timelength > 1) {
              bot.sendMessage(chatId, 'Amount of Rides since ' + timelength + ' days ago: ' + JSON.stringify(result.rows.length) + '. Revenue generated: € ' + revenuesum + '.');
            };
          });
          break;
        case 'help':
          helpsection = [];

          helpsection[0] = 'Frank commands, execute them with proper caution:';
          helpsection[1] = '\n"/users 1" - shows amount of new users since some days ago (e.g. /users 7 - will show how many users registered from 7 days ago until this moment)';
          helpsection[2] = '\n"/rides 1" - shows amount of rides and accumulated revenue since some days ago (e.g. /rides 7 - will show how many rides were done from 7 days ago until this moment)';
          helpsection[3] = '\n"/bikes 1" - shows bike status in given period (e.g. /bikes 0 - will show bikes status today and /bikes 7 - will show bikes status 7 days ago)';
          helpsection[4] = '\n"/issues" - shows current bike issues.';
          helpsection[5] = '\n"/location BC-0001" - shows bike location link and last bike photo';
          helpsection[6] = '\n"/help" - shows this help section';

          bot.sendMessage(chatId, helpsection[0] + helpsection[1] + helpsection[2] + helpsection[6]);
          break;
        default:
          bot.sendMessage(chatId, 'I am not sure if you want me to do right thing...');
          break;
      }

    } else {
         bot.sendMessage(chatId, 'I am not allowed to speak with you.');
    };
  });
});

clientDropbyke.connect(function(err) {
  if(err) {
    return console.error('error fetching client', err);
  }
  console.log("Connection with Dropbyke established");
  setInterval(function(){EventListener();}, scanninginterval);
});

const EventListener = () => {
    let currentmoment = Math.floor(new Date());
    let pastmoment = currentmoment - scanninginterval;
/*
    clientDropbyke.query("SELECT device_language, id FROM users WHERE created > " + pastmoment, function (err, result) {
      if (err) throw err;
      if (result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          let locale = result.rows[i].device_language[3] + result.rows[i].device_language[4];
          bot.sendMessage(activeID, locale + ' registered as Nr. ' + result.rows[i].id + '.');
          bot.sendMessage(brugesID, locale + ' registered as Nr. ' + result.rows[i].id + '.');
        }
      }
    });
*/
    clientDropbyke.query("SELECT bikes.name, bike_reserves.user_id, users.device_language FROM bike_reserves INNER JOIN bikes ON bike_reserves.bike_id = bikes.id INNER JOIN users ON bike_reserves.user_id = users.id WHERE bikes.name LIKE 'BC%' AND bike_reserves.start_time > " + pastmoment, function (err, result) {
      if (err) throw err;
      if (result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          let locale = result.rows[i].device_language[3] + result.rows[i].device_language[4];
          bot.sendMessage(activeID, 'Reserved ' + result.rows[i].name + ' by ' + locale + '(' + result.rows[i].user_id + ').');
        }
      }
    });

    clientDropbyke.query("SELECT bikes.name, bike_rides.user_id, users.device_language FROM bike_rides INNER JOIN bikes ON bike_rides.bike_id = bikes.id INNER JOIN users ON bike_rides.user_id = users.id WHERE bikes.name LIKE 'BC%' AND bike_rides.start_time > " + pastmoment, function (err, result) {
      if (err) throw err;
      if (result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          let locale = result.rows[i].device_language[3] + result.rows[i].device_language[4];
          bot.sendMessage(activeID, 'Rented ' + result.rows[i].name + ' by ' + locale + '(' + result.rows[i].user_id + ').');
        }
      }
    });

    clientDropbyke.query("SELECT bikes.name, rides.price_value, rides.comment_text, rides.user_id, users.device_language FROM rides INNER JOIN bikes ON rides.bike_id = bikes.id INNER JOIN users ON rides.user_id = users.id WHERE bikes.name LIKE 'BC%' AND rides.stop_time > " + pastmoment, function (err, result) {
      if (err) throw err;
      if (result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          let locale = result.rows[i].device_language[3] + result.rows[i].device_language[4];
          bot.sendMessage(activeID, 'Ride finished of ' + result.rows[i].name + ' by ' + locale + '(' + result.rows[i].user_id + '). Paid - € ' + result.rows[i].price_value/100 + '. Commented: ' + result.rows[i].comment_text + '.');
        }
      }
    });

    clientDropbyke.query("SELECT bikes.name, bike_reserves.user_id, users.device_language FROM bike_reserves INNER JOIN bikes ON bike_reserves.bike_id = bikes.id INNER JOIN users ON bike_reserves.user_id = users.id WHERE bikes.name LIKE 'BG%' AND bike_reserves.start_time > " + pastmoment, function (err, result) {
      if (err) throw err;
      if (result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          let locale = result.rows[i].device_language[3] + result.rows[i].device_language[4];
          bot.sendMessage(brugesID, 'Reserved ' + result.rows[i].name + ' by ' + locale + '(' + result.rows[i].user_id + ').');
        }
      }
    });

    clientDropbyke.query("SELECT bikes.name, bike_rides.user_id, users.device_language FROM bike_rides INNER JOIN bikes ON bike_rides.bike_id = bikes.id INNER JOIN users ON bike_rides.user_id = users.id WHERE bikes.name LIKE 'BG%' AND bike_rides.start_time > " + pastmoment, function (err, result) {
      if (err) throw err;
      if (result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          let locale = result.rows[i].device_language[3] + result.rows[i].device_language[4];
          bot.sendMessage(brugesID, 'Rented ' + result.rows[i].name + ' by ' + locale + '(' + result.rows[i].user_id + ').');
        }
      }
    });

    clientDropbyke.query("SELECT bikes.name, rides.price_value, rides.comment_text, rides.user_id, users.device_language FROM rides INNER JOIN bikes ON rides.bike_id = bikes.id INNER JOIN users ON rides.user_id = users.id WHERE bikes.name LIKE 'BG%' AND rides.stop_time > " + pastmoment, function (err, result) {
      if (err) throw err;
      if (result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          let locale = result.rows[i].device_language[3] + result.rows[i].device_language[4];
          bot.sendMessage(brugesID, 'Ride finished of ' + result.rows[i].name + ' by ' + locale + '(' + result.rows[i].user_id + '). Paid - € ' + result.rows[i].price_value/100 + '. Commented: ' + result.rows[i].comment_text + '.');
        }
      }
    });
};
