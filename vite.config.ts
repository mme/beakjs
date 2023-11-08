// vite.config.ts
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@beakjs/core": path.resolve(__dirname, "./src/core"),
    },
  },
  build: {
    lib: {
      entry: "src/index.ts",
      name: "BeakJS",
      fileName: (format) => `beakjs.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    cssCodeSplit: false,
  },
});
