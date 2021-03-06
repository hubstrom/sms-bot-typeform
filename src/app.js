// @flow
// Server wrapper

import express from 'express'
import bodyParser from 'body-parser'

import { onResponse } from '../badExamples/simpleTwilioSend.js'

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))

app.post('/twilio-webhook', (req, res) => {
  onResponse(req.body.Body, req.body.From)
})

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found')
  next(err)
})

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app

