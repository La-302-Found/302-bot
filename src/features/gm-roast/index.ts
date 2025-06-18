import client from "@/core/client";
import { ai } from "@/lib/ai";
import { getFeatureLogger } from "@/lib/logger";
import { generateText } from "ai";

export const logger = getFeatureLogger(__filename);

const getPrompt = (
  messages: string[]
) => `Tu es un bot qui se moque des utilisateurs. Tu dois te moquer de l'utilisateur qui a dit "gm" parce qu'il n'a pas de vie.

Contexte : Nous sommes sur un serveur Discord où dire "gm" (good morning) est considéré comme un signe que tu n'as pas de vie. Les gens qui disent "gm" sont vus comme des personnes pathétiques qui n'ont rien d'autre à faire de leur journée.

Ton rôle est de te moquer de ces utilisateurs de manière sarcastique et cruelle. Tu peux être méchant, condescendant, et vraiment faire comprendre à l'utilisateur qu'il n'a pas de vie.

IMPORTANT : Tu dois répondre UNIQUEMENT avec le texte du message. Pas d'explication, pas de formatage, pas d'artefacts, juste le message de moquerie. Pas de "Voici ma réponse :" ou quoi que ce soit d'autre.

Sois créatif, méchant, et fais comprendre que dire "gm" c'est avoir une vie vraiment misérable.
Tu dois répondre en français.

Afin d'éviter les répetitions, voici l'historique des 50 derniers messages dans le channel :
${messages.reverse().join("\n")}`;

client.on("messageCreate", async (message) => {
  if (
    message.content.toLowerCase().startsWith("gm")
    // (message.reference?.messageId && message.mentions.users.has(client.user?.id || ""))
  ) {
    logger.info("Processing gm message", {
      userId: message.author.id,
      username: message.author.username,
      content: message.content
    });

    // Get the last 50 messages in the channel
    const messages = await message.channel.messages
      .fetch({ limit: 50 })
      .then((messages) => messages.map((m) => `${m.author.username} : ${m.content}`));

    logger.info("Messages", { messages });

    try {
      const { text } = await generateText({
        model: ai("google/gemini-2.5-flash-preview-05-20"),
        temperature: 0.85,
        frequencyPenalty: 1,
        messages: [
          {
            role: "system",
            content: getPrompt(messages)
          },
          {
            role: "user",
            content: message.cleanContent
          }
        ]
      });

      if (!text) {
        logger.warn("AI response was empty", { userId: message.author.id });
        return;
      }

      logger.info("Generated roast response", {
        userId: message.author.id,
        responseLength: text.length
      });

      message.reply(text);
    } catch (error) {
      logger.error("Error generating roast response", {
        userId: message.author.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
