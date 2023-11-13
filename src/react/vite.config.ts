// vite.config.ts
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [cssInjectedByJsPlugin(), dts()],
  build: {
    lib: {
      entry: "index.ts",
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
  },
});
