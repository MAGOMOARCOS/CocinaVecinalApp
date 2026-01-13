function autoprefixer() {
  return {
    postcssPlugin: "autoprefixer",
    Once() {
      // no-op stub to allow offline builds
    },
  };
}

autoprefixer.postcss = true;
module.exports = autoprefixer;
