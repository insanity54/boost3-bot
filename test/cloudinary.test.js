import * as dotenv from 'dotenv'
dotenv.config({ path: '../.env' })

import { v2 } from 'cloudinary';
import snapshot from '../lib/snapshot.js';
const cloudinary = v2

new Array(
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


async function main () {
  try {
    const img = await snapshot('bailiffofhaven', new Date());
    const result = await cloudinary.uploader.upload_stream({format: 'jpg'}, (err, result) => {
      console.log(`err:${err}, result:${JSON.stringify(result)}`)
    }).end(img);
  } catch (e) {
    console.error(e)
  }
}

main()