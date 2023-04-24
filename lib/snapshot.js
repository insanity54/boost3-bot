/**
 * snapshot.js
 * 
 * takes a snapshot of the livestream
 */

import {Cloudinary} from "@cloudinary/url-gen";
import {Transformation} from "@cloudinary/url-gen";
import {execa} from 'execa';
import fs from 'node:fs';
import { got } from 'got';


export async function takeSnapshotFromChannel (channel, datetime) {
  const { stdout: url } = await execa('/usr/bin/yt-dlp', ['-g', `https://twitch.tv/${channel}`])
  const { stdout: img } = await execa(
    'ffmpeg', ['-i', url, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'mjpeg', '-'],
    { encoding: null }
  )
  return img
}


export async function uploadSnapshot (channel, datetime = new Date()) {
  const img = await snapshot(channel, datetime)

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

export async function addSnapshotToOffer(appContext, id, url) {
  const { data } = await got.put(`${appContext.env.BACKEND_URL}/api/offers/${id}`, {
    headers: {
      'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
    },
    json: {
      data: {
        image: url
      }
    }
  }).json()
}

export async function createSnapshot (appContext, id, channel, datetime) {
  try {
    const ss = await takeSnapshotFromChannel(channel, datetime)
    const url = await uploadSnapshot(cloudinary)
    await addSnapshotToOffer(appContext, id, url)
  } catch (e) {
    console.log(e.message)
    if (/not currently live/.test(e.message)) {
      console.log(`${channel} is not live so we can't take a snapshot`)
    }
  }
}
