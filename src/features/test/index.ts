import client from "@/core/client";

client.on("messageCreate", (message) => {
  if (message.content === "say something") {
    message.reply("Hello, world!");
  }
});
