const devOptions = {
  colors: true,
  version: true,
  timings: true,
  assets: true,
  errors: true,
  errorDetails: true,
  children: true,
  warnings: true,
  hash: false,
  chunks: false,
  modules: false,
  reasons: false,
  source: false,
  publicPath: false
};

const prodOptions = {
  colors: true,
  version: true,
  timings: true,
  assets: true,
  errors: true,
  errorDetails: true,
  hash: true,
  warnings: true,
  children: true,
  chunks: false,
  modules: false,
  reasons: false,
  source: false,
  publicPath: false
};

module.exports = {
  devOptions,
  prodOptions,
};
