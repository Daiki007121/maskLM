import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const { error } = isSignUp
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);

    if (error) {
      setError(error);
    } else if (isSignUp) {
      setMessage("Check your email for a confirmation link.");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error);
  };

  return (
    <>
      <div className="wallpaper">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="blob b4" />
        <div className="blob b5" />
        <div className="grain" />
      </div>

      <div className="login-page">
        <div className="login-card liquid">
          <div className="login-header">
            <div className="brand-mark">M</div>
            <h1 className="login-title">MaskLM</h1>
            <p className="login-subtitle">Privacy proxy for LLMs</p>
          </div>

          {error && <div className="login-error">{error}</div>}
          {message && <div className="login-message">{message}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="login-field">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <div className="login-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="btn login-google"
            onClick={handleGoogle}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="login-toggle">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
