#!/usr/bin/env node

import help from "./help";
import type { Env, ReadStream, WriteStream } from "./helpers";
import { makeLogger } from "./logger";
import run from "./run";

type Options = {
  cwd?: string;
  env?: Env;
  stdin?: ReadStream;
  stdout?: WriteStream;
  stderr?: WriteStream;
};

export default async function elmWatchCli(
  args: Array<string>,
  // istanbul ignore next
  {
    cwd = process.cwd(),
    env = process.env,
    // stdin = process.stdin,
    stdout = process.stdout,
    stderr = process.stderr,
  }: Options = {}
): Promise<number> {
  const logger = makeLogger({ env, stdout, stderr });

  const isHelp = args.some(
    (arg) => arg === "-h" || arg === "-help" || arg === "--help"
  );
  if (isHelp) {
    logger.log(help());
    return 0;
  }

  switch (args[0]) {
    case undefined:
    case "help":
      logger.log(help());
      return 0;

    case "make":
    case "watch":
    case "hot":
      return run(cwd, logger, args[0], args.slice(1));

    default:
      logger.error(`Unknown command: ${args[0]}`);
      return 1;
  }
}

// istanbul ignore if
if (require.main === module) {
  elmWatchCli(process.argv.slice(2)).then(
    (exitCode) => {
      process.exit(exitCode);
    },
    (error: Error) => {
      process.stderr.write(
        `Unexpected error:\n${error.stack ?? error.message}\n`
      );
      process.exit(1);
    }
  );
}
