import config from "../constant/config";

export const redirectToGoogle = () => {
  const { GOOGLE_CLIENT_ID: clientId } = config;

  const redirectUri = `${window.location.origin}/login/redirect`;
  const scope = "https://www.googleapis.com/auth/userinfo.email";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  window.location.href = googleAuthUrl;
};
