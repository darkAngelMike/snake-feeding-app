import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

const stageLabels = {
  hatchling: "Hatchling",
  juvenile: "Juvenile",
  subadult: "Subadult",
  adult: "Dorosły",
};

const conditionLabels = {
  underweight: "Za chudy",
  normal: "Normalny",
  overweight: "Za gruby",
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://snake-backend-kb14.onrender.com";

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");

  const [profile, setProfile] = useState(null);

  const [snakeName, setSnakeName] = useState("");
  const [currentWeightG, setCurrentWeightG] = useState("");
  const [lifeStage, setLifeStage] = useState("adult");
  const [lastFeedingDate, setLastFeedingDate] = useState("");
  const [bodyCondition, setBodyCondition] = useState("normal");
  const [refusedMealsCount, setRefusedMealsCount] = useState("0");
  const [isShedding, setIsShedding] = useState(false);
  const [lastMealWeightG, setLastMealWeightG] = useState("");

  const [result, setResult] = useState(null);

  const [feedingDate, setFeedingDate] = useState("");
  const [feedingSnakeWeight, setFeedingSnakeWeight] = useState("");
  const [mealWeight, setMealWeight] = useState("");
  const [feedingSaved, setFeedingSaved] = useState(false);

  const [history, setHistory] = useState([]);
  const [authMessage, setAuthMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [feedingMessage, setFeedingMessage] = useState("");
  const [dashboardMessage, setDashboardMessage] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingFeeding, setSavingFeeding] = useState(false);

  const isProfileComplete =
    profile?.name &&
    profile?.current_weight_g &&
    profile?.last_successful_feeding_date;

  const getFakeEmail = () => `${nick}@snake.local`;
  const getApiHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  });

  const parseApiResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    await response.text();
    throw new Error("Backend zwrócił odpowiedź inną niż JSON.");
  };

  const applyProfileData = (data) => {
    setProfile(data);

    if (data) {
      setSnakeName(data.name || "");
      setCurrentWeightG(data.current_weight_g || "");
      setLifeStage(data.life_stage || "adult");
      setLastFeedingDate(data.last_successful_feeding_date || "");
      setBodyCondition(data.body_condition || "normal");
    }
  };

  const fetchProfile = async () => {
    if (!session) return;

    try {
      const response = await fetch(`${API_BASE_URL}/snake-profiles`, {
        headers: getApiHeaders(),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się pobrać profilu.");
      }

      applyProfileData(data.data?.[0] || null);
    } catch (error) {
      console.error(error);
      setProfile(null);
    }
  };

  const fetchHistory = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from("feedings")
      .select("*")
      .eq("snake_id", profile.id)
      .order("feeding_date", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setHistory(data || []);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session),
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    fetch(`${API_BASE_URL}/snake-profiles`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then(async (response) => {
        const data = await parseApiResponse(response);

        if (!response.ok) {
          throw new Error(data.error || "Nie udało się pobrać profilu.");
        }

        applyProfileData(data.data?.[0] || null);
      })
      .catch((error) => {
        console.error(error);
        setProfile(null);
      });
  }, [session]);

  useEffect(() => {
    if (!profile?.id) return;

    supabase
      .from("feedings")
      .select("*")
      .eq("snake_id", profile.id)
      .order("feeding_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }

        setHistory(data || []);
      });
  }, [profile?.id]);

  const register = async () => {
    setAuthMessage("");

    const { error } = await supabase.auth.signUp({
      email: getFakeEmail(),
      password,
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Konto utworzone. Możesz się zalogować.");
  };

  const login = async () => {
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: getFakeEmail(),
      password,
    });

    if (error) {
      setAuthMessage(error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setResult(null);
    setView("dashboard");
  };

  const saveProfile = async () => {
    setProfileMessage("");

    if (!snakeName || !currentWeightG) {
      setProfileMessage("Uzupełnij imię i wagę węża.");
      return;
    }

    setSavingProfile(true);

    const payload = {
      name: snakeName,
      current_weight_g: Number(currentWeightG),
      life_stage: lifeStage,
      body_condition: bodyCondition,
    };

    if (lastFeedingDate) {
      payload.last_successful_feeding_date = lastFeedingDate;
    }

    try {
      const response = await fetch(
        profile
          ? `${API_BASE_URL}/snake-profiles/${profile.id}`
          : `${API_BASE_URL}/snake-profiles`,
        {
          method: profile ? "PATCH" : "POST",
          headers: getApiHeaders(),
          body: JSON.stringify(payload),
        },
      );

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się zapisać profilu.");
      }
    } catch (error) {
      console.error(error);
      setSavingProfile(false);
      setProfileMessage("Nie udało się zapisać profilu. Spróbuj ponownie.");
      return;
    }

    setSavingProfile(false);

    setResult(null);
    await fetchProfile();
    setView("dashboard");
  };

  const calculateFeeding = async () => {
    setDashboardMessage("");
    setCalculating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/calculate`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          snake_id: profile.id,
          last_successful_feeding_date: profile.last_successful_feeding_date,
          weight_g: profile.current_weight_g,
          life_stage: lifeStage,
          body_condition: bodyCondition,
          refused_meals_count: Number(refusedMealsCount || 0),
          is_shedding: isShedding,
          last_meal_weight_g: lastMealWeightG ? Number(lastMealWeightG) : null,
        }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Błąd kalkulacji");
      }

      setResult(data.result);
    } catch (error) {
      console.error(error);
      setDashboardMessage("Nie udało się obliczyć kolejnego karmienia.");
    }

    setCalculating(false);
  };

  const saveFeeding = async () => {
    setFeedingMessage("");

    if (!feedingDate || !feedingSnakeWeight || !mealWeight) {
      setFeedingMessage("Uzupełnij datę karmienia, wagę węża i wagę pokarmu.");
      return;
    }

    setSavingFeeding(true);

    try {
      const response = await fetch(`${API_BASE_URL}/feedings`, {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify({
          snake_id: profile.id,
          feeding_date: feedingDate,
          snake_weight_g: Number(feedingSnakeWeight),
          meal_weight_g: Number(mealWeight),
          status: "success",
        }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się zapisać karmienia");
      }

      if (!data.profileUpdated) {
        console.error("Karmienie zapisane, ale profil nie został zaktualizowany", {
          snake_id: profile.id,
          feeding_date: feedingDate,
        });
      }
    } catch (error) {
      console.error(error);
      setSavingFeeding(false);
      setFeedingMessage(
        error.message || "Nie udało się zapisać karmienia. Spróbuj ponownie.",
      );
      return;
    }

    setSavingFeeding(false);
    setFeedingSaved(true);
    setResult(null);
    setFeedingDate("");
    setFeedingSnakeWeight("");
    setMealWeight("");

    await fetchProfile();
    await fetchHistory();
  };

  if (loading) {
    return (
      <main className="app-shell app-shell--center">
        <section className="loading-card" aria-live="polite">
          <div className="loading-mark" />
          <p>Ładowanie panelu opieki...</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="auth-page">
        <section className="auth-hero" aria-label="Tyson Snake App">
          <p className="eyebrow">Panel opiekuna gada</p>
          <h1>Tyson Snake App</h1>
          <p>
            Profesjonalny rytm karmienia, aktualna waga i historia opieki w
            jednym czytelnym miejscu.
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
            <label htmlFor="nick">Nick</label>
            <input
              id="nick"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="np. tyson"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wpisz hasło"
            />
          </div>

          <div className="button-row">
            <button className="button button--primary" onClick={login}>
              Zaloguj
            </button>
            <button className="button button--secondary" onClick={register}>
              Zarejestruj
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!isProfileComplete || view === "profile") {
    return (
      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Konfiguracja</p>
            <h1>Profil węża</h1>
          </div>
          <button className="button button--ghost" onClick={logout}>
            Wyloguj
          </button>
        </header>

        <section className="form-card form-card--wide">
          <div className="section-heading">
            <p className="eyebrow">Dane bazowe</p>
            <h2>Uzupełnij informacje do planowania karmienia</h2>
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
                value={snakeName}
                onChange={(e) => setSnakeName(e.target.value)}
                placeholder="Tyson"
              />
            </div>

            <div className="field">
              <label htmlFor="currentWeightG">Waga węża (g)</label>
              <input
                id="currentWeightG"
                type="number"
                value={currentWeightG}
                onChange={(e) => setCurrentWeightG(e.target.value)}
                placeholder="500"
              />
            </div>

            <div className="field">
              <label htmlFor="lastFeedingDate">Data ostatniego udanego karmienia</label>
              <input
                id="lastFeedingDate"
                type="date"
                value={lastFeedingDate}
                onChange={(e) => setLastFeedingDate(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="lifeStage">Etap</label>
              <select
                id="lifeStage"
                value={lifeStage}
                onChange={(e) => setLifeStage(e.target.value)}
              >
                <option value="hatchling">Hatchling</option>
                <option value="juvenile">Juvenile</option>
                <option value="subadult">Subadult</option>
                <option value="adult">Adult</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="bodyCondition">Kondycja</label>
              <select
                id="bodyCondition"
                value={bodyCondition}
                onChange={(e) => setBodyCondition(e.target.value)}
              >
                <option value="underweight">Za chudy</option>
                <option value="normal">Normalny</option>
                <option value="overweight">Za gruby</option>
              </select>
            </div>
          </div>

          <div className="button-row">
            <button
              className="button button--primary"
              disabled={savingProfile}
              onClick={saveProfile}
            >
              {savingProfile ? "Zapisywanie..." : "Zapisz profil"}
            </button>

            {isProfileComplete && (
              <button
                className="button button--secondary"
                onClick={() => setView("dashboard")}
              >
                Wróć do panelu
              </button>
            )}
          </div>
        </section>
      </main>
    );
  }

  if (view === "registerFeeding") {
    return (
      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dziennik opieki</p>
            <h1>Zarejestruj karmienie</h1>
          </div>
          <button
            className="button button--ghost"
            onClick={() => setView("dashboard")}
          >
            Wróć
          </button>
        </header>

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
                type="date"
                value={feedingDate}
                onChange={(e) => setFeedingDate(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="feedingSnakeWeight">Aktualna waga węża (g)</label>
              <input
                id="feedingSnakeWeight"
                type="number"
                value={feedingSnakeWeight}
                onChange={(e) => setFeedingSnakeWeight(e.target.value)}
                placeholder={String(profile.current_weight_g || "")}
              />
            </div>

            <div className="field">
              <label htmlFor="mealWeight">Waga pokarmu (g)</label>
              <input
                id="mealWeight"
                type="number"
                value={mealWeight}
                onChange={(e) => setMealWeight(e.target.value)}
                placeholder={
                  result?.mealWeightTarget
                    ? String(result.mealWeightTarget)
                    : ""
                }
              />
            </div>
          </div>

          <div className="button-row">
            <button
              className="button button--primary"
              disabled={savingFeeding}
              onClick={saveFeeding}
            >
              {savingFeeding ? "Zapisywanie..." : "Zapisz karmienie"}
            </button>
            <button
              className="button button--secondary"
              onClick={() => setView("history")}
            >
              Historia karmień
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (view === "history") {
    return (
      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Historia</p>
            <h1>Karmienia</h1>
          </div>
          <button
            className="button button--ghost"
            onClick={() => setView("dashboard")}
          >
            Wróć
          </button>
        </header>

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
                      <span>Status: {item.status}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Panel opiekuna</p>
          <h1>{profile.name}</h1>
        </div>

        <nav className="topbar-actions" aria-label="Akcje panelu">
          <button
            className="button button--secondary"
            onClick={() => setView("profile")}
          >
            Profil
          </button>
          <button className="button button--ghost" onClick={logout}>
            Wyloguj
          </button>
        </nav>
      </header>

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
            <div className="feeding-result">
              <div>
                <span>Najbliższa data</span>
                <strong>{result.nextFeedingDate}</strong>
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
                className={
                  result.status === "overdue" ||
                  result.status === "vet_check_recommended"
                    ? "status-pill status-pill--danger"
                    : "status-pill"
                }
              >
                {result.status === "vet_check_recommended"
                  ? "Zalecana konsultacja"
                  : result.status === "overdue"
                  ? `Po terminie: ${result.daysOverdue} dni`
                  : `Do karmienia: ${result.daysLeft} dni`}
              </p>
              {result.warnings?.length > 0 && (
                <ul className="warning-list">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
              {result.disclaimer && <p className="disclaimer">{result.disclaimer}</p>}
            </div>
          ) : (
            <p className="muted">
              Oblicz termin na podstawie ostatniego karmienia i aktualnej wagi.
            </p>
          )}

          <div className="button-row">
            <button
              className="button button--primary"
              disabled={calculating}
              onClick={calculateFeeding}
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

export default App;
