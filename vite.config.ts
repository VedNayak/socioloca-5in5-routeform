import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile } from "node:fs";
import { resolve } from "node:path";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "prerendered-route-preview",
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url || "/", "http://localhost");
          const path = url.pathname.replace(/\/+$/, "") || "/";
          if (["/services", "/industries", "/about", "/quote"].includes(path))
            req.url = `${path}/index.html${url.search}`;
          else if (path !== "/" && !path.includes(".")) {
            readFile(
              resolve(
                server.config.root,
                server.config.build.outDir,
                "404.html",
              ),
              "utf8",
              (error, html) => {
                if (error) return next(error);
                res.writeHead(404, {
                  "Content-Type": "text/html; charset=utf-8",
                });
                res.end(html);
              },
            );
            return;
          }
          next();
        });
      },
    },
  ],
  ssr: { noExternal: ["react-router", "react-router-dom"] },
  build: { target: "es2022" },
});
