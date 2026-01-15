import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const plugins = {
  "@tailwindcss/postcss": {},
};

try {
  require.resolve("autoprefixer");
  plugins.autoprefixer = {};
} catch {
  // optional in offline environments
}

const config = {
  plugins,
};

export default config;
