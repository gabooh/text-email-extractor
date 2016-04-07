#!/usr/bin/env node

'use strict';

const program = require('commander');
const readline = require('readline');
const fs = require('fs');
const emailParser = require("email-addresses");
const wildcard = require('node-wildcard');
const _ = require('lodash');

var blacklistedEmails = [];
var emails = new Set();

program
    .version('1.0.0')
    .usage('[filename]|[stdin] [options]')
    .option('-b, --blacklist <filename>', 'A list of email to filter out', parseBlacklistFile)
    .parse(process.argv);

var textInputStream;
if (program.args.length > 1) {
    console.log("Too many arguments.");
    process.exit(1);
} else if (program.args.length == 1) {
    textInputStream = fs.createReadStream(program.args[0]);
} else {
    textInputStream = process.stdin;
}

if (program.blacklist !== true) {
    parseText();
}

/**
 * Parse list of blacklisted email adresses if provided.
 * @param filename the filename of the blacklist file
 */
function parseBlacklistFile(filename) {
    let readStream = fs.createReadStream(filename);
    readStream.on('error', (error) => {
        if (error.code === 'ENOENT') {
            console.error(`Error, file not found : ${filename}`);
            process.exit(-2);
        }
        console.log(error);
    });

    const rl = readline.createInterface({input: readStream});

    rl.on('line', (line) => {
        blacklistedEmails.push(line);
    });

    rl.on('close', ()=> {
        parseText();
    });
}

/**
 * Parse the text and extract emails
 */
function parseText() {
    const rl = readline.createInterface({input: textInputStream});

    let matchingBlacklistedEntryFound = false;
    rl.on('line', (line) => {
        let results = emailParser.parseAddressList(line);
        if (!_.isArray(results)) {
            return;
        }

        for (let result of results) {
            matchingBlacklistedEntryFound = false;
            for (let blacklistedEmail of blacklistedEmails) {
                if (wildcard(result.address, blacklistedEmail)) {
                    matchingBlacklistedEntryFound = true;
                    break;
                }
            }
            if (!matchingBlacklistedEntryFound) {
                emails.add(result.address);
            }
        }
    });

    rl.on('close', ()=> {
        processResults();
    })
}

/**
 * Process the resulting email list. Just print them for now.
 */
function processResults() {
    for (let email of emails) {
        console.log(email);
    }
}

