#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { program } from "commander";

import { asl_to_puml } from "../src/asl-puml";
import { AslDefinition, UserSpecifiedConfig } from "../src/lib/types";

function doneValid() {
  process.exit(0);
}

function fail(message: string) {
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(2);
}

program
  .description("Amazon States Language to PUML")
  .requiredOption("-i --input <input>", "path to input file")
  .option("-o --output <output>", "path to output")
  .option("-c --config <config>", "path to config file")
  .parse(process.argv);

try {
  const opts: {
    input: string;
    output?: string;
    config?: string;
  } = program.opts();
  const definition: AslDefinition = JSON.parse(
    fs.readFileSync(opts.input, "utf-8")
  ) as AslDefinition;
  const config: UserSpecifiedConfig | null = opts.config
    ? (JSON.parse(fs.readFileSync(opts.config, "utf-8")) as UserSpecifiedConfig)
    : null;
  const response = asl_to_puml(definition, config);
  if (response.isValid) {
    const dir = opts.output
      ? path.parse(opts.output).base
      : path.parse(opts.input).dir;
    fs.writeFileSync(
      path.join(dir, `${path.parse(opts.input).name}.puml`),
      Buffer.from(response.puml, "utf-8")
    );
    doneValid();
  } else {
    fail(response.message);
  }
} catch (e: unknown) {
  fail(`asl-puml exception: ${JSON.stringify(e)}`);
}
