var express = require('express');
var router = express.Router();
var page_login = require('./login');

router.get('/documentation', function(req, res, next) {
  if(req.session.success = true) {
    res.render('documentation', {title: 'Documentation', success: req.session.success, errors: req.session.errors});
    req.session.errors = null;
    console.log(req.session.success);
  }
  else {
    res.redirect('/');
  }
});

module.exports = router;
