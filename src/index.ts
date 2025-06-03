import "dotenv/config";
import client from "@/core/client";

// Load bootstrap
import "@/core/bootstrap/clear";

// Load features
import "@/features/test";

// Start the client
client.login(process.env.TOKEN);
