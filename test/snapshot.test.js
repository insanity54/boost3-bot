import snapshot from '../lib/snapshot.js'
import fs from 'node:fs'

async function main () {
  const img = await snapshot('bailiffofhaven', new Date());
  fs.promises.writeFile('./img4.png', img)
}
main()