import client from "@/core/client";

client.on("messageCreate", (message) => {
  if (message.content === "say something else") {
    message.reply("Hello, world!");
  }
});
