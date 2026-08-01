import React from "react";

export function Header({ title, eyebrow, activeView, setView, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <nav className="topbar-actions" aria-label="Akcje panelu">
        <button
          className={`nav-action ${activeView === "dashboard" ? "is-active" : ""}`}
          onClick={() => setView("dashboard")}
        >
          Przegląd
        </button>
        <button
          className={`nav-action ${
            activeView === "registerFeeding" ? "is-active" : ""
          }`}
          onClick={() => setView("registerFeeding")}
        >
          Dodaj wpis
        </button>
        <button
          className={`nav-action ${activeView === "profile" ? "is-active" : ""}`}
          onClick={() => setView("profile")}
        >
          Profil
        </button>
        <button className="nav-action nav-action--ghost" onClick={onLogout}>
          Wyloguj
        </button>
      </nav>
    </header>
  );
}
