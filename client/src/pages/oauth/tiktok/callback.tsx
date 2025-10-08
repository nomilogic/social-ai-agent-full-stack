import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { oauthManagerClient } from "../../lib/oauthManagerClient";

export default function TikTokCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (code && state) {
      oauthManagerClient.handleCallback("tiktok", code, state)
        .then((result) => {
          // Optionally update UI or state here
          navigate("/content"); // or wherever you want to go after success
        })
        .catch((err) => {
          // Handle error
          navigate("/error");
        });
    } else {
      navigate("/error");
    }
  }, [navigate]);

  return <div>Connecting TikTok...</div>;
}
