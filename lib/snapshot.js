/**
 * snapshot.js
 * 
 * takes a snapshot of the livestream
 */

import {Cloudinary} from "@cloudinary/url-gen";
import {Transformation} from "@cloudinary/url-gen";
import {execa} from 'execa';
import fs from 'node:fs';


export default async function snapshot (channel, datetime) {
  const { stdout: url } = await execa('/usr/bin/yt-dlp', ['-g', `https://twitch.tv/${channel}`])
  const { stdout: img } = await execa(
    'ffmpeg', ['-i', url, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'mjpeg', '-'],
    { encoding: null }
  )
  return img
}

