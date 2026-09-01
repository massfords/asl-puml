import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { afterAll, beforeAll, describe, expect } from "@jest/globals";

// exercises the built CLI (dist/asl-puml-cli.js). `npm test` runs the build
// first, so the compiled entry point is present when these tests execute.
describe("cli", () => {
  const cli = path.join(__dirname, "..", "..", "dist", "asl-puml-cli.js");
  const definitions = path.join(__dirname, "definitions");
  let outDir: string;

  const run = (
    args: string[]
  ): { status: number; stdout: string; stderr: string } => {
    try {
      const stdout = execFileSync("node", [cli, ...args], {
        encoding: "utf-8",
      });
      return { status: 0, stdout, stderr: "" };
    } catch (e) {
      const err = e as { status: number; stdout: string; stderr: string };
      return { status: err.status, stdout: err.stdout, stderr: err.stderr };
    }
  };

  beforeAll(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), "asl-puml-cli-"));
  });

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  test("processes a single file via -i", () => {
    expect.hasAssertions();
    const { status } = run([
      "-i",
      path.join(definitions, "demo.asl.json"),
      "-o",
      outDir,
    ]);
    expect(status).toBe(0);
    expect(fs.existsSync(path.join(outDir, "demo.asl.puml"))).toBe(true);
  });

  test("processes multiple files via variadic -i", () => {
    expect.hasAssertions();
    const { status } = run([
      "-i",
      path.join(definitions, "demo.asl.json"),
      path.join(definitions, "parallel.asl.json"),
      "-o",
      outDir,
    ]);
    expect(status).toBe(0);
    expect(fs.existsSync(path.join(outDir, "demo.asl.puml"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "parallel.asl.puml"))).toBe(true);
  });

  test("processes every file matching -p", () => {
    expect.hasAssertions();
    const expectedCount = fs
      .readdirSync(definitions)
      .filter((f) => f.endsWith(".asl.json")).length;
    const { status } = run([
      "-p",
      path.join(definitions, "*.asl.json"),
      "-o",
      outDir,
    ]);
    expect(status).toBe(0);
    const generated = fs
      .readdirSync(outDir)
      .filter((f) => f.endsWith(".asl.puml"));
    expect(generated).toHaveLength(expectedCount);
  });

  test("-i and -p are mutually exclusive", () => {
    expect.hasAssertions();
    const { status, stderr } = run(["-i", "a.json", "-p", "*.json"]);
    expect(status).toBe(1);
    expect(stderr).toContain("cannot be used with");
  });

  test("requires one of -i or -p", () => {
    expect.hasAssertions();
    const { status, stderr } = run([]);
    expect(status).toBe(2);
    expect(stderr).toContain("required");
  });

  test("fails when a pattern matches nothing", () => {
    expect.hasAssertions();
    const { status, stderr } = run(["-p", "does-not-exist/**/*.asl.json"]);
    expect(status).toBe(2);
    expect(stderr).toContain("no files matched");
  });
});
