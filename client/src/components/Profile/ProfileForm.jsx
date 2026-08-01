import React from "react";
import { Header } from "../Common/Header";
import { MIN_SNAKE_WEIGHT_G, MAX_SNAKE_WEIGHT_G } from "../../constants/labels";

export function ProfileForm({
  profile,
  snakeName,
  setSnakeName,
  currentWeightG,
  setCurrentWeightG,
  lastFeedingDate,
  setLastFeedingDate,
  lifeStage,
  setLifeStage,
  bodyCondition,
  setBodyCondition,
  profileMessage,
  savingProfile,
  profileLoading,
  isProfileComplete,
  markProfileFormDirty,
  onSaveProfile,
  onCancel,
  setView,
  onLogout,
}) {
  return (
    <main className="app-shell">
      <Header
        eyebrow="Konfiguracja"
        title="Profil węża"
        activeView="profile"
        setView={setView}
        onLogout={onLogout}
      />

      <section className="form-card form-card--wide">
        <div className="section-heading">
          <p className="eyebrow">
            {profile ? "Dane bazowe" : "Zacznij od profilu swojego węża"}
          </p>
          <h2>
            {profile
              ? "Uzupełnij informacje do planowania karmienia"
              : "Dodaj podstawowe dane, żeby SerpentTrack mógł przygotować rekomendację karmienia."}
          </h2>
          {!profile && (
            <p className="muted">
              Twoje dane są przypisane do konta i widoczne tylko po
              zalogowaniu.
            </p>
          )}
        </div>

        {profileMessage && (
          <p className="message message--error" role="alert">
            {profileMessage}
          </p>
        )}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="snakeName">Imię węża</label>
            <input
              id="snakeName"
              data-testid="profile-input-name"
              value={snakeName}
              onChange={(e) => {
                markProfileFormDirty();
                setSnakeName(e.target.value);
              }}
              placeholder="Twój wąż"
            />
          </div>

          <div className="field">
            <label htmlFor="currentWeightG">Waga węża (g)</label>
            <input
              id="currentWeightG"
              data-testid="profile-input-weight"
              type="number"
              min={MIN_SNAKE_WEIGHT_G}
              max={MAX_SNAKE_WEIGHT_G}
              value={currentWeightG}
              onChange={(e) => {
                markProfileFormDirty();
                setCurrentWeightG(e.target.value);
              }}
              placeholder="np. 500"
            />
            <p className="field-hint">
              Zakres dla formularza: 50-5000 g. Jeśli wynik jest nietypowy,
              sprawdź wagę przed zapisem.
            </p>
          </div>

          <div className="field">
            <label htmlFor="lastFeedingDate">Data ostatniego udanego karmienia</label>
            <input
              id="lastFeedingDate"
              type="date"
              value={lastFeedingDate}
              onChange={(e) => {
                markProfileFormDirty();
                setLastFeedingDate(e.target.value);
              }}
            />
          </div>

          <div className="field">
            <div className="label-row">
              <label htmlFor="lifeStage">Etap życia</label>
              <details className="field-help">
                <summary aria-label="Pomoc: etap życia">?</summary>
                <div className="field-help-panel">
                  <dl>
                    <dt>Młody po wykluciu</dt>
                    <dd>0-3 miesiące, zwykle &lt;150 g</dd>
                    <dt>Młody</dt>
                    <dd>3-12 miesięcy, zwykle 150-600 g</dd>
                    <dt>Podrostek</dt>
                    <dd>1-3 lata, zwykle 600-1500 g</dd>
                    <dt>Dorosły</dt>
                    <dd>&gt;3 lata, zwykle &gt;1500 g</dd>
                  </dl>
                  <p>
                    Samice są większe. Wybierz etap zbliżony do wagi węża.
                  </p>
                </div>
              </details>
            </div>
            <select
              id="lifeStage"
              data-testid="profile-select-life-stage"
              value={lifeStage}
              className={!lifeStage ? "is-placeholder" : undefined}
              onChange={(e) => {
                markProfileFormDirty();
                setLifeStage(e.target.value);
              }}
            >
              <option value="">Wybierz etap życia</option>
              <option value="hatchling">Młody po wykluciu</option>
              <option value="juvenile">Młody</option>
              <option value="subadult">Podrostek</option>
              <option value="adult">Dorosły</option>
            </select>
          </div>

          <div className="field field--wide">
            <label htmlFor="bodyCondition">Kondycja</label>
            <select
              id="bodyCondition"
              data-testid="profile-select-condition"
              value={bodyCondition}
              className={!bodyCondition ? "is-placeholder" : undefined}
              onChange={(e) => {
                markProfileFormDirty();
                setBodyCondition(e.target.value);
              }}
            >
              <option value="">Wybierz kondycję</option>
              <option value="underweight">Niedowaga</option>
              <option value="normal">Normalny</option>
              <option value="overweight">Nadwaga</option>
            </select>
            <p className="field-hint">
              Ocena kondycji to Twoja obserwacja sylwetki węża. Aplikacja
              traktuje ją jako wskazówkę do obliczeń.
            </p>
          </div>
        </div>

        <div className="div-actions">
          <button
            className="button button--primary"
            data-testid="profile-button-save"
            disabled={savingProfile || profileLoading}
            onClick={onSaveProfile}
          >
            {savingProfile ? "Zapisywanie..." : "Zapisz profil"}
          </button>

          {isProfileComplete && (
            <button
              className="button button--secondary"
              onClick={onCancel}
            >
              Wróć do panelu
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
