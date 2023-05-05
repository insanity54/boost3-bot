

import { got } from 'got';

export async function getBotUsers (appContext) {
  const data = await got.get(`${appContext.env.BACKEND_URL}/api/users?filters[isBotUser][$eq]=true`, {
    headers: {
      'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
    }
  }).json()
  const botUsers = data.map((d) => d.username)

  if (botUsers.length === 0) console.warn('There are no bot users in the db!')
  return botUsers
}

export async function getIsFirstTime (appContext, user) {
  const data = await got.get(`${appContext.env.BACKEND_URL}/api/users?filters[username][$eq]=${user}`, {
    headers: {
      'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
    }
  }).json()
  const isFirstTime = data[0].isFirstTime
  return isFirstTime
}

export async function setIsFirstTime (appContext, userId, state) {
  await got.put(`${appContext.env.BACKEND_URL}/api/users?id=${userId}`, {
    headers: {
      'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
    },
    json: {
      data: {
        isFirstTime: state
      }
    }
  }).json()
}


export async function getUser (appContext, ch) {
  const data = await got.get(`${appContext.env.BACKEND_URL}/api/users?filters[username][$eq]=${ch}`, {
    headers: {
      'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
    }
  }).json()
  return data[0]
}