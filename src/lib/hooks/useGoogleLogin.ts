import config from "../constant/config";

export function useGoogleLogin() {
  const redirectToGoogle = () => {
    const { GOOGLE_CLIENT_ID: clientId } = config;

<<<<<<< Updated upstream
    const redirectUri = `${window.location.origin}/login/redirect`;
=======
    const redirectUri = `${API_HOST}/api/v1/auth/google/callback`;
>>>>>>> Stashed changes
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

  return { redirectToGoogle };
}
