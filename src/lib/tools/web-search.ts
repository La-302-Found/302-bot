import { generateText, tool } from "ai";
import { z } from "zod";
import { getFeatureLogger } from "@/lib/logger";
import { ai } from "../ai";

const logger = getFeatureLogger(__filename);

export const searchWebTool = tool({
  description: "Search the web for information using Perplexity's Sonar model",
  parameters: z.object({
    query: z.string().describe("The search query, can be a question, a subject, or a topic")
  }),
  execute: async ({ query }) => {
    logger.info("Web search requested", { query });

    const { text } = await generateText({
      model: ai("perplexity/sonar"),
      prompt: query
    });

    logger.info("Web search completed", { query, text });

    return { text };
  }
});
