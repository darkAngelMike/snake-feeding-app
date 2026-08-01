import React from "react";

export function LoginForm({
  nick,
  setNick,
  password,
  setPassword,
  authMessage,
  onLogin,
  onRegister,
}) {
  return (
    <main className="auth-page">
      <section className="auth-hero" aria-label="Panel opiekuna węża">
        <p className="eyebrow">Panel opiekuna gada</p>
        <h1>SerpentTrack</h1>
        <p>
          Planuj karmienia, śledź historię i monitoruj kondycję swojego pytona
          w jednym miejscu.
        </p>
      </section>

      <section className="auth-card">
        <div className="section-heading">
          <p className="eyebrow">Dostęp</p>
          <h2>Zaloguj się lub utwórz konto</h2>
        </div>

        {authMessage && (
          <p className="message message--info" role="status">
            {authMessage}
          </p>
        )}

        <div className="field">
          <label htmlFor="nick">Nazwa użytkownika</label>
          <input
            id="nick"
            data-testid="login-input-username"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="Twoja nazwa"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Hasło</label>
          <input
            id="password"
            data-testid="login-input-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wpisz hasło"
          />
        </div>

        <div className="button-row">
          <button
            className="button button--primary"
            data-testid="login-button-submit"
            disabled={!nick || !password}
            onClick={onLogin}
          >
            Zaloguj
          </button>
          <button
            className="button button--secondary"
            data-testid="login-button-register"
            disabled={!nick || !password}
            onClick={onRegister}
          >
            Zarejestruj
          </button>
        </div>
      </section>
    </main>
  );
}
