import { centsToDollars } from './money.js'
import { formatDuration } from './time.js'

export function registerAuctions (appContext, channels, chatClient) {
  return channels.reduce((result, ch) => {
    // @todo fetch startPrice, endPrice config from db.
    //       for now, we use defaults
    result[ch] = new DutchAuction(appContext, chatClient, ch, 1000, 0, 10000, 250);
    return result;
  }, {});
}




export class DutchAuction {
  constructor(appContext, chatClient, channel, startPrice = 1000, endPrice = 0, duration = 10000, tickDur = 250, startDelay = 2000) {
    if (typeof appContext === 'undefined') throw new Error('appContext is undef');
    if (typeof chatClient === 'undefined') throw new Error('chatClient is undef');
    if (typeof channel === 'undefined') throw new Error('channel');
    this.appContext = appContext;
    this.chatClient = chatClient;
    this.channel = channel;
    this.startPrice = startPrice;
    this.endPrice = endPrice;
    this.duration = duration;
    this.tickDur = tickDur;
    this.winner = null;
    this.offerId = null;
    this.endTime = null;
    this.timeLeft = null;
    this.startDelay = startDelay;
    this.runningPrice = null;
    this.lastTickTime = null;
    this.tickTimer = null;
    this.lastMessageTime = null;
  }

  reset(offerId) {
    this.winner = null;
    this.offerId = offerId;
    this.endTime = new Date().getTime()+this.duration+this.startDelay;
    this.timeLeft = this.duration+this.startDelay;
    this.runningPrice = this.startPrice;
    this.lastMessageTime = new Date().getTime();
  }

  start(offerId) {
    if (typeof offerId === 'undefined') throw new Error('required offerId passed to DutchAuction.start() was undefined');
    this.reset(offerId)
    this.chatClient.say(this.channel, `${formatDuration(this.duration)} Dutch auction starts at ${centsToDollars(this.startPrice)}`)
    setTimeout(() => this.tick(), this.startDelay)
    this.tickTimer = setInterval(() => this.tick(), this.tickDur)
  }

  addBidder(bidder) {

    //   * [x] if dutch auction is in progress                     (db)
    //     * [x] if offer owner is not set                         (db)
    //       * [x] make player the owner                           (db)
    //       * [x] put link to offer in chat                       (chatClient)
    //     * [x] else offer owner is set                           (db)
    //       * [x] @ the player, "The offer was already claimed"   (chatClient)
    //   * [x] else dutch auction is not in progress               (db)
    //     * [x] @ the player. "An auction is not in progress"     (chatClient)
    if (this.isRunning()) {
      if (!this.isWinner()) {
        clearInterval(this.tickTimer)
        this.winner = bidder
        this.chatClient.say(this.channel, `Congratulations @${bidder}! Checkout here-- ${this.appContext.env.FRONTEND_URL}?offer=${this.offerId}`)
      } else {
        // auction was already won by another bidder
        // @todo this might be too noisy to tell a player if they did not win
        this.chatClient.say(this.channel, `@${bidder}, the offer was already clamed!`)
      }
    } else {
      // auction not running
      this.chatClient.say(this.channel, `@${bidder}, an auction is not in progress!`)
    }
  }


  tick() {
    this.timeLeft = this.endTime - new Date().getTime();

    const currentTime = new Date().getTime()
    console.log(`timeLeft:${formatDuration(this.timeLeft)}, endTime:${this.endTime}`)

    // stop ticking if auction time is up
    if (this.timeLeft < 0) {
      clearInterval(this.tickTimer);
      this.conclude()
    }

    // send a price, time update in chat every 1s
    if (currentTime - this.lastMessageTime >= 1000) {
      this.chatClient.say(this.channel, `Auction price: ${centsToDollars(this.runningPrice)}. ${formatDuration(this.timeLeft)} remaining. Type !buy to bid.`)
      this.lastMessageTime = currentTime
    }

    // decrease the price over the duration of the auction
    this.runningPrice -= (this.startPrice - this.endPrice) / (this.duration / this.tickDur); // decrease price


  }

  conclude() {
    if (this.winner) {
      this.chatClient.say(this.channel, `Congratulations winner @${this.winner}! Checkout here-- ${this.appContext.env.FRONTEND_URL}/?offer=${this.offerId}`)
    } else {
      this.chatClient.say(this.channel, `Auction ended with no winner!`);
    }
  }

  isWinner() {
    if (this.winner === null) return false;
    else return true;
  }

  isRunning() {
    if (this.endTime === null) return false;
    const now = new Date().getTime()
    if (now > this.endTime) return false;
    else return true;
  }

}


// export async function dutchAuction (chatClient, channel, startPrice, endPrice = 0, duration = 10000, tick = 250) {

//   let runningPrice = startPrice
//   let buyers = []
//   let endTime = new Date().getTime()+duration
//   let lastMessageTime = 0

//   return new Promise((resolve, reject) => {
//     const intervalId = setInterval(() => {
//       const timeLeft = endTime - new Date().getTime();
//       if (timeLeft < 0) {
//         console.log('times up!')
//         clearInterval(intervalId);
//         resolve({ winner: null, price: endPrice });
//       }
      
//       const currentTime = new Date().getTime()
//       if (currentTime - lastMessageTime >= 1000) {
//         chatClient.say(channel, `Price: ${centsToDollars(runningPrice)}. Type !buy to bid.`)
//         lastMessageTime = currentTime
//       }
      
//       runningPrice -= (startPrice - endPrice) / (duration / tick); // decrease price
//     }, tick);
//   })
// }