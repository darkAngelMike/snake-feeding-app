import { useRef, useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

const stageLabels = {
  hatchling: "Młody po wykluciu",
  juvenile: "Młody",
  subadult: "Podrostek",
  adult: "Dorosły",
};

const conditionLabels = {
  underweight: "Niedowaga",
  normal: "Normalny",
  overweight: "Nadwaga",
};

const feedingStatusLabels = {
  success: "Zjedzone",
  refused: "Odmowa",
  skipped: "Pominięte",
};

const weightAssessmentLabels = {
  unknown: "Brak danych",
  weight_loss: "Spadek masy",
  rapid_gain: "Szybki wzrost",
  stable: "Stabilna",
  overweight_alert: "Bardzo wysoka",
  invalid: "Nieprawidłowa",
};

const defaultWeightAssessment = {
  status: "unknown",
  severity: "neutral",
  changePercent: null,
  message: "Brak wystarczającej historii do oceny trendu masy.",
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const MIN_SNAKE_WEIGHT_G = 50;
const MAX_SNAKE_WEIGHT_G = 5000;

function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const currentUserIdRef = useRef(null);
  const currentProfileIdRef = useRef(null);
  const profileFormDirtyRef = useRef(false);

  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");

  const [profile, setProfile] = useState(null);

  const [snakeName, setSnakeName] = useState("");
  const [currentWeightG, setCurrentWeightG] = useState("");
  const [lifeStage, setLifeStage] = useState("");
  const [lastFeedingDate, setLastFeedingDate] = useState("");
  const [bodyCondition, setBodyCondition] = useState("");
  const [refusedMealsCount, setRefusedMealsCount] = useState("");
  const [isShedding, setIsShedding] = useState(false);
  const [lastMealWeightG, setLastMealWeightG] = useState("");

  const [result, setResult] = useState(null);

  const [feedingDate, setFeedingDate] = useState("");
  const [feedingSnakeWeight, setFeedingSnakeWeight] = useState("");
  const [mealWeight, setMealWeight] = useState("");
  const [feedingSaved, setFeedingSaved] = useState(false);

  const [history, setHistory] = useState([]);
  const [weightAssessment, setWeightAssessment] = useState(
    defaultWeightAssessment,
  );
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
    profile?.life_stage &&
    profile?.body_condition &&
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

  const getApiErrorMessage = (response, fallback) => {
    if (response.status === 401) return "Sesja wygasła. Zaloguj się ponownie.";
    if (response.status === 403) return "Nie masz dostępu do tego profilu.";
    if (response.status >= 500) {
      return "Wystąpił błąd serwera. Spróbuj ponownie później.";
    }

    return fallback;
  };

  const getFeedingTimingLabel = () => {
    if (!result) return "";
    if (result.daysLeft > 0) return `Do karmienia: ${result.daysLeft} dni`;
    if (result.daysOverdue > 0) {
      return `Po terminie: ${result.daysOverdue} dni`;
    }
    if (result.daysLeft === 0) return "Karmienie dzisiaj";
    return "";
  };

  const renderTopbarActions = (activeView) => (
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
      <button className="nav-action nav-action--ghost" onClick={logout}>
        Wyloguj
      </button>
    </nav>
  );

  const markProfileFormDirty = () => {
    profileFormDirtyRef.current = true;
  };

  const buildMissingProfileMessage = () => {
    const missing = [];

    if (!snakeName.trim()) missing.push("imię węża");
    if (!currentWeightG) missing.push("wagę węża");
    if (!lifeStage) missing.push("etap życia");
    if (!bodyCondition) missing.push("kondycję węża");

    if (missing.length === 0) return "";

    const action = missing[0] === "kondycję węża" ? "Wybierz" : "Uzupełnij";
    const fields =
      missing.length === 1
        ? missing[0]
        : `${missing.slice(0, -1).join(", ")} i ${missing.at(-1)}`;

    return `${action} ${fields}.`;
  };

  const resetUserScopedState = () => {
    profileFormDirtyRef.current = false;
    currentProfileIdRef.current = null;
    setProfile(null);
    setSnakeName("");
    setCurrentWeightG("");
    setLifeStage("");
    setLastFeedingDate("");
    setBodyCondition("");
    setRefusedMealsCount("");
    setIsShedding(false);
    setLastMealWeightG("");
    setResult(null);
    setFeedingDate("");
    setFeedingSnakeWeight("");
    setMealWeight("");
    setFeedingSaved(false);
    setHistory([]);
    setWeightAssessment(defaultWeightAssessment);
    setProfileMessage("");
    setFeedingMessage("");
    setDashboardMessage("");
    setSavingProfile(false);
    setSavingFeeding(false);
    setCalculating(false);
    setView("dashboard");
  };

  const applyProfileData = (data, { preserveDirtyForm = false } = {}) => {
    currentProfileIdRef.current = data?.id || null;
    setProfile(data);

    if (preserveDirtyForm && profileFormDirtyRef.current) {
      if (!data) setHistory([]);
      return;
    }

    if (data) {
      setSnakeName(data.name || "");
      setCurrentWeightG(data.current_weight_g || "");
      setLifeStage(data.life_stage || "");
      setLastFeedingDate(data.last_successful_feeding_date || "");
      setBodyCondition(data.body_condition || "");
    } else {
      setHistory([]);
      setWeightAssessment(defaultWeightAssessment);
      setSnakeName("");
      setCurrentWeightG("");
      setLifeStage("");
      setLastFeedingDate("");
      setBodyCondition("");
    }
  };

  const fetchProfile = async () => {
    if (!session) return;

    const requestUserId = session.user.id;
    setProfileLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/snake-profiles`, {
        headers: getApiHeaders(),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            response,
            data.error || "Nie udało się pobrać profilu.",
          ),
        );
      }

      if (currentUserIdRef.current !== requestUserId) return;

      applyProfileData(data.data?.[0] || null, { preserveDirtyForm: true });
    } catch (error) {
      console.error(error);
      if (currentUserIdRef.current !== requestUserId) return;
      setProfile(null);
      setProfileMessage(error.message || "Nie udało się pobrać profilu.");
    } finally {
      if (currentUserIdRef.current === requestUserId) {
        setProfileLoading(false);
      }
    }
  };

  const fetchHistory = async () => {
    if (!session || !profile?.id) return;

    const requestUserId = session.user.id;
    const requestProfileId = profile.id;

    try {
      const response = await fetch(
        `${API_BASE_URL}/feedings?snake_id=${encodeURIComponent(requestProfileId)}`,
        {
          headers: getApiHeaders(),
        },
      );

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            response,
            data.error || "Nie udało się pobrać historii karmień.",
          ),
        );
      }

      if (
        currentUserIdRef.current !== requestUserId ||
        currentProfileIdRef.current !== requestProfileId
      ) {
        return;
      }

      setHistory(data.data || []);
      setWeightAssessment(data.weightAssessment || defaultWeightAssessment);
    } catch (error) {
      console.error(error);
      if (
        currentUserIdRef.current !== requestUserId ||
        currentProfileIdRef.current !== requestProfileId
      ) {
        return;
      }
      setHistory([]);
      setWeightAssessment(defaultWeightAssessment);
      setDashboardMessage(
        error.message || "Nie udało się pobrać historii karmień.",
      );
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      currentUserIdRef.current = data.session?.user?.id || null;
      setProfileLoading(Boolean(data.session?.user?.id));
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUserId = session?.user?.id || null;

        if (currentUserIdRef.current !== nextUserId) {
          resetUserScopedState();
          setProfileLoading(Boolean(nextUserId));
        }

        currentUserIdRef.current = nextUserId;
        setSession(session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const requestUserId = session.user.id;

    fetch(`${API_BASE_URL}/snake-profiles`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then(async (response) => {
        const data = await parseApiResponse(response);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              response,
              data.error || "Nie udało się pobrać profilu.",
            ),
          );
        }

        if (currentUserIdRef.current !== requestUserId) return;

        applyProfileData(data.data?.[0] || null, { preserveDirtyForm: true });
      })
      .catch((error) => {
        console.error(error);
        if (currentUserIdRef.current !== requestUserId) return;
        setProfile(null);
        setProfileMessage(error.message || "Nie udało się pobrać profilu.");
      })
      .finally(() => {
        if (currentUserIdRef.current === requestUserId) {
          setProfileLoading(false);
        }
      });
  }, [session]);

  useEffect(() => {
    if (!session || !profile?.id) return;

    const requestUserId = session.user.id;
    const requestProfileId = profile.id;

    fetch(`${API_BASE_URL}/feedings?snake_id=${encodeURIComponent(requestProfileId)}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then(async (response) => {
        const data = await parseApiResponse(response);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              response,
              data.error || "Nie udało się pobrać historii karmień.",
            ),
          );
        }

        if (
          currentUserIdRef.current !== requestUserId ||
          currentProfileIdRef.current !== requestProfileId
        ) {
          return;
        }

        setHistory(data.data || []);
        setWeightAssessment(data.weightAssessment || defaultWeightAssessment);
      })
      .catch((error) => {
        console.error(error);
        if (
          currentUserIdRef.current !== requestUserId ||
          currentProfileIdRef.current !== requestProfileId
        ) {
          return;
        }
        setHistory([]);
        setWeightAssessment(defaultWeightAssessment);
        setDashboardMessage(
          error.message || "Nie udało się pobrać historii karmień.",
        );
      });
  }, [profile?.id, session]);

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
    currentUserIdRef.current = null;
    setSession(null);
    resetUserScopedState();
    setAuthMessage("");
    setPassword("");
  };

  const saveProfile = async () => {
    setProfileMessage("");

    const missingProfileMessage = buildMissingProfileMessage();

    if (missingProfileMessage) {
      setProfileMessage(missingProfileMessage);
      return;
    }

    const currentWeightNumber = Number(currentWeightG);

    if (currentWeightNumber < MIN_SNAKE_WEIGHT_G) {
      setProfileMessage("Waga jest zbyt niska");
      return;
    }

    if (currentWeightNumber > MAX_SNAKE_WEIGHT_G) {
      setProfileMessage(
        "Waga przekracza realistyczny zakres dla pytona królewskiego",
      );
      return;
    }

    setSavingProfile(true);

    const payload = {
      name: snakeName,
      current_weight_g: currentWeightNumber,
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
        throw new Error(
          getApiErrorMessage(
            response,
            data.error || "Nie udało się zapisać profilu.",
          ),
        );
      }
    } catch (error) {
      console.error(error);
      setSavingProfile(false);
      setProfileMessage(
        error.message || "Nie udało się zapisać profilu. Spróbuj ponownie.",
      );
      return;
    }

    setSavingProfile(false);

    profileFormDirtyRef.current = false;
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
        throw new Error(
          getApiErrorMessage(response, data.error || "Błąd kalkulacji"),
        );
      }

      setResult(data.result);
    } catch (error) {
      console.error(error);
      setDashboardMessage(
        error.message || "Nie udało się obliczyć kolejnego karmienia.",
      );
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
        throw new Error(
          getApiErrorMessage(
            response,
            data.error || "Nie udało się zapisać karmienia",
          ),
        );
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
          <p>Sprawdzanie sesji...</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="auth-page">
        <section className="auth-hero" aria-label="Panel opiekuna węża">
          <p className="eyebrow">Panel opiekuna gada</p>
          <h1>SerpentTrack</h1>
          <p>
            Planuj karmienia, śledź historię i monitoruj kondycję swojego
            pytona w jednym miejscu.
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
              onClick={login}
            >
              Zaloguj
            </button>
            <button
              className="button button--secondary"
              data-testid="login-button-register"
              disabled={!nick || !password}
              onClick={register}
            >
              Zarejestruj
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (profileLoading) {
    return (
      <main className="app-shell app-shell--center">
        <section className="loading-card" aria-live="polite">
          <div className="loading-mark" />
          <p>Ładowanie profilu węża...</p>
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
          {renderTopbarActions("profile")}
        </header>

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
              onClick={saveProfile}
            >
              {savingProfile ? "Zapisywanie..." : "Zapisz profil"}
            </button>

            {isProfileComplete && (
              <button
                className="button button--secondary"
                onClick={() => {
                  profileFormDirtyRef.current = false;
                  applyProfileData(profile);
                  setView("dashboard");
                }}
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
          {renderTopbarActions("registerFeeding")}
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
              onClick={saveFeeding}
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

  if (view === "history") {
    return (
      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Historia</p>
            <h1>Karmienia</h1>
          </div>
          {renderTopbarActions("history")}
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
                      <span>
                        Status: {feedingStatusLabels[item.status] || item.status}
                      </span>
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

        {renderTopbarActions("dashboard")}
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

export default App;
