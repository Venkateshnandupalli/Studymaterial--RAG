import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const name = params.get("name");

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("userName", name || "User");
      // Redirect to dashboard on success
      navigate("/dashboard");
    } else {
      // Redirect to login on failure
      navigate("/login?error=OAuthFailed");
    }
  }, [location, navigate]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <span className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px', marginBottom: '20px' }}></span>
        <h2>Authenticating...</h2>
      </div>
    </div>
  );
}
