#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { program } from "commander";
import type { AslDefinition, UserSpecifiedConfig } from "./lib/types";
import { asl_to_puml } from "./asl-puml";

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
  const dir = opts.output ? opts.output : path.parse(opts.input).dir;
  if (response.isValid) {
    fs.writeFileSync(
      path.join(dir, `${path.parse(opts.input).name}.puml`),
      Buffer.from(response.puml, "utf-8")
    );
    doneValid();
  } else {
    fail(response.message);
  }
} catch (e: unknown) {
  fail("asl-puml exception:");
}
