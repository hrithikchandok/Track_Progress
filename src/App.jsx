import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import PublicPage from './pages/PublicPage';

function AuthGate({ session, loading, signIn, signUp, signOut }) {
  if (loading) return <div className="wrap" style={{ paddingTop: 80 }}><p className="sub">Loading…</p></div>;
  if (!session) return <AuthPage onSignIn={signIn} onSignUp={signUp} />;
  return <DashboardPage userId={session.user.id} email={session.user.email} onSignOut={signOut} />;
}

export default function App() {
  const { session, loading, signIn, signUp, signOut } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/u/:username" element={<PublicPage />} />
        <Route path="/login" element={
          session ? <Navigate to="/" replace /> : <AuthPage onSignIn={signIn} onSignUp={signUp} />
        } />
        <Route path="/*" element={
          <AuthGate session={session} loading={loading} signIn={signIn} signUp={signUp} signOut={signOut} />
        } />
      </Routes>
    </BrowserRouter>
  );
}
