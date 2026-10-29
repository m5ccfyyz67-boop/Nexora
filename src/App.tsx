import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, Car, ShieldCheck } from 'lucide-react';
import AuthPanel from './features/auth/AuthPanel';
import PassengerApp from './features/passenger/PassengerApp';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type AuthMode = 'signIn' | 'signUp';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null);
        setCheckingSession(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (!isSupabaseConfigured || !supabase) return <ConfigurationScreen />;
  if (checkingSession) return <div className="loading-screen"><span className="spinner" />Connexion à votre espace Nexora…</div>;
  if (user) return <PassengerApp client={supabase} user={user} onSignOut={signOut} />;

  return (
    <main className="auth-shell">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <div className="auth-content">
        <BrandMark />
        {authMode ? (
          <AuthPanel client={supabase} initialMode={authMode} onBack={() => setAuthMode(null)} />
        ) : (
          <section className="welcome-panel">
            <div className="welcome-visual"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="visual-car"><Car size={58} strokeWidth={1.1} /></div><span className="visual-point point-a" /><span className="visual-point point-b" /></div>
            <div className="eyebrow">MOBILITÉ URBAINE · ABIDJAN</div>
            <h1>Vos kilomètres.<br /><span>Votre liberté.</span></h1>
            <p className="muted-copy">Une nouvelle façon de vous déplacer, pensée pour la ville.</p>
            <div className="welcome-actions">
              <button className="button button-primary button-full" type="button" onClick={() => setAuthMode('signIn')}>Se connecter <ArrowRight size={17} /></button>
              <button className="button button-secondary button-full" type="button" onClick={() => setAuthMode('signUp')}>Créer un compte</button>
            </div>
            <div className="trust-note"><ShieldCheck size={15} /> Données protégées par votre compte</div>
          </section>
        )}
        <p className="footer-copy">NEXORA MOBILITY <span>·</span> VERSION DE DÉVELOPPEMENT</p>
      </div>
    </main>
  );
}

function BrandMark() {
  return <div className="brand-mark brand-centered"><span className="brand-symbol">N</span><span className="brand-wordmark"><strong>NEXORA</strong><small>MOBILITY</small></span></div>;
}

function ConfigurationScreen() {
  return (
    <main className="config-screen">
      <div className="config-card surface-card">
        <BrandMark />
        <div className="eyebrow">CONFIGURATION REQUISE</div>
        <h1>Supabase n’est pas configuré.</h1>
        <p className="muted-copy">Copiez `.env.example` vers `.env.local`, puis renseignez l’URL et la clé publiable de votre projet Supabase. Aucune connexion simulée n’est activée.</p>
        <code>VITE_SUPABASE_URL<br />VITE_SUPABASE_PUBLISHABLE_KEY</code>
      </div>
    </main>
  );
}
