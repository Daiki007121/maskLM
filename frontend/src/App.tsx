import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import MaskPage from "./pages/MaskPage";
import LoginPage from "./pages/LoginPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
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
        <div className="loading-page">
          <div className="loading-spinner" />
        </div>
      </>
    );
  }

  return session ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
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
        <div className="loading-page">
          <div className="loading-spinner" />
        </div>
      </>
    );
  }

  return session ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MaskPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
