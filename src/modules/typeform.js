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
      if (responses[i].answers.textfield_ju6P !== 'Laurynas') {
        reminderHandler(responses[i].answers, type, weekday)
      }
    }
  })
}
typeformScan('Morning', 0)
const morningJob = new CronJob({
  cronTime: '30 58 18 * * *',
  onTick: () => {
    const type = 'Morning'
    dayTimeChange('am')
    typeformScan(type, moment.utc().weekday())
  },
  start: false,
  timezone: 'UTC',
})

const eveningJob = new CronJob({
  cronTime: '0 45 16 * * *',
  onTick: () => {
    const type = 'Evening'
    dayTimeChange('pm')
    typeformScan(type, moment.utc().weekday())
  },
  start: false,
  timezone: 'UTC',
})

morningJob.start()
eveningJob.start()
