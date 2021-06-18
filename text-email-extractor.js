#!/usr/bin/env node

import { Command } from 'commander'
import readline from 'readline'
import fs from 'fs'
import wildcard from 'node-wildcard'
import _ from 'lodash'

import parseBlacklistFile from './src/blacklist.js'

let blacklistedEmails = []
let emails = new Set()
let textInputStream

const program = new Command()
program.version('1.0.9').
  usage('[filename]|[stdin] [options]').
  option('-b, --blacklist <filename>', 'A list of e-mails to filter out')

program.parse(process.argv)

if (program.args.length > 1) {
  console.error('Too many arguments.')
  process.exit(1)
} else if (program.args.length === 1) {
  textInputStream = fs.createReadStream(program.args[0])
} else {
  textInputStream = process.stdin
}

if (program.opts().blacklist?.length > 0) {
  await handleBlacklistOption(program.opts().blacklist)
}

parseText()

async function handleBlacklistOption (filename) {
  try {
    const result = await parseBlacklistFile(filename)
    blacklistedEmails.push(...result)
  } catch (e) {
    if (e.message === 'file not found') {
      console.error(`blacklist file not found : ${filename}`)
      process.exit(10)
    }
  }
}

/**
 * Parse the text and extract emails
 */
function parseText () {
  const rl = readline.createInterface({ input: textInputStream })
  let foundEmails
  let matchingBlacklistedEntryFound = false
  rl.on('line', (line) => {
    foundEmails = line.toLowerCase().match(/[^&'><;:()[\] =/]+@[^&'><;:()[\] =/]+\.[^&'><;:()[\] =/]+/)
    if (!_.isArray(foundEmails)) {
      return
    }

    for (let email of foundEmails) {
      matchingBlacklistedEntryFound = false
      email = email.trim()
      email = _.trim(email, '"')
      for (let blacklistedEmail of blacklistedEmails) {
        if (wildcard(email, blacklistedEmail)) {
          matchingBlacklistedEntryFound = true
          break
        }
      }
      if (!matchingBlacklistedEntryFound) {
        emails.add(email)
      }
    }
  })

  rl.on('close', () => {
    processResults()
  })
}

/**
 * Process the resulting email list. Just print them for now.
 */
function processResults () {
  for (let email of emails) {
    console.log(email)
  }
}