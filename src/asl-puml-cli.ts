#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { Option, program } from "commander";
import type { AslDefinition, UserSpecifiedConfig } from "./lib/types";
import { asl_to_puml } from "./asl-puml";

function fail(message: string) {
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(2);
}

function processFile(
  input: string,
  output: string | undefined,
  config: UserSpecifiedConfig | null
): boolean {
  try {
    const definition: AslDefinition = JSON.parse(
      fs.readFileSync(input, "utf-8")
    ) as AslDefinition;
    const response = asl_to_puml(definition, config);
    if (!response.isValid) {
      // eslint-disable-next-line no-console
      console.error(`${input}: ${response.message}`);
      return false;
    }
    const dir = output ? output : path.parse(input).dir;
    fs.writeFileSync(
      path.join(dir, `${path.parse(input).name}.puml`),
      Buffer.from(response.puml, "utf-8")
    );
    return true;
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(`${input}: asl-puml exception`);
    return false;
  }
}

program
  .description("Amazon States Language to PUML")
  .addOption(
    new Option(
      "-i --input <input...>",
      "path to one or more input files"
    ).conflicts("pattern")
  )
  .addOption(
    new Option(
      "-p --pattern <pattern>",
      "glob pattern for matching input files"
    ).conflicts("input")
  )
  .option("-o --output <output>", "path to output")
  .option("-c --config <config>", "path to config file")
  .parse(process.argv);

const opts: {
  input?: string[];
  pattern?: string;
  output?: string;
  config?: string;
} = program.opts();

if (!opts.input && !opts.pattern) {
  fail("one of -i --input or -p --pattern is required");
}

const config: UserSpecifiedConfig | null = opts.config
  ? (JSON.parse(fs.readFileSync(opts.config, "utf-8")) as UserSpecifiedConfig)
  : null;

const inputs: string[] = opts.pattern
  ? fs.globSync(opts.pattern).sort()
  : (opts.input as string[]);

if (opts.pattern && inputs.length === 0) {
  fail(`no files matched pattern: ${opts.pattern}`);
}

const allValid = inputs.reduce<boolean>(
  (valid, input) => processFile(input, opts.output, config) && valid,
  true
);

process.exit(allValid ? 0 : 2);
