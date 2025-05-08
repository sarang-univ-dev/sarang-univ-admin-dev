const prodConfig = {
  ENV: "production",
  API_HOST: "https://api.sarang-univ.com",
  GOOGLE_CLIENT_ID: "6gY7YyfcSJaH4QbxaHck",
};

const devConfig: typeof prodConfig = {
  ENV: "development",
  API_HOST: "https://dev.api.sarang-univ.com",
  GOOGLE_CLIENT_ID: "6gY7YyfcSJaH4QbxaHck",
};
const localConfig: typeof prodConfig = {
  ...devConfig,
  ENV: "local",
};

const config = (function () {
  switch (process.env.NEXT_PUBLIC_SARANG_ENV) {
    case "production":
      return prodConfig;
    case "development":
      return devConfig;
    default:
      return localConfig;
  }
})();

export default config;
