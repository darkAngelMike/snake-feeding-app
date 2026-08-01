import React from "react";
import { Header } from "../Common/Header";

export function FeedingForm({
  feedingDate,
  setFeedingDate,
  feedingSnakeWeight,
  setFeedingSnakeWeight,
  mealWeight,
  setMealWeight,
  feedingMessage,
  feedingSaved,
  savingFeeding,
  profileLoading,
  result,
  onSaveFeeding,
  setView,
  onLogout,
}) {
  return (
    <main className="app-shell">
      <Header
        eyebrow="Dziennik opieki"
        title="Zarejestruj karmienie"
        activeView="registerFeeding"
        setView={setView}
        onLogout={onLogout}
      />

      <section className="form-card form-card--wide">
        <div className="section-heading">
          <p className="eyebrow">Nowy wpis</p>
          <h2>Dodaj karmienie i aktualną wagę</h2>
        </div>

        {feedingMessage && (
          <p className="message message--error" role="alert">
            {feedingMessage}
          </p>
        )}

        {feedingSaved && (
          <p className="message message--success" role="status">
            Karmienie zapisane w historii.
          </p>
        )}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="feedingDate">Data karmienia</label>
            <input
              id="feedingDate"
              data-testid="feeding-input-date"
              type="date"
              value={feedingDate}
              onChange={(e) => setFeedingDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="feedingSnakeWeight">Aktualna waga węża (g)</label>
            <input
              id="feedingSnakeWeight"
              data-testid="feeding-input-weight"
              type="number"
              value={feedingSnakeWeight}
              onChange={(e) => setFeedingSnakeWeight(e.target.value)}
              placeholder="Wpisz aktualną wagę"
            />
          </div>

          <div className="field">
            <label htmlFor="mealWeight">Waga pokarmu (g)</label>
            <input
              id="mealWeight"
              data-testid="feeding-input-meal"
              type="number"
              value={mealWeight}
              onChange={(e) => setMealWeight(e.target.value)}
              placeholder={
                result?.mealWeightTarget
                  ? `Sugerowane: ${result.mealWeightTarget} g`
                  : "Wpisz wagę pokarmu"
              }
            />
          </div>
        </div>

        <div className="div-actions">
          <button
            className="button button--primary"
            data-testid="feeding-button-save"
            disabled={savingFeeding || profileLoading}
            onClick={onSaveFeeding}
          >
            {savingFeeding ? "Zapisywanie..." : "Zapisz karmienie"}
          </button>
          <button
            className="button button--secondary"
            data-testid="feeding-button-history"
            onClick={() => setView("history")}
          >
            Historia karmień
          </button>
        </div>
      </section>
    </main>
  );
}
