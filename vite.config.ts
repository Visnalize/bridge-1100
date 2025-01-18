import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es5",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      fileName: (format) =>
        format === "es" ? "index.js" : `index.${format}.js`,
      name: "bridge",
    },
  },
});
