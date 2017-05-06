// @flow

import Twilio from 'twilio'
import config from '../../dev-config.json'
import texts from '../../public/smstemplates.json'
import { writeLogs } from './database.js'

export const twilio = new Twilio(config.twilioSID, config.twilioToken)

function sendTwilio(text: String, number: String) {
  twilio.messages.create({
    from: '+37066802088',
    to: number,
    body: text
  }, (err, result) => {
    if (err) throw err
  })
}
function reminderSend(response, messageText, weekday) {
  const number = '+' + response.textfield_Hdyh.replace( /^\D+/g, '')
  let messageSendArr = messageText.split('::')
  let messageSend = ''
  switch(weekday) {
  case 1:
    if (response.textfield_yqjW === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_uyFy + messageSendArr[2] + response.textfield_CpTZ + messageSendArr[3] + response.textfield_D2hw + messageSendArr[4]
    }
    break
  case 2:
    if (response.textfield_p6YI === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_m5hF + messageSendArr[2] + response.textfield_pCb0 + messageSendArr[3] + response.textfield_tjlR + messageSendArr[4]
    }
    break
  case 3:
    if (response.textfield_gDIQ === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_v81z + messageSendArr[2] + response.textfield_nZH7 + messageSendArr[3] + response.textfield_A3sT + messageSendArr[4]
    }
    break
  case 4:
    if (response.textfield_vK1P === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_LaAs + messageSendArr[2] + response.textfield_Sckh + messageSendArr[3] + response.textfield_PvNM + messageSendArr[4]
    }
    break
  case 5:
    if (response.textfield_CKYk === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_shCV + messageSendArr[2] + response.textfield_K7II + messageSendArr[3] + response.textfield_pCNd + messageSendArr[4]
    }
    break
  case 6:
    if (response.textfield_GRVy === '1') {
      console.log('Stuff')
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_r3id + messageSendArr[2] + response.textfield_nm8c + messageSendArr[3] + response.textfield_AnrZ + messageSendArr[4]
    }
    break
  case 7:
    if (response.textfield_TuZL === '1') {
      messageSend = messageSendArr[0] + response.textfield_ju6P + messageSendArr[1] + response.textfield_vKty + messageSendArr[2] + response.textfield_pfij + messageSendArr[3] + response.textfield_DFMm + messageSendArr[4]
    }
    break
  }
  console.log("Here: " + messageSend)
  sendTwilio(messageSend, number)
}

export function reminderHandler (response, type, weekday) {
  switch(weekday) {
    case 1:
    switch(type) {
      case 'Morning':
      reminderSend(response, texts.monday.initial, weekday)
      break
      case 'Evening':
      reminderSend(response, texts.monday.completion_check, weekday)
      break
    }
    break
    case 2:
    switch(type) {
    case 'Morning':
      reminderSend(response, texts.tuesday.initial, weekday)
      break
    case 'Evening':
      reminderSend(response, texts.tuesday.completion_check, weekday)
      break
    }
    break
    case 3:
    switch(type) {
    case 'Morning':
      reminderSend(response, texts.wednesday.initial, weekday)
      break
    case 'Evening':
      reminderSend(response, texts.wednesday.completion_check, weekday)
      break
    }
    break
    case 4:
    switch(type) {
    case 'Morning':
      reminderSend(response, texts.thursday.initial, weekday)
      break
    case 'Evening':
      reminderSend(response, texts.thursday.completion_check, weekday)
      break
    }
    break
    case 5:
    switch(type) {
    case 'Morning':
      reminderSend(response, texts.friday.initial, weekday)
      break
    case 'Evening':
      reminderSend(response, texts.friday.completion_check, weekday)
      break
    }
    break
    case 6:
    switch(type) {
    case 'Morning':
      reminderSend(response, texts.saturday.initial, weekday)
      break
    case 'Evening':
      reminderSend(response, texts.saturday.completion_check, weekday)
      break
    }
    break
    case 7:
    switch(type) {
    case 'Morning':
      reminderSend(response, texts.sunday.initial, weekday)
      break
    case 'Evening':
      reminderSend(response, texts.sunday.completion_check, weekday)
      break
    }
    break
  }
}


export function twilioResponse(message: Object) {
  const response = message.Body.toLowerCase()
  switch(response) {
    case 'yes':
      writeLogs.yes(message.From)
    break
    case 'no':
      writeLogs.no(message.From)
    break
    default:
    twilio.messages.create({
      from: '+37066802088',
      to: message.From,
      body: 'Please respond with "Yes" or "No".'
    })
  }
}
