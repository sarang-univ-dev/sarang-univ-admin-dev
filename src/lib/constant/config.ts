const prodConfig = {
  ENV: "production",
  REDIRECT_URI: "https://ebook.nurse-edu.co.kr/login/redirect",
  API_HOST: "https://api.nurse-edu.co.kr",
  GOOGLE_CLIENT_ID: "6gY7YyfcSJaH4QbxaHck",
};

const devConfig: typeof prodConfig = {
  ENV: "development",
  REDIRECT_URI: "https://dev.ebook.nurse-edu.co.kr/login/redirect",
  API_HOST: "https://apiv2-dev.nurse-edu.co.kr",
  GOOGLE_CLIENT_ID: "6gY7YyfcSJaH4QbxaHck",
};
const localConfig: typeof prodConfig = {
  ...devConfig,
  ENV: "local",
  REDIRECT_URI: "https://local.ebook.nurse-edu.co.kr/login/redirect",
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
