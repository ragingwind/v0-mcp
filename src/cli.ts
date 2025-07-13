import { program } from "commander";
import { createComponent } from "./generate.js";

export async function runCreateComponent(options: {
  chatid: string;
  prompt: string;
}) {
  console.log("Creating component...", options);
  const res = await createComponent(options.chatid, options.prompt);
  console.log(res);
}

program
  .command("create_component")
  .option("--chatid <chatid>", "Chat ID")
  .option("--prompt <prompt>", "Prompt")
  .action(async (options) => {
    await runCreateComponent(options);
  });

program.parse();
