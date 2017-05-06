// @flow

import fs from 'fs'
import csvWriter from 'csv-write-stream'

const writer = csvWriter()

writer.pipe(fs.createWriteStream('../../logs.csv', { flags: 'a' }))

export const writeLogs = {
  yes: (number: String) => {
    writer.write({ from: number, answer: 'YES', timestamp: new Date() })
  },
  no: (number: String) => {
    writer.write({ from: number, answer: 'NO', timestamp: new Date() })
  }
}
