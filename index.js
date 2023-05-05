
import * as dotenv from 'dotenv'
dotenv.config()


import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { registerOfferHandler, registerBuyHandler } from './lib/offer.js';
import { getTwitchTokenData, setTwitchTokenData, registerApiConnectTwitch } from './lib/tokens.js';
import { promises as fs } from 'fs';
import { registerAuctions } from './lib/auction.js'
import { registerServerHandler } from './lib/server.js'
import { getBotUsers, getUser } from './lib/user.js'
import _ from 'lodash';
import { got } from 'got';
import { v2 } from 'cloudinary';

const cloudinary = v2


const appEnv = new Array(
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'STRAPI_API_KEY',
  'CLOUDINARY_CLOUD',
  'CLOUDINARY_KEY',
  'CLOUDINARY_SECRET',
  'BACKEND_URL',
  'FRONTEND_URL',
  'BOT_NAME',
  'BOT_URL',
  'PORT',
)

const appContext = {
  env: appEnv.reduce((acc, ev) => {
    if (typeof process.env[ev] === 'undefined') throw new Error(`${ev} is undefined in env`);
    acc[ev] = process.env[ev];
    return acc;
  }, {})
};

if (process.env.NODE_ENV !== 'production') {
  console.log(`here is the appContext`)
  console.log(appContext)
}



const config = cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true
})

const backend = process.env.BACKEND_URL
const frontend = process.env.FRONTEND_URL







async function main() {

  const server = registerServerHandler(process.env.PORT)

  registerApiConnectTwitch(appContext, server)

  const channels = await getBotUsers(appContext)

  const tokenData = await getTwitchTokenData(
    process.env.FRONTEND_URL,
    process.env.BACKEND_URL,
    process.env.BOT_URL,
    process.env.BOT_NAME,
    process.env.STRAPI_API_KEY,
    process.env.TWITCH_CLIENT_ID,
    process.env.TWITCH_CLIENT_SECRET,
  )

  const authProvider = new RefreshingAuthProvider(
    {
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      onRefresh: async (userId, newTokenData) => {
        try {
          await setTwitchTokenData(
            process.env.BACKEND_URL,
            process.env.STRAPI_API_KEY,
            userId,
            newTokenData,
          )
        } catch (e) {
          console.error('error while refreshing twitch token')
          console.error(e)
          console.error(e.options.body)
          console.error(e.code)
        }
      }
    }
  );

  console.log(`main'd and we ahve some token data ${JSON.stringify(tokenData)}`)


  await authProvider.addUser(process.env.BOT_NAME, tokenData, ['chat']);


  const chatClient = new ChatClient({
    authProvider, 
    channels
  });


  const auctions = registerAuctions(appContext, channels, chatClient)

  const offerHandler = registerOfferHandler(
    chatClient,
    appContext,
    auctions
  )

  const buyHandler = registerBuyHandler(
    chatClient,
    appContext,
    auctions
  )


  

  chatClient.onJoin(async (channel, user) => {
    const ch = channel.replace('#', '')
    const strapiUser = await getUser(appContext, ch)
    if (strapiUser.isFirstTime) {
      chatClient.say(channel, `Let's make some sales! Use '!offer <title>' to get started.`)
      await setIsFirstTime(appContext, strapiUser.id, false)
    }
  })

  chatClient.onMessage((channel, user, text, msg) => {
  
    // !offer command
    //   * [x] create offer in db     (db)
    //   * [x] start Dutch auction    (game)
    //   * [x] queue or take snapshot (snapshot)
    offerHandler(channel, user, text, msg)


    // !buy command
    buyHandler(channel, user, text, msg)
 
  })

  chatClient.connect()
}


main()