import { got } from 'got';

export async function getTwitchTokenData (FRONTEND, BACKEND_URL, BOT_NAME, STRAPI_API_KEY) {
  console.log(` >> attempting to get twitch token data`)
  const { data } = await got.get(
    encodeURI(`${BACKEND_URL}/api/bot-twitch-token?id=1`), 
    {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_KEY}`
      }
    }
  ).json()


  const { accessToken, refreshToken, expiresIn, obtainmentTimestamp } = data.attributes;

  return {
    accessToken,
    refreshToken,
    expiresIn,
    obtainmentTimestamp,
  }

}



export async function setTwitchTokenData (BACKEND_URL, STRAPI_API_KEY, userId, newTokenData) {
  console.log(newTokenData)
  console.log(`${BACKEND_URL}/api/bot-twitch-token`)
  console.log(` >> attempting to SET twitch token data`)
  const { accessToken, refreshToken, scope, expiresIn, obtainmentTimestamp } = newTokenData
  const { data } = await got.put(
    encodeURI(`${BACKEND_URL}/api/bot-twitch-token`),
    {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_KEY}`
      },
      json: {
        data: {
          accessToken,
          refreshToken,
        }
      }
    }
  ).json()
}