import { Command } from 'commander'
import parseBlacklistFile from './blacklist.js'
import fs from 'fs'
import readline from 'node:readline'
import * as tty from 'tty'
import { minimatch } from 'minimatch'

let excludePatterns: string[] = []
let emails = new Set()
let textInputStream: fs.ReadStream | tty.ReadStream

const program = new Command()
program.version('1.2.0').usage('[filename]|[stdin] [options]').option('-b, --blacklist <filename>', 'A list of e-mails to filter out')

async function main () {
  program.parse(process.argv)

  if (program.args.length > 1) {
    console.error('Too many arguments.')
    process.exit(1)
  } else if (program.args.length === 1) {
    const filename = program.args[0]
    if (!fs.existsSync(filename)) {
      console.error(`File not found: ${filename}`)
      process.exit(1)
    }
    textInputStream = fs.createReadStream(filename)
  } else {
    textInputStream = process.stdin
  }

  if (program.opts().blacklist?.length > 0) {
    await handleBlacklistOption(program.opts().blacklist)
  }

  await parseText()
  for (let email of emails) console.log(email)
}

async function handleBlacklistOption (filename: string) {
  try {
    const result = await parseBlacklistFile(filename)
    excludePatterns.push(...result)
  } catch (e: any) {
    if (e.message === 'file not found') {
      console.error(`blacklist file not found : ${filename}`)
      process.exit(10)
    }
  }
}

/**
 * Parse the text and extract emails
 */
function parseText (): Promise<void> {
  return new Promise((resolve) => {
    let matchingExcludeEntryFound = false

    const rl = readline.createInterface({ input: textInputStream })
    rl.on('line', (line) => {
      const foundEmails = line.toLowerCase().match(/[^&'><;:()[\] =/]+@[^&'><;:()[\] =/]+\.[^&'><;:()[\] =/]+/)
      if (!foundEmails) return

      for (let email of foundEmails) {
        matchingExcludeEntryFound = false
        email = email.trim()
        email = email.replace('"', '')
        for (let excludePattern of excludePatterns) {
          if (minimatch(email, excludePattern)) {
            matchingExcludeEntryFound = true
            break
          }
        }
        if (!matchingExcludeEntryFound) emails.add(email)
      }
    })

    rl.on('close', () => {
      resolve()
    })
  })
}

main().then(() => {
  process.exit(0)
}).catch((e) => {
  console.error(e)
  process.exit(1)
})