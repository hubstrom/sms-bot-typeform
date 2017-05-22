// @flow

import fs from 'fs'
import csvWriter from 'csv-write-stream'
import csv from 'csv'

import { sendTwilio } from './twilio'
import texts from '../../public/smstemplates.json'
const writer = csvWriter()
const writerLeader = csvWriter()

export function checkMorningNo (number, weekday) {
  fs.createReadStream('./logs.csv')
    .pipe(csv.parse({delimiter: ','}, (err, data) => {
      let dataArr = []
      for (let i = 0; i < data.length; i += 1) {
        if (data[i][0] === number && data[i][1] === 'NO') {
          dataArr.push(data[i])
        }
      }
      const diff = (Math.floor(new Date()) - Math.floor(new Date(dataArr[dataArr.length-1][2]))) / 1000 / 60 / 60
      if (diff < 0.12) {
        sendTwilio(texts[weekday].planning_no_final, number)
        writeLogs.no(number)
      } else {
        sendTwilio(texts[weekday].planning_no, number)
        writeLogs.no(number)
      }
    }))
}

writer.pipe(fs.createWriteStream('logs.csv', { flags: 'a' }))
writerLeader.pipe(fs.createWriteStream('logsLeader.csv', { flags: 'a' }))

export const writeLogs = {
  yes: (number: String) => {
    writer.write({ from: number, answer: 'YES', timestamp: new Date() })
  },
  no: (number: String) => {
    writer.write({ from: number, answer: 'NO', timestamp: new Date() })
  },
}

export const writeLogsLeader = {
  yes: (number: String) => {
    writerLeader.write({ from: number, answer: 'YES', timestamp: new Date() })
  },
  no: (number: String) => {
    writerLeader.write({ from: number, answer: 'NO', timestamp: new Date() })
  },
}
