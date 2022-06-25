#!/usr/bin/env node
/* eslint-disable no-console, strict, prefer-destructuring */

'use strict';

const fs = require('fs');
const path = require("path");
const {program} = require('commander');

const version = require('../package.json').version;
const asl_puml = require('../src/asl-puml');

function doneValid() {
    process.exit(0);
}

function fail(message) {
    console.error(message);
    process.exit(2);
}

program
    .version(version, '-v, --version')
    .description('Amazon States Language to PUML')
    .requiredOption('-i --input <input>', 'path to input')
    .option('-o --output <output>', 'path to output')
    .parse(process.argv);

try {
    const opts = program.opts();
    const definition = JSON.parse(fs.readFileSync(opts.input));
    const {isValid, puml, message} = asl_puml(definition);
    if (isValid) {
        const dir = opts.output ? path.parse(opts.output).base : path.parse(opts.input).dir;
        fs.writeFileSync(path.join(dir, `${path.parse(opts.input).name}.puml`), Buffer.from(puml, "utf-8"))
        doneValid();
    } else {
        fail(message);
    }
} catch (e) {
    fail(`asl-puml exception: ${e}`);
}
