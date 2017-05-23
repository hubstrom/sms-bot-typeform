var express = require('express');
var router = express.Router();
var assert = require('assert');
var google = require('googleapis');
var page_login = require('./login');
var appa = express();

var config = require('../config');
var pg = require('pg');
var pgClient = new pg.Client(config.postgreMotivated);

  pgClient.connect(function(err, client) {
    if (err) throw err;

    console.log('Connected to Frank postgres! Getting schemas for tasks...');

    router.get('/tasks', function(req, res) {
            res.render('tasks');
        });

    router.get('/tasks/get-rides', function(req, res) {
      var allData = []
      pgClient.query('select username, sum(response_log.points) as total from users inner join response_log on users.phone_number = response_log.phone_number group by username order by total desc', function(err, result) {
        result.rows.forEach(function(doc,err) {
          allData.push({
            username: doc.username,
            total: doc.total
          })
        })
      res.send({bike_tasks: allData});
      });
    });
    });


function getDay(day, username) {
  pgClient.query("select users.username, sum(points) as day from response_log inner join users on users.phone_number = response_log.phone_number where timestamp > (SELECT current_date - cast(extract(dow from current_date) as int) + " + day + ") and timestamp < (SELECT current_date - cast(extract(dow from current_date) as int) + "+ day+1 + ") and username = '" + username + "' group by username", function(err, result) {
    return result.rows[0]
  })
}

module.exports = router;
