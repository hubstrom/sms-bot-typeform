// @flow

import request from 'request'
import cron from 'cron'
import moment from 'moment'

import config from '../../dev-config.json'

import { reminderHandler, dayTimeChange } from './twilio'

const typeformURL = `https://api.typeform.com/v1/form/${config.typeformFormID}?key=${config.typeformAPI}&completed=true`

const CronJob = cron.CronJob

function typeformScan(type, weekday) {
  request(typeformURL, (error, response, body) => {
    if (error) throw error
    const responses = JSON.parse(body).responses
    for (let i = 0; i < responses.length; i += 1) {
      reminderHandler(responses[i].answers, type, weekday)
    }
  })
}

const morningJob = new CronJob({
  cronTime: '0 0 4 * * *',
  onTick: () => {
    const type = 'Morning'
    dayTimeChange('am')
    typeformScan(type, moment.utc().weekday())
  },
  start: false,
  timezone: 'EST',
})

const eveningJob = new CronJob({
  cronTime: '0 0  * * *',
  onTick: () => {
    const type = 'Evening'
    dayTimeChange('pm')
    typeformScan(type, moment.utc().weekday())
  },
  start: false,
  timezone: 'EST',
})

morningJob.start()
eveningJob.start()
