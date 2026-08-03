import React from "react";
import { Header } from "../Common/Header";
import {
  stageLabels,
  conditionLabels,
  weightAssessmentLabels,
} from "../../constants/labels";

export function Dashboard({
  profile,
  lifeStage,
  bodyCondition,
  weightAssessment,
  dashboardMessage,
  refusedMealsCount,
  setRefusedMealsCount,
  lastMealWeightG,
  setLastMealWeightG,
  isShedding,
  setIsShedding,
  result,
  calculating,
  profileLoading,
  onCalculateFeeding,
  getFeedingTimingLabel,
  setView,
  onLogout,
}) {
  return (
    <main className="app-shell">
      <Header
        eyebrow="Panel opiekuna"
        title={profile.name}
        activeView="dashboard"
        setView={setView}
        onLogout={onLogout}
      />

      <section className="dashboard-grid">
        <article className="summary-card summary-card--main">
          <div className="section-heading">
            <p className="eyebrow">Podsumowanie</p>
            <h2>Aktualny stan węża</h2>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <span>Waga</span>
              <strong>{profile.current_weight_g} g</strong>
            </div>
            <div className="stat">
              <span>Etap</span>
              <strong>{stageLabels[lifeStage] || lifeStage}</strong>
            </div>
            <div className="stat">
              <span>Kondycja</span>
              <strong>{conditionLabels[bodyCondition] || bodyCondition}</strong>
              <p>Ocena wpisana ręcznie w profilu.</p>
            </div>
            <div
              data-testid="dashboard-status-weight"
              className={`stat stat--assessment stat--${weightAssessment.severity}`}
            >
              <span>Status masy</span>
              <strong>
                {weightAssessmentLabels[weightAssessment.status] ||
                  weightAssessment.status}
              </strong>
              {weightAssessment.changePercent !== null && (
                <em>
                  {weightAssessment.changePercent > 0 ? "+" : ""}
                  {weightAssessment.changePercent}%
                </em>
              )}
              <p>{weightAssessment.message}</p>
            </div>
            <div className="stat">
              <span>Ostatnie karmienie</span>
              <strong>{profile.last_successful_feeding_date}</strong>
            </div>
          </div>
        </article>

        <article className="summary-card next-feeding-card">
          <div className="section-heading">
            <p className="eyebrow">Następne karmienie</p>
            <h2>Plan żywienia</h2>
          </div>

          {dashboardMessage && (
            <p className="message message--error" role="alert">
              {dashboardMessage}
            </p>
          )}

          <div className="context-grid">
            <div className="field">
              <label htmlFor="refusedMealsCount">Odmowy karmienia</label>
              <input
                id="refusedMealsCount"
                min="0"
                type="number"
                value={refusedMealsCount}
                onChange={(e) => setRefusedMealsCount(e.target.value)}
                placeholder="Brak odmów"
              />
            </div>

            <div className="field">
              <label htmlFor="lastMealWeightG">Ostatnia karmówka (g)</label>
              <input
                id="lastMealWeightG"
                min="0"
                type="number"
                value={lastMealWeightG}
                onChange={(e) => setLastMealWeightG(e.target.value)}
                placeholder="Opcjonalnie"
              />
            </div>

            <label className="checkbox-field" htmlFor="isShedding">
              <input
                id="isShedding"
                type="checkbox"
                checked={isShedding}
                onChange={(e) => setIsShedding(e.target.checked)}
              />
              Wąż jest w trakcie wylinki
            </label>
          </div>

          {result ? (
            <>
              {result.overdueNotice && (
                <div className="message message--error" style={{ marginBottom: "16px" }}>
                  <strong>🔴 ZALEGŁE KARMIENIE</strong>
                  <p style={{ margin: "4px 0 0" }}>{result.overdueNotice}</p>
                </div>
              )}
              <div className="feeding-result">
                <div>
                  <span>Najbliższa data</span>
                  <strong data-testid="dashboard-next-feeding-date">
                    {result.nextFeedingDate}
                  </strong>
                </div>
                <div>
                  <span>Zakres karmówki</span>
                  <strong>
                    {result.mealWeightMin}-{result.mealWeightMax} g
                  </strong>
                </div>
                <div>
                  <span>Cel karmówki</span>
                  <strong>{result.mealWeightTarget} g</strong>
                </div>
                <div>
                  <span>Interwał</span>
                  <strong>{result.feedingIntervalDays} dni</strong>
                </div>
                <p
                  data-testid="dashboard-days-left"
                  className={
                    result.status === "overdue" ||
                    result.status === "vet_check_recommended" ||
                    result.daysOverdue > 0
                      ? "status-pill status-pill--danger"
                      : "status-pill"
                  }
                >
                  {getFeedingTimingLabel()}
                </p>
                {result.status === "vet_check_recommended" && (
                  <p className="status-pill status-pill--danger">
                    Zalecana konsultacja
                  </p>
                )}
                {result.warnings?.length > 0 && (
                  <ul className="warning-list">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
                {result.disclaimer && (
                  <p className="disclaimer">{result.disclaimer}</p>
                )}
              </div>
            </>
          ) : (
            <p className="muted">
              Oblicz termin na podstawie ostatniego karmienia i aktualnej wagi.
            </p>
          )}

          <div className="div-actions">
            <button
              className="button button--primary"
              data-testid="dashboard-button-calculate"
              disabled={calculating || profileLoading}
              onClick={onCalculateFeeding}
            >
              {calculating ? "Obliczanie..." : "Oblicz termin"}
            </button>
            <button
              className="button button--secondary"
              onClick={() => setView("registerFeeding")}
            >
              Zarejestruj karmienie
            </button>
          </div>
        </article>
      </section>

      <section className="monitor-card" aria-label="Aktywność SerpentTrack">
        <div>
          <p className="eyebrow">Aktywność opiekuna</p>
          <h2>
            {result
              ? "Plan został przeliczony na podstawie danych"
              : "SerpentTrack monitoruje plan karmienia"}
          </h2>
          <p>
            {result
              ? "Plan został przeliczony. Sprawdź sugerowaną datę i wagę karmówki przed zapisem kolejnego karmienia."
              : "Oblicz termin karmienia, żeby zobaczyć rekomendację i uzupełnić dziennik opieki."}
          </p>
        </div>
        <div className="dashboard-snake" aria-hidden="true">
          <span className="snake-track" />
          <span className="snake-line" />
          <span className="snake-head" />
        </div>
      </section>

      <section className="quick-actions">
        <button
          className="action-tile"
          onClick={() => setView("registerFeeding")}
        >
          <span>Dodaj wpis</span>
          <strong>Nowe karmienie</strong>
        </button>
        <button className="action-tile" onClick={() => setView("history")}>
          <span>Przegląd</span>
          <strong>Historia karmień</strong>
        </button>
      </section>
    </main>
  );
}
