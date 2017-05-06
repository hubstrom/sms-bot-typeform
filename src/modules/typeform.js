// @flow

import request from 'request'
import cron from 'cron'
import moment from 'moment'

import config from '../../dev-config.json'
import texts from '../../public/smstemplates.json'

import { reminderHandler } from './twilio.js'

const typeformURL = `https://api.typeform.com/v1/form/${config.typeformFormID}?key=${config.typeformAPI}&completed=true`

const CronJob = cron.CronJob

function typeformScan (type, weekday) {
  request(typeformURL, (error, response, body) => {
    if (error) throw error
    const responses = JSON.parse(body).responses
    for (let i = 0; i < responses.length; i += 1) {
      reminderHandler(responses[i].answers, type, weekday)
    }
  })
}
// type: Morning, Evening
typeformScan('Morning', 6)

new CronJob('1 53 23 * * *', () => {
  typeformScan('Morning', moment.utc().weekday())
}, null, true, 'Europe/Vilnius')

new CronJob('1 55 23 * * *', () => {
  typeformScan('Evening', moment.utc().weekday())
}, null, true, 'Europe/Vilnius')
