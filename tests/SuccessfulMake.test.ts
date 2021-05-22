import * as fs from "fs";
import * as path from "path";

import { elmWatchCli } from "../src";
import { Env } from "../src/Helpers";
import {
  clean,
  CursorWriteStream,
  FailReadStream,
  MemoryWriteStream,
  stringSnapshotSerializer,
} from "./Helpers";

const FIXTURES_DIR = path.join(__dirname, "fixtures");

async function run(
  fixture: string,
  args: Array<string>,
  env?: Env,
  { isTTY = true } = {}
): Promise<string> {
  const dir = path.join(FIXTURES_DIR, fixture);
  const build = path.join(dir, "build");

  if (fs.rmSync !== undefined) {
    fs.rmSync(build, { recursive: true, force: true });
  } else if (fs.existsSync(build)) {
    fs.rmdirSync(build, { recursive: true });
  }

  const stdout = new MemoryWriteStream();
  const stderr = new CursorWriteStream();

  stdout.isTTY = isTTY;
  stderr.isTTY = isTTY;

  const exitCode = await elmWatchCli(args, {
    cwd: dir,
    env,
    stdin: new FailReadStream(),
    stdout,
    stderr,
  });

  const stderrString = clean(stderr.getOutput());

  if (exitCode !== 0) {
    throw new Error(`exit ${exitCode}\n${stderrString}`);
  }

  expect(stdout.content).toBe("");

  return stderrString;
}

expect.addSnapshotSerializer(stringSnapshotSerializer);

describe("successful make", () => {
  test("standard mode", async () => {
    expect(await run("successful-make", ["make"])).toMatchInlineSnapshot(
      `✅ build/main.js`
    );
  });

  test("--debug", async () => {
    expect(
      await run("successful-make", ["make", "--debug"])
    ).toMatchInlineSnapshot(`✅ build/main.js`);
  });

  test("--optimize", async () => {
    expect(
      await run("successful-make", ["make", "--optimize"])
    ).toMatchInlineSnapshot(`✅ build/main.js`);
  });

  test("CI", async () => {
    expect(
      await run("successful-make", ["make"], process.env, { isTTY: false })
    ).toMatchInlineSnapshot(`
      ⏳ build/main.js: elm make
      ⏳ build/main.js: postprocess
      ✅ build/main.js
    `);
  });

  test("postprocess /dev/null", async () => {
    expect(await run("postprocess-dev-null", ["make"])).toMatchInlineSnapshot(
      `✅ /dev/null`
    );
  });
});
