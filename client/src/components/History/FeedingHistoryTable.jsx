import React from "react";
import { Header } from "../Common/Header";
import { feedingStatusLabels } from "../../constants/labels";

export function FeedingHistoryTable({
  history,
  setView,
  onLogout,
  onDeleteFeeding,
}) {
  return (
    <main className="app-shell">
      <Header
        eyebrow="Historia"
        title="Karmienia"
        activeView="history"
        setView={setView}
        onLogout={onLogout}
      />

      <section className="timeline-card">
        {history.length === 0 ? (
          <div className="empty-state">
            <p className="eyebrow">Brak wpisów</p>
            <h2>Historia pojawi się po pierwszym karmieniu</h2>
            <button
              className="button button--primary"
              onClick={() => setView("registerFeeding")}
            >
              Dodaj karmienie
            </button>
          </div>
        ) : (
          <div className="timeline">
            {history.map((item) => (
              <article className="timeline-item" key={item.id}>
                <div className="timeline-dot" />
                <div>
                  <p className="timeline-date">{item.feeding_date}</p>
                  <h2>{item.meal_weight_g} g pokarmu</h2>
                  <div className="meta-grid">
                    <span>Waga węża: {item.snake_weight_g} g</span>
                    <span>
                      Status: {feedingStatusLabels[item.status] || item.status}
                    </span>
                  </div>
                  {onDeleteFeeding && (
                    <div className="item-actions">
                      <button
                        className="button button--ghost button--danger"
                        title="Usuń ten wpis karmienia"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Czy na pewno chcesz usunąć karmienie z dnia ${item.feeding_date}?`,
                            )
                          ) {
                            onDeleteFeeding(item.id);
                          }
                        }}
                      >
                        🗑️ Usuń
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
