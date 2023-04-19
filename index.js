
import * as dotenv from 'dotenv'
dotenv.config()


import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { promises as fs } from 'fs';
import _ from 'lodash';
import { got } from 'got';
import snapshot from './lib/snapshot.js'
import { v2 } from 'cloudinary';
const cloudinary = v2

new Array(
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'STRAPI_API_KEY',
  'CLOUDINARY_CLOUD',
  'CLOUDINARY_KEY',
  'CLOUDINARY_SECRET',
).forEach((ev) => { 
  if (typeof process.env[ev] === 'undefined') throw new Error(`${ev} is undefined in env`) 
})



const config = cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true
})

const userName = 'cj_clippy'
const usage = '!offer <price> <title>'
const backend = 'https://boost3.sbtp.xyz'
const frontend = 'https://boost.sbtp.xyz'

const authProvider = new RefreshingAuthProvider(
  {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    onRefresh: async (userId, newTokenData) => await fs.writeFile(`./tokens/tokens.${userId}.json`, JSON.stringify(newTokenData, null, 4), 'UTF-8')
  }
);


// greets ChatGPT
function dollarsToCents(dollarValue) {
  // Remove any commas from the dollar value string
  dollarValue = dollarValue.replace('$', '').replace(',', '');
  // Multiply by 100 to get cents
  var centsValue = Math.round(parseFloat(dollarValue) * 100);
  return centsValue;
}


async function takeSnapshot (channel) {
  const img = await snapshot(channel, new Date())

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {format: 'jpg'}, 
      (err, result) => {
        if (err) reject(err)
        resolve(result.url)
      }
    ).end(img);
  });
}



async function createOffer (date, price, title) {
  if (date === undefined) throw new Error('date was missing');
  if (price === undefined) throw new Error('price was missing');
  if (title === undefined) throw new Error('title was missing');

  const imageUrl = await takeSnapshot('bailiffofhaven')

  const res = await got.post(
    encodeURI(`${backend}/api/offers`),
    {
      json: {
        "data": {
          "price_cents": dollarsToCents(price),
          "date": date,
          "title": title.join(' '),
          "image": imageUrl
        }
      },
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_KEY}`
      }
    }
  )
  .json()
  const id = res.data.id
  const url = `${frontend}/?offer=${id}`




  return url
}


const tokenData = JSON.parse(await fs.readFile('./tokens/tokens.675480505.json', 'UTF-8'));


await authProvider.addUserForToken(tokenData, ['chat']);




const chatClient = new ChatClient({
  authProvider, 
  channels: ['cj_clippy']
});

async function main() {
  await chatClient.connect()
  console.log(`  connected!`)

  chatClient.onMessage((channel, user, text, msg) => {
    


    console.log(`name:${msg.userInfo.userName}, color:${msg.userInfo.color}`)

    if (msg.userInfo.userName === userName && text.startsWith('!offer')) {
      // createOffer(msg.userInfo.userName{username: msg.userInfo.userName, color: msg.userInfo.color, date: new Date()})

      const t = text.split(' ')
      const price = t[1]
      const title = t.slice(2)

      if (_.isEmpty(price)) {
        chatClient.say(channel, `Missing price. ${usage}`)
        return
      }

      if (_.isEmpty(title)) {
        chatClient.say(channel, `Missing title. ${usage}`)
        return
      }

      createOffer(new Date(), price, title).then((url) => {
        chatClient.say(channel, `New Offer! ${url} ${title.join(' ')}`)
      }).catch((e) => {
        console.error(e)
        chatClient.say(channel, `failed to create offer. ${e}`)
        // @todo error logging
      })


    }

  })
}


main()