import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import PublicPage from './pages/PublicPage';
import ArticlesPage from './pages/ArticlesPage';
import PublicArticlesPage from './pages/PublicArticlesPage';
import ArticleReadPage from './pages/ArticleReadPage';
import BackgroundCanvas from './components/BackgroundCanvas';
import BgPicker from './components/BgPicker';

function AuthGate({ session, loading, signIn, signUp, signOut }) {
  if (loading) return <div className="wrap" style={{ paddingTop: 80 }}><p className="sub">Loading…</p></div>;
  if (!session) return <AuthPage onSignIn={signIn} onSignUp={signUp} />;
  return <DashboardPage userId={session.user.id} onSignOut={signOut} />;
}

export default function App() {
  const { session, loading, signIn, signUp, signOut } = useAuth();
  const [bgMode, setBgMode] = useState(() => localStorage.getItem('bgMode') || 'off');

  function handleBgChange(mode) {
    setBgMode(mode);
    localStorage.setItem('bgMode', mode);
  }

  return (
    <BrowserRouter>
      <BackgroundCanvas mode={bgMode} />
      {session && <BgPicker mode={bgMode} onChange={handleBgChange} />}
      <Routes>
        <Route path="/u/:username" element={<PublicPage />} />
        <Route path="/u/:username/articles" element={<PublicArticlesPage />} />
        <Route path="/u/:username/article/:id" element={<ArticleReadPage />} />
        <Route path="/login" element={
          session ? <Navigate to="/" replace /> : <AuthPage onSignIn={signIn} onSignUp={signUp} />
        } />
        <Route path="/articles" element={
          loading ? <div className="wrap" style={{ paddingTop: 80 }}><p className="sub">Loading…</p></div>
            : session ? <ArticlesPage userId={session.user.id} onSignOut={signOut} />
            : <Navigate to="/login" replace />
        } />
        <Route path="/*" element={
          <AuthGate session={session} loading={loading} signIn={signIn} signUp={signUp} signOut={signOut} />
        } />
      </Routes>
    </BrowserRouter>
  );
}
