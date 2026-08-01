import { useRef, useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";
import {
  defaultWeightAssessment,
  API_BASE_URL,
  MIN_SNAKE_WEIGHT_G,
  MAX_SNAKE_WEIGHT_G,
} from "./constants/labels";
import {
  getApiHeaders,
  parseApiResponse,
  getApiErrorMessage,
} from "./services/apiClient";

import { LoginForm } from "./components/Auth/LoginForm";
import { ProfileForm } from "./components/Profile/ProfileForm";
import { FeedingForm } from "./components/Feeding/FeedingForm";
import { FeedingHistoryTable } from "./components/History/FeedingHistoryTable";
import { Dashboard } from "./components/Dashboard/Dashboard";

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

  const getFeedingTimingLabel = () => {
    if (!result) return "";
    if (result.daysLeft > 0) return `Do karmienia: ${result.daysLeft} dni`;
    if (result.daysOverdue > 0) {
      return `Po terminie: ${result.daysOverdue} dni`;
    }
    if (result.daysLeft === 0) return "Karmienie dzisiaj";
    return "";
  };

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
        headers: getApiHeaders(session.access_token),
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
          headers: getApiHeaders(session.access_token),
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
      headers: getApiHeaders(session.access_token),
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
      headers: getApiHeaders(session.access_token),
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
          headers: getApiHeaders(session.access_token),
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
        headers: getApiHeaders(session.access_token),
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
        headers: getApiHeaders(session.access_token),
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
      <LoginForm
        nick={nick}
        setNick={setNick}
        password={password}
        setPassword={setPassword}
        authMessage={authMessage}
        onLogin={login}
        onRegister={register}
      />
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
      <ProfileForm
        profile={profile}
        snakeName={snakeName}
        setSnakeName={setSnakeName}
        currentWeightG={currentWeightG}
        setCurrentWeightG={setCurrentWeightG}
        lastFeedingDate={lastFeedingDate}
        setLastFeedingDate={setLastFeedingDate}
        lifeStage={lifeStage}
        setLifeStage={setLifeStage}
        bodyCondition={bodyCondition}
        setBodyCondition={setBodyCondition}
        profileMessage={profileMessage}
        savingProfile={savingProfile}
        profileLoading={profileLoading}
        isProfileComplete={isProfileComplete}
        markProfileFormDirty={markProfileFormDirty}
        onSaveProfile={saveProfile}
        onCancel={() => {
          profileFormDirtyRef.current = false;
          applyProfileData(profile);
          setView("dashboard");
        }}
        setView={setView}
        onLogout={logout}
      />
    );
  }

  if (view === "registerFeeding") {
    return (
      <FeedingForm
        feedingDate={feedingDate}
        setFeedingDate={setFeedingDate}
        feedingSnakeWeight={feedingSnakeWeight}
        setFeedingSnakeWeight={setFeedingSnakeWeight}
        mealWeight={mealWeight}
        setMealWeight={setMealWeight}
        feedingMessage={feedingMessage}
        feedingSaved={feedingSaved}
        savingFeeding={savingFeeding}
        profileLoading={profileLoading}
        result={result}
        onSaveFeeding={saveFeeding}
        setView={setView}
        onLogout={logout}
      />
    );
  }

  if (view === "history") {
    return (
      <FeedingHistoryTable
        history={history}
        setView={setView}
        onLogout={logout}
      />
    );
  }

  return (
    <Dashboard
      profile={profile}
      lifeStage={lifeStage}
      bodyCondition={bodyCondition}
      weightAssessment={weightAssessment}
      dashboardMessage={dashboardMessage}
      refusedMealsCount={refusedMealsCount}
      setRefusedMealsCount={setRefusedMealsCount}
      lastMealWeightG={lastMealWeightG}
      setLastMealWeightG={setLastMealWeightG}
      isShedding={isShedding}
      setIsShedding={setIsShedding}
      result={result}
      calculating={calculating}
      profileLoading={profileLoading}
      onCalculateFeeding={calculateFeeding}
      getFeedingTimingLabel={getFeedingTimingLabel}
      setView={setView}
      onLogout={logout}
    />
  );
}

export default App;
