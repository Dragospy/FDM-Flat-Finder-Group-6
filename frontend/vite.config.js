import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ACCOUNTS_JSON_PATH = fileURLToPath(new URL("./src/data/accounts.json", import.meta.url));

function writeAccountsJsonPlugin() {
  return {
    name: "write-accounts-json-plugin",
    configureServer(server) {
      server.middlewares.use("/__dev/write-accounts-json", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", async () => {
          try {
            const payload = JSON.parse(body || "{}");
            if (!Array.isArray(payload.accounts)) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "accounts must be an array" }));
              return;
            }

            await writeFile(
              ACCOUNTS_JSON_PATH,
              `${JSON.stringify(payload.accounts, null, 2)}\n`,
              "utf8"
            );

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Failed to write accounts.json" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), writeAccountsJsonPlugin()],
});
