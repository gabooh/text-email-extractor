import fs from 'fs'
import readline from 'readline'

/**
 * Parse list of blacklisted email addresses if provided.
 * @param filename the filename of the blacklist file, must be UTF-8 encoded
 */
async function parseBlacklistFile (filename: string) {
  const lines = []

  if (!fs.existsSync(filename)) {
    throw new Error('file not found')
  }

  const fileStats = fs.lstatSync(filename)
  if (!fileStats.isFile()) {
    throw new Error('path is not a file')
  }

  const fileStream = fs.createReadStream(filename)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    lines.push(line.toLowerCase())
  }

  return lines
}

export default parseBlacklistFile