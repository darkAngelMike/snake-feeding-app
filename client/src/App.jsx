import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

const stageLabels = {
  young: "Młody",
  adult: "Dorosły",
};

const conditionLabels = {
  underweight: "Za chudy",
  normal: "Normalny",
  overweight: "Za gruby",
};

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");

  const [profile, setProfile] = useState(null);

  const [snakeName, setSnakeName] = useState("");
  const [weight, setWeight] = useState("");
  const [stage, setStage] = useState("adult");
  const [lastFeedingDate, setLastFeedingDate] = useState("");
  const [bodyCondition, setBodyCondition] = useState("normal");

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
    profile?.name && profile?.weight && profile?.last_feeding_date;

  const getFakeEmail = () => `${nick}@snake.local`;

  const applyProfileData = (data) => {
    setProfile(data);

    if (data) {
      setSnakeName(data.name || "");
      setWeight(data.weight || "");
      setStage(data.stage || "adult");
      setLastFeedingDate(data.last_feeding_date || "");
      setBodyCondition(data.body_condition || "normal");
    }
  };

  const fetchProfile = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from("snake_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setProfile(null);
      return;
    }

    applyProfileData(data);
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

    supabase
      .from("snake_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setProfile(null);
          return;
        }

        applyProfileData(data);
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

    if (!snakeName || !weight || !lastFeedingDate) {
      setProfileMessage("Uzupełnij imię, wagę i datę ostatniego karmienia.");
      return;
    }

    setSavingProfile(true);

    const payload = {
      user_id: session.user.id,
      name: snakeName,
      weight: Number(weight),
      stage,
      last_feeding_date: lastFeedingDate,
      body_condition: bodyCondition,
    };

    const { error } = profile
      ? await supabase
          .from("snake_profiles")
          .update(payload)
          .eq("id", profile.id)
      : await supabase.from("snake_profiles").insert([payload]);

    setSavingProfile(false);

    if (error) {
      console.error(error);
      setProfileMessage("Nie udało się zapisać profilu. Spróbuj ponownie.");
      return;
    }

    setResult(null);
    await fetchProfile();
    setView("dashboard");
  };

  const calculateFeeding = async () => {
    setDashboardMessage("");
    setCalculating(true);

    try {
      const response = await fetch(
        "https://snake-backend-kb14.onrender.com/calculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feedingDate: profile.last_feeding_date,
            weight: profile.weight,
            stage: profile.stage,
          }),
        },
      );

      const data = await response.json();
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

    const { error } = await supabase.from("feedings").insert([
      {
        user_id: session.user.id,
        snake_id: profile.id,
        feeding_date: feedingDate,
        snake_weight: Number(feedingSnakeWeight),
        meal_weight: Number(mealWeight),
        status: "ok",
      },
    ]);

    if (error) {
      console.error(error);
      setSavingFeeding(false);
      setFeedingMessage("Nie udało się zapisać karmienia. Spróbuj ponownie.");
      return;
    }

    await supabase
      .from("snake_profiles")
      .update({
        weight: Number(feedingSnakeWeight),
        last_feeding_date: feedingDate,
      })
      .eq("id", profile.id);

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
              <label htmlFor="weight">Waga węża (g)</label>
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="500"
              />
            </div>

            <div className="field">
              <label htmlFor="lastFeedingDate">Data ostatniego karmienia</label>
              <input
                id="lastFeedingDate"
                type="date"
                value={lastFeedingDate}
                onChange={(e) => setLastFeedingDate(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="stage">Etap</label>
              <select
                id="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                <option value="young">Young</option>
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
                placeholder={String(profile.weight || "")}
              />
            </div>

            <div className="field">
              <label htmlFor="mealWeight">Waga pokarmu (g)</label>
              <input
                id="mealWeight"
                type="number"
                value={mealWeight}
                onChange={(e) => setMealWeight(e.target.value)}
                placeholder={result?.mealWeight ? String(result.mealWeight) : ""}
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
                    <h2>{item.meal_weight} g pokarmu</h2>
                    <div className="meta-grid">
                      <span>Waga węża: {item.snake_weight} g</span>
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
              <strong>{profile.weight} g</strong>
            </div>
            <div className="stat">
              <span>Etap</span>
              <strong>{stageLabels[profile.stage] || profile.stage}</strong>
            </div>
            <div className="stat">
              <span>Kondycja</span>
              <strong>
                {conditionLabels[profile.body_condition] ||
                  profile.body_condition}
              </strong>
            </div>
            <div className="stat">
              <span>Ostatnie karmienie</span>
              <strong>{profile.last_feeding_date}</strong>
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

          {result ? (
            <div className="feeding-result">
              <div>
                <span>Najbliższa data</span>
                <strong>{result.nextFeedingDate}</strong>
              </div>
              <div>
                <span>Rekomendowany pokarm</span>
                <strong>{result.mealWeight} g</strong>
              </div>
              <p
                className={
                  result.isOverdue
                    ? "status-pill status-pill--danger"
                    : "status-pill"
                }
              >
                {result.isOverdue
                  ? `Po terminie: ${result.daysOverdue} dni`
                  : `Do karmienia: ${result.daysLeft} dni`}
              </p>
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
