const prodConfig = {
  ENV: "production",
  API_HOST: "https://api.sarang-univ.com",
  GOOGLE_CLIENT_ID:
    "562303431713-do7g1uutr5rvseehrtdudkds7c7d69nb.apps.googleusercontent.com",
};

const devConfig: typeof prodConfig = {
  ENV: "development",
  API_HOST: "https://dev.api.sarang-univ.com",
  GOOGLE_CLIENT_ID:
    "562303431713-91oltl838dbrd5datetoiagop80o1tep.apps.googleusercontent.com",
};
const localConfig: typeof prodConfig = {
  ...devConfig,
  ENV: "local",
  API_HOST: "http://localhost:4000", // 로컬 서버
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
