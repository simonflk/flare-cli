import type { AlertCliCommand } from "./types.js";

export function parseArgv(argv: string[]): AlertCliCommand {
  const [message] = argv;

  return {
    kind: "direct",
    level: "plain",
    style: "box",
    message,
    noColor: false,
    bell: false,
  };
}

export function validateCommand(command: AlertCliCommand): AlertCliCommand & { message: string } {
  if (!command.message || command.message.length === 0) {
    throw new Error("A message is required.");
  }

  return command as AlertCliCommand & { message: string };
}
