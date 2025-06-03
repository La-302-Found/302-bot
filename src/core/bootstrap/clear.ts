import client from "@/core/client";

client.application?.commands.set([]);
client.guilds.cache.forEach(async (guild) => {
  await guild.commands.set([]);
});
