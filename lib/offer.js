
import { createSnapshot } from './snapshot.js'
import _ from 'lodash'
import { got } from 'got'


export async function createOffer (chatClient, appContext, auction, date, title) {
  if (date === undefined) throw new Error('date was missing');
  if (title === undefined) throw new Error('title was missing');
  if (appContext === undefined) throw new Error('appContext is missing');
  if (auction === undefined) throw new Error('auction is missing');

  console.log(appContext.env)

  const res = await got.post(
    encodeURI(`${appContext.env.BACKEND_URL}/api/offers`),
    {
      json: {
        "data": {
          "date": date,
          "title": title.join(' ')
        }
      },
      headers: {
        'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
      }
    }
  )
  .json()
  const id = res.data.id

  const startPrice = 1000
  const endPrice = 0
  auction.start(id)

  return id
}


export function registerOfferHandler (chatClient, appContext, auctions) {

  if (!chatClient) throw new Error('required chatClient not passed as arg');
  if (!appContext) throw new Error('required appContext not passed as arg');
  if (!auctions) throw new Error('required auctions not passed as arg');
  console.log(auctions)

  return function offerHandler(channel, user, text, msg) {

    const ch = channel.replace('#', '')
    console.log(`ch:${ch}`)
    console.log(`${msg.userInfo.userName} === ${channel} ???`)


    const usage = '!offer <title>'

    // react to !offer only from channel owner
    if (msg.userInfo.userName === ch && text.startsWith('!offer')) {

      const t = text.split(' ')
      const title = t.slice(1)


      if (_.isEmpty(title)) {
        chatClient.say(channel, `Missing title. Usage: ${usage}`)
        return
      }


      try {
        let offerId = createOffer(
          chatClient,
          appContext,
          auctions[ch],
          new Date(),
          title
        )

        createSnapshot(appContext, offerId, ch, new Date())

      } catch (e) {
        console.error(e)
        chatClient.say(channel, `Failed to create offer. ${e}`)
        // @todo error logging
      }
    }
  }
}

export function registerBuyHandler (chatClient, appContext, auctions) {

  if (!chatClient) throw new Error('required chatClient not passed as arg');
  if (!appContext) throw new Error('required appContext not passed as arg');
  if (!auctions) throw new Error('required auctions not passed as arg');

  return function bidHandler(channel, user, text, msg) {

    const ch = channel.replace('#', '')

    // do not react to the streamer
    if (msg.userInfo.userName !== ch) return;

    // only react to messages beginning with !buy'
    if (text.startsWith('!buy')) {

      const auction = auctions[ch]
      const bidder = msg.userInfo.userName

      auction.addBidder(bidder)


    }
  }

}




// const imageUrl = await takeSnapshot('bailiffofhaven')