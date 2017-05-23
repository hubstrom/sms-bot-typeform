var express = require('express');
var router = express.Router();
var main = require('../web');
var page_tasks = require('./tasks');
var page_funnel = require('./funnel');
var page_documentation = require('./documentation');
var config = require('../config');
var pg = require('pg');
var pgClient_frank = new pg.Client(config.postgre_frank);
var session = require('express-session');
var sess;

router.get('/', function(req, res, next) {
  res.render('login', {title: 'Login', success: req.session.success, errors: req.session.errors});
  req.session.errors = null;
});

router.get('/tasks', page_tasks);
router.get('/funnel', page_funnel);
router.get('/documentation', page_documentation);

router.post('/submit', function(req, res, next) {
  // Check validity
  req.check('username', 'Username is wrong').equals('barcadmin')
  req.check('password', 'Password is invalid').equals('dropbyke');

  var errors = req.validationErrors();
  if (errors) {
    req.session.errors = errors;
    req.session.success = false;
  } else {
    req.session.success = true;

  }
  res.redirect('/');
 });

module.exports = router;
