import { got } from 'got';
import {FormData} from 'formdata-node';

let states = ['my-name-is-skrillex']

export async function registerApiConnectTwitch (appContext, server) {
  

  // start the temp HTTP server which can receive token data from twitch
  server.get('/api/connect/twitch/callback', async (request, reply) => {
    console.log(`  we got a request at /api/connect/twitch/callback`)
    console.log(request.query)

    if (!request.query.code) throw new Error('there was no code in the request from twitch');
    console.log(`we received authorization_code:${request.query.code} so lets exchange it for a token`)
    if (!request.query.state) throw new Error('there was no state in the request from twitch');
    if (!states.includes(request.query.state)) {
      reply.code(403)
      reply.send({ statusCode: 403, message: 'unrecognized state.' });
    }
    const res = await got.post(`https://id.twitch.tv/oauth2/token`, {
      form: {
        client_id: appContext.env.TWITCH_CLIENT_ID,
        client_secret: appContext.env.TWITCH_CLIENT_SECRET,
        code: request.query.code,
        grant_type: 'authorization_code',
        redirect_uri: `${appContext.env.BOT_URL}/api/connect/twitch/callback`
      }
    })
    if (!res.ok) {
      console.error(res.body)
      throw new Error('token request to twitch failed');
    }
    console.log(`request was good!`)
    const json = JSON.parse(res.body)
    console.log(json)


    console.log('we did not receive an authorization_code so lets see if we got a token')
    if (!json.access_token) throw new Error('there was no access_token in the query');
    if (!json.refresh_token) throw new Error('there was no refresh_token in the query');

    const { access_token, refresh_token } = json

    // save token to db
    console.log(`saving token to the db. access_token:${access_token}, refresh_token:${refresh_token}`)
    await setTwitchTokenData(appContext.env.BACKEND_URL, appContext.env.STRAPI_API_KEY, null, json)


  })
}

async function loadTokenFromDb (BACKEND_URL, STRAPI_API_KEY) {

  const { data } = await got.get(
    encodeURI(`${BACKEND_URL}/api/bot-twitch-token?id=1`), 
    {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_KEY}`
      }
    }
  ).json()
  console.log(data)
  const { accessToken, refreshToken, expiresIn, obtainmentTimestamp } = data.attributes;
  console.log(`  >> got twitch token ${accessToken}`)
  if (accessToken === null || refreshToken === null) throw new Error('refreshToken or accessToken were null');
  return {
    accessToken,
    refreshToken,
    expiresIn,
    obtainmentTimestamp,
  }
}

  // grant_type: 'client_credentials',
  // client_id: 'your_client_id',
  // client_secret: 'your_client_secret',
  // scope: 'chat:read chat:edit'

// async function getTokenFromTwitch (TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET) {
//   const form = new FormData();
//   form.set('client_id', TWITCH_CLIENT_ID);
//   form.set('client_secret', TWITCH_CLIENT_SECRET);
//   form.set('grant_type', 'client_credentials');
//   form.set('scope', 'chat:read+chat:edit');
//   form.set('force_verify', true)

//   const data = await got.post(
//     'https://id.twitch.tv/oauth2/token',
//     {
//       body: form
//     }
//   ).json()
//   console.log(data)
//   console.log(`>> got token from twitch`)
//   console.log(data)
//   return data
// }

export async function getTwitchTokenData (FRONTEND, BACKEND_URL, BOT_URL, BOT_NAME, STRAPI_API_KEY, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET) {
  console.log(`  >> attempting to get twitch token data from db. BOT_URL:${BOT_URL}, STRAPI_API_KEY:${STRAPI_API_KEY}`)
  let token
  try {
    token = await loadTokenFromDb(BACKEND_URL, STRAPI_API_KEY)
  } catch (e) {
    console.error(`error while getting twitch token from db`)
    console.error(e)
  }
  
  if (!token) {
    let state = (Math.random() + 1).toString(36).substring(7);
    states.length < 8 ? states.push(state) : (states.shift(), states.push(state));
    const redirectUri = encodeURIComponent(`${BOT_URL}/api/connect/twitch/callback`)
    const message = `Error while getting twitch accessToken from database.\nPlease auth with Twitch as the bot user to get a new token.\nLog in at https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${TWITCH_CLIENT_ID}&redirect_uri=${redirectUri}&scope=chat%3Aread+chat%3Aedit&force_verify=true&state=${states[states.length-1]}`
    console.error(message)
    console.info('trying again in 30 seconds...')
    await new Promise((resolve) => setTimeout(resolve, 30000))
    return getTwitchTokenData(FRONTEND, BACKEND_URL, BOT_URL, BOT_NAME, STRAPI_API_KEY, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET)
  }
  
  return token
}



export async function setTwitchTokenData (BACKEND_URL, STRAPI_API_KEY, userId, newTokenData) {
  console.log(newTokenData)
  console.log(`${BACKEND_URL}/api/bot-twitch-token`)
  console.log(`  >> attempting to SET twitch token data`)
  const { access_token, refresh_token, scope, expires_in } = newTokenData
  const res = await got.put(
    encodeURI(`${BACKEND_URL}/api/bot-twitch-token`),
    {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_KEY}`
      },
      json: {
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: expires_in,
          scope: scope.join(' ')
        }
      }
    }
  )
  if (!res.ok) {
    console.error('problem while saving token data')
    console.error(res.body)
  } else {
    console.log(`  >> SET complete!`)
  }
}