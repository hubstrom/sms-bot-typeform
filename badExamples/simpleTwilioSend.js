import Twilio from 'twilio'
import pg from 'pg'
import cron from 'cron'
import moment from 'moment'

import config from '../dev-config.json'

export const twilio = new Twilio(config.twilioSID, config.twilioToken)
const CronJob = cron.CronJob

const pool = new pg.Pool(config.postgreConnect);
pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack);
});

function sendTwilio(text: String, number: String) {
  twilio.messages.create({
    from: '+15625071988',
    to: number,
    body: text
  }, (err, result) => {
    if (err) throw err
  })
}

//sendTwilio("Good morning", '+37064445377')

function mondayText (username, activity, time, location) {
  return `Buenos Dias ${username}, It is Tuesday. Otherwise known as the Day After Monday.
Ready to ${activity} at ${time} at ${location} today?
Please respond Yes or No.`
}

function mondayEveningText (username, activity, time, location) {
  return `Tuesday is not what it used to be, am I right? 
Did you ${activity} at ${time} at ${location} today?
Please respond Yes or No.`
}

function responseYes (phone_number) {
  const text = 'Great! See you on the other side... Click for Leaderboard: https://goo.gl/VIddRT'
  sendTwilio(text, phone_number)
  updateLeaderboard(phone_number, 'Yes')
}

function responseNo (phone_number) {
  const text = 'No problem. Do you still intend to do it today at a different time or location? Please Respond Yes or No.'
  sendTwilio(text, phone_number)
  updateLeaderboard(phone_number, 'No')
}

function responseNoFinal (phone_number) {
  const text = 'Ok! See if you can get back on track tomorrow.Click for tips: https://goo.gl/VIddRT'
  sendTwilio(text, phone_number)
  updateLeaderboard(phone_number, 'No Final')
}

const timeTest = new Date()
const hours = timeTest.getHours()


function getNeededUsers (timeEST, timePST) {
  pool.query(`select username, first_name, last_name, timezone, phone_number, tuesday_activity, tuesday_time, tuesday_place from user_activities inner join users on user_activities.user_id = users.id where tuesday_time ilike '${timeEST}' and timezone = 'EST' or tuesday_time ilike '${timePST}' and timezone = 'PST'`, (err, res) => {
  if(err) {
    return console.error('error running query', err)
  }
    for (let i = 0; i < res.rows.length; i += 1) {
      const texts = mondayText(res.rows[i].username, res.rows[i].tuesday_activity, res.rows[i].tuesday_time, res.rows[i].tuesday_place)
      const phone = '+1' + res.rows[i].phone_number
      sendTwilio(texts, phone)
      console.log(res.rows[i].username + ' ' + res.rows[i].tuesday_time)
    }
})
}

function updateLeaderboard (phone, response) {
  pool.query(`insert into response_log (phone_number, response) values ('${phone}', '${response}')`, (err) => {
    if(err) {
      return console.error('error running query', err)
    }
    }
 )
}

const tempNumber = '3105926011'
// responseYes(tempNumber)
// responseNo(tempNumber)
// responseNoFinal(tempNumber)

function getFromEst (hour) {
  let timeEST = 0
  let timePST = 0
  if (hour > 12) {
    timeEST = (hour - 12) + '%%pm'
    if(hour > 15) {
      timePST = (hour - 15) + '%%pm'
    } else if ( hour === 15) {
      timePST = '12%%pm'
    } else {
      timePST = (hour - 3) + '%%am'
    }
  } else if (hour === 12) {
    timeEST = '12%%pm'
    timePST ='9%%am'
  } else {
    timeEST = hour + '%%am'
    if (hour < 3) {
      timePST = (hour - 3 + 12) + '%%pm'
    } else {
      timePST = (hour-3) + '%%am'
    }
  }
  getNeededUsers(timeEST, timePST)
  console.log(`EST: ${timeEST}, PST: ${timePST}`)
}

function getFromEstEvening (hour) {
  let timeEST = 0
  let timePST = 0
  if (hour > 12) {
    timeEST = (hour - 12) + '%%pm'
    if(hour > 15) {
      timePST = (hour - 15) + '%%pm'
    } else if ( hour === 15) {
      timePST = '12%%pm'
    } else {
      timePST = (hour - 3) + '%%am'
    }
  } else if (hour === 12) {
    timeEST = '12%%pm'
    timePST ='9%%am'
  } else {
    timeEST = hour + '%%am'
    if (hour < 3) {
      timePST = (hour - 3 + 12) + '%%pm'
    } else {
      timePST = (hour-3) + '%%am'
    }
  }
  askEveningQuestion(timeEST, timePST)
  console.log(`EST: ${timeEST}, PST: ${timePST}`)
}


const morningJob = new CronJob({
  cronTime: '0 0 * * * *',
  onTick: () => {
    getFromEst(moment.utc().format('H')-3)
    getFromEstEvening(moment.utc().format('H')-8)
  },
  start: false,
  timezone: 'EST',
})
morningJob.start()
// getFromEst(7)
// getNeededUsers('6:00am', '3:00am')

function askEveningQuestion (timeEST, timePST) {
  pool.query(`select username, first_name, last_name, timezone, phone_number, tuesday_activity, tuesday_time, tuesday_place from user_activities inner join users on user_activities.user_id = users.id where tuesday_time ilike '${timeEST}' and timezone = 'EST' or tuesday_time ilike '${timePST}' and timezone = 'PST'`, (err, res) => {
    if(err) {
      return console.error('error running query', err)
    }
    for (let i = 0; i < res.rows.length; i += 1) {
      const texts = mondayEveningText(res.rows[i].username, res.rows[i].tuesday_activity, res.rows[i].tuesday_time, res.rows[i].tuesday_place)
      const phone = '+1' + res.rows[i].phone_number
      sendTwilio(texts, phone)
      console.log(res.rows[i].username + ' ' + res.rows[i].tuesday_time)
    }
  })
}

const textYes = {
  morning: 'Super, have fun! Click for Leaderboard: https://goo.gl/VIddRT',
  evening: 'Nicely done today. I hope you’re starting to enjoy these victories. See how you’re doing compared to others: https://goo.gl/VIddRT'
}

const textNo = {
  morning: 'No problem. Do you still intend to do it today at a different time or location? Please Respond Yes or No.',
  morningFinal: 'Alright, I will be in touch tomorrow, have a great day! Click for tips: https://goo.gl/VIddRT',
  evening: 'You still get points for checking in! See if you can catch up tomorrow. Need helpful tips? Click here: https://goo.gl/PDQxxZ Leaderboard:  https://goo.gl/VIddRT'
}

function checkIfWasNo (number) {
  pool.query(`select timestamp from response_log where phone_number = ${number} and response = 'No' order by timestamp desc limit 1`, (err, res) => {
    if (err) {
      return console.error('error running query', err)
    }
    if (res.rows.length > 0) {
      if (Math.floor(res.rows[0].timestamp) > Math.floor(moment().startOf('day'))) {
        sendTwilio(textNo.morningFinal, number)
      } else {
        sendTwilio(textNo.morning, number)
      }
    } else {
      sendTwilio(textNo.morning, number)
    }
  })
}


function checkIfAfterActivity (number, booleanCase) {
  pool.query(`select tuesday_time, phone_number, timezone from user_activities inner join users on user_activities.user_id = users.id`, (err, res) => {
    if (err) {
      return console.error('error running query', err)
    }
    for (let i = 1; i < res.rows.length; i += 1) {
      const checkingNumber = '+1' + res.rows[i].phone_number
      if (checkingNumber === number) {
        const timeSplit = parseInt(res.rows[i].tuesday_time.split('::'), 10)
        let currentHour = 0
        if (res.rows[i].timezone === 'PST') {
          currentHour = moment.utc().format('H') - 7
        } else {
          currentHour = moment.utc().format('H') - 4
        }

        if (timeSplit < currentHour) {
          if (booleanCase === 'yes') {
            sendTwilio(textYes.evening, number.split('+1')[1])
          } else {
            sendTwilio(textNo.evening, number.split('+1')[1])
          }
        } else {
          if (booleanCase === 'yes') {
            sendTwilio(textYes.morning, number.split('+1')[1])
          } else {
            checkIfWasNo(number.split('+1')[1])
          }
        }
      }
    }
  })
}

export function onResponse(text, number) {
  if (text.toLowerCase().indexOf('yes') >= 0) {
    checkIfAfterActivity(number, 'yes')
    updateLeaderboard(number.split('+1')[1], 'Yes')
  } else if (text.toLowerCase().indexOf('no' >= 0)) {
    checkIfAfterActivity(number, 'no')
    updateLeaderboard(number.split('+1')[1], 'No')
  }
}

const needAnswer = [
]


function responseYesEvening (phone_number) {
  sendTwilio(textYes.evening, phone_number)
  updateLeaderboard(phone_number, 'Yes')
}

function responseNoEvening (phone_number) {
  sendTwilio(textNo.evening, phone_number)
  updateLeaderboard(phone_number, 'Yes')
}

