// 
import request from 'request'

import config from '../../dev-config.json'


const typeformURL = `https://api.typeform.com/v1/form/${config.typeformFormID}?key=${config.typeformAPI}&completed=true?field_id=49762089`

request(typeformURL, (error, response, body) => {
  if (error) throw error
  console.log(JSON.parse(body).responses); // Print the HTML for the Google homepage.
});
