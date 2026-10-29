import { useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, LockKeyhole, Mail, UserRound } from 'lucide-react';
import type { Database } from '../../types/database';

type AuthMode = 'signIn' | 'signUp';

type AuthPanelProps = {
  client: SupabaseClient<Database>;
  initialMode: AuthMode;
  onBack: () => void;
};

export default function AuthPanel({ client, initialMode, onBack }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setNotice('');
    setSubmitting(true);

    try {
      if (mode === 'signUp') {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice('Compte créé. Vérifiez votre adresse email pour confirmer l’inscription.');
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Connexion impossible. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-panel surface-card" aria-labelledby="auth-title">
      <button className="icon-button back-button" onClick={onBack} type="button" aria-label="Retour">
        <ArrowLeft size={18} />
      </button>
      <div className="eyebrow">ESPACE PASSAGER</div>
      <h1 id="auth-title">{mode === 'signIn' ? 'Ravi de vous revoir.' : 'Créons votre compte.'}</h1>
      <p className="muted-copy">Connectez-vous à votre espace Nexora Mobility.</p>

      <form className="form-stack" onSubmit={handleSubmit}>
        {mode === 'signUp' && (
          <label className="field-label">
            Nom complet
            <span className="input-wrap">
              <UserRound size={17} aria-hidden="true" />
              <input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} placeholder="Votre nom" />
            </span>
          </label>
        )}
        <label className="field-label">
          Adresse email
          <span className="input-wrap">
            <Mail size={17} aria-hidden="true" />
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="nom@exemple.com" />
          </span>
        </label>
        <label className="field-label">
          Mot de passe
          <span className="input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input type="password" autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} placeholder="8 caractères minimum" />
          </span>
        </label>

        {errorMessage && <p className="form-message error-message" role="alert">{errorMessage}</p>}
        {notice && <p className="form-message success-message" role="status">{notice}</p>}

        <button className="button button-primary button-full" disabled={submitting} type="submit">
          {submitting ? 'Un instant…' : mode === 'signIn' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>

      <p className="auth-switch muted-copy">
        {mode === 'signIn' ? 'Pas encore de compte ?' : 'Vous avez déjà un compte ?'}{' '}
        <button className="text-button" type="button" onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setErrorMessage(''); setNotice(''); }}>
          {mode === 'signIn' ? 'Créer un compte' : 'Se connecter'}
        </button>
      </p>
      <p className="micro-copy">Connexion par email activée pour ce premier lot. Le mode d’authentification final reste à confirmer.</p>
    </section>
  );
}
