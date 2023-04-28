import { centsToDollars } from './money.js'
import { formatDuration } from './time.js'
import { createInvoice } from './invoice.js'
import { got } from 'got'

export function registerAuctions (appContext, channels, chatClient) {
  return channels.reduce((result, ch) => {
    // @todo fetch startPrice, endPrice config from db.
    //       for now, we use defaults
    result[ch] = new DutchAuction(appContext, chatClient, ch, 1000, 0, 10000, 250);
    return result;
  }, {});
}




export class DutchAuction {
  constructor(appContext, chatClient, channel, startPrice = 100000, endPrice = 0, duration = 10000, tickDur = 250, startDelay = 2000) {
    if (typeof appContext === 'undefined') throw new Error('appContext is undef');
    if (typeof chatClient === 'undefined') throw new Error('chatClient is undef');
    if (typeof channel === 'undefined') throw new Error('channel');
    this.appContext = appContext;
    this.chatClient = chatClient;
    this.channel = channel;
    this.ch = channel.replace('#', '')
    this.startPrice = startPrice;
    this.endPrice = endPrice;
    this.duration = duration;
    this.tickDur = tickDur;
    this.winnerName = null;
    this.winnerColor = null;
    this.winnerId = null;
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
    this.winnerName = null;
    this.winnerColor = null;
    this.winnerId = null;
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

  async addWinnerToOffer() {
    console.log(`  addWinnerToOffer winner:${this.winnerName}, color:${this.winnerColor}, offerId:${this.offerId}`)
    const { data } = got.put(`${this.appContext.env.BACKEND_URL}/api/offers/${this.offerId}`, {
      headers: {
        'Authorization': `Bearer ${this.appContext.env.STRAPI_API_KEY}`
      },
      json: {
        data: {
          winnerName: this.winnerName,
          winnerColor: this.winnerColor,
          winnerId: this.winnerId,
          priceCents: this.runningPrice,
        }
      }
    })
  }

  addBidder(winnerId, winnerName, winnerColor) {
    if (this.isRunning()) {
      if (!this.isWinner()) {
        clearInterval(this.tickTimer)
        this.winnerName = winnerName;
        this.winnerColor = winnerColor;
        this.winnerId = winnerId;
        this.finalize()
      } else {
        // auction was already won by another bidder
        // @todo this might be too noisy to tell a player if they did not win
        this.chatClient.say(this.channel, `@${winnerName}, the offer was already clamed!`)
      }
    } else {
      // auction not running
      this.chatClient.say(this.channel, `@${winnerName}, an auction is not in progress!`)
    }
  }


  tick() {
    this.timeLeft = this.endTime - new Date().getTime();

    const currentTime = new Date().getTime()
    console.log(`timeLeft:${formatDuration(this.timeLeft)}, endTime:${this.endTime}`)

    // stop ticking if auction time is up
    if (this.timeLeft < 0) {
      clearInterval(this.tickTimer);
      this.finalize()
    }

    // send a price, time update in chat every 1s
    if (currentTime - this.lastMessageTime >= 1000) {
      if (this.runningPrice > 0) {
        this.chatClient.say(this.channel, `Auction price: ${centsToDollars(this.runningPrice)}. ${formatDuration(this.timeLeft)} remaining. Type !buy to bid.`)
        this.lastMessageTime = currentTime
      }
    }

    // decrease the price over the duration of the auction
    this.runningPrice -= (this.startPrice - this.endPrice) / (this.duration / this.tickDur); // decrease price


  }

  finalize() {
    if (this.winnerName) {
      this.chatClient.say(this.channel, `Congratulations winner @${this.winnerName}! Checkout here-- ${this.appContext.env.FRONTEND_URL}/offer/${this.offerId}`)
      this.addWinnerToOffer()
    } else {
      this.chatClient.say(this.channel, `Auction ended with no winner!`);
    }
  }

  isWinner() {
    if (this.winnerName === null) return false;
    else return true;
  }

  isRunning() {
    if (this.endTime === null) return false;
    const now = new Date().getTime()
    if (now > this.endTime) return false;
    else return true;
  }

}

