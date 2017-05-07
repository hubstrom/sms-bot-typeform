// @flow

import Twilio from 'twilio'
import moment from 'moment'

import config from '../../dev-config.json'
import texts from '../../public/smstemplates.json'
import { writeLogs, writeLogsLeader, checkMorningNo } from './database.js'

export const twilio = new Twilio(config.twilioSID, config.twilioToken)

export function sendTwilio(text: String, number: String) {
  twilio.messages.create({
    from: '+15625071988',
    to: number,
    body: text
  }, (err, result) => {
    if (err) throw err
  })
}

let dayTime = ''

export function dayTimeChange(text: String) {
  dayTime = text
}

function reminderSend(response, messageText, weekday) {
  const number = '+1' + response.textfield_Hdyh.replace( /^\D+/g, '')
  let messageSendArr = messageText.split('::')
  let messageSend = ''
  switch(weekday) {
  case 1:
    if (response.yesno_yqjW === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_uyFy + messageSendArr[2] + response.textfield_CpTZ + messageSendArr[3] + response.textfield_D2hw + messageSendArr[4]
    }
    break
  case 2:
    if (response.yesno_p6YI === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_m5hF + messageSendArr[2] + response.textfield_pCb0 + messageSendArr[3] + response.textfield_tjlR + messageSendArr[4]
    }
    break
  case 3:
    if (response.yesno_gDIQ === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_v81z + messageSendArr[2] + response.textfield_nZH7 + messageSendArr[3] + response.textfield_A3sT + messageSendArr[4]
    }
    break
  case 4:
    if (response.yesno_vK1P === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_LaAs + messageSendArr[2] + response.textfield_Sckh + messageSendArr[3] + response.textfield_PvNM + messageSendArr[4]
    }
    break
  case 5:
    if (response.yesno_CKYk === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_shCV + messageSendArr[2] + response.textfield_K7II + messageSendArr[3] + response.textfield_pCNd + messageSendArr[4]
    }
    break
  case 6:
    if (response.yesno_GRVy === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_r3id + messageSendArr[2] + response.textfield_nm8c + messageSendArr[3] + response.textfield_AnrZ + messageSendArr[4]
    }
    break
  case 0:
    if (response.yesno_TuZL === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_vKty + messageSendArr[2] + response.textfield_pfij + messageSendArr[3] + response.textfield_DFMm + messageSendArr[4]
    }
    break
  }
  sendTwilio(messageSend, number)
}

export function reminderHandler (response, type, weekday) {
  switch(weekday) {
  case 1:
    switch(type) {
    case 'Morning':
      reminderSend(response, texts[weekday].initial, weekday)
      break
    case 'Evening':
      reminderSend(response, texts[weekday].completion_check, weekday)
      break
    }
    break
  case 2:
    switch(type) {
      case 'Morning':
        reminderSend(response, texts[weekday].initial, weekday)
        break
      case 'Evening':
        reminderSend(response, texts[weekday].completion_check, weekday)
        break
    }
    break
  case 3:
    switch(type) {
      case 'Morning':
        reminderSend(response, texts[weekday].initial, weekday)
        break
      case 'Evening':
        reminderSend(response, texts[weekday].completion_check, weekday)
        break
    }
    break
  case 4:
    switch(type) {
      case 'Morning':
        reminderSend(response, texts[weekday].initial, weekday)
        break
      case 'Evening':
        reminderSend(response, texts[weekday].completion_check, weekday)
        break
    }
    break
  case 5:
    switch(type) {
      case 'Morning':
        reminderSend(response, texts[weekday].initial, weekday)
        break
      case 'Evening':
        reminderSend(response, texts[weekday].completion_check, weekday)
        break
    }
    break
  case 6:
    switch(type) {
      case 'Morning':
        reminderSend(response, texts[weekday].initial, weekday)
        break
      case 'Evening':
        reminderSend(response, texts[weekday].completion_check, weekday)
        break
    }
    break
  case 0:
    switch(type) {
      case 'Morning':
        reminderSend(response, texts[weekday].initial, weekday)
        break
      case 'Evening':
        reminderSend(response, texts[weekday].completion_check, weekday)
        break
    }
  }
}

const smsResponse = {
  morning: {
    yes: (number, weekday) => {
      sendTwilio(texts[weekday].planning_yes, number)
    },
    no: (number, weekday) => {
      checkMorningNo(number, weekday)
    },
  },
  evening: {
    yes: (number, weekday) => {
      sendTwilio(texts[weekday].response_yes, number)
    },
    no: (number, weekday) => {
      sendTwilio(texts[weekday].response_no, number)
    }
  }
}

export function twilioResponse(message: Object) {
  const response = message.Body.toLowerCase()
  const weekday =  moment.utc().weekday()
  switch(response) {
    case 'yes':
      writeLogs.yes(message.From)
      if(dayTime === 'pm') {
        smsResponse.evening.yes(message.From, weekday)
      } else {
        smsResponse.morning.yes(message.From, weekday)
      }
      break
    case 'no':
      if(dayTime === 'pm') {
        writeLogs.no(message.From)
        smsResponse.evening.no(message.From, weekday)
      } else {
        smsResponse.morning.no(message.From, weekday)
      }
      break
    default:
      twilio.messages.create({
        from: '+15625071988',
        to: message.From,
        body: 'Please respond with "Yes" or "No".',
      })
  }
  if (dayTime === 'pm') {
    switch (response) {
      case 'yes':
        writeLogsLeader.yes(message.From)
        break
      case 'no':
        writeLogsLeader.no(message.From)
        break
      default:
        break
    }
  }
}
