import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

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
    const { error } = await supabase.auth.signUp({
      email: getFakeEmail(),
      password,
    });

    if (error) return alert(error.message);
    alert("Konto utworzone");
  };

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: getFakeEmail(),
      password,
    });

    if (error) return alert(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setResult(null);
    setView("dashboard");
  };

  const saveProfile = async () => {
    if (!snakeName || !weight || !lastFeedingDate) {
      alert("Uzupełnij imię, wagę i datę ostatniego karmienia");
      return;
    }

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

    if (error) {
      console.error(error);
      alert("Błąd zapisu profilu");
      return;
    }

    setResult(null);
    await fetchProfile();
    setView("dashboard");
  };

  const calculateFeeding = async () => {
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
  };

  const saveFeeding = async () => {
    if (!feedingDate || !feedingSnakeWeight || !mealWeight) {
      alert("Uzupełnij datę karmienia, wagę węża i wagę pokarmu");
      return;
    }

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
      alert("Błąd zapisu karmienia");
      return;
    }

    await supabase
      .from("snake_profiles")
      .update({
        weight: Number(feedingSnakeWeight),
        last_feeding_date: feedingDate,
      })
      .eq("id", profile.id);

    setFeedingSaved(true);
    setResult(null);
    setFeedingDate("");
    setFeedingSnakeWeight("");
    setMealWeight("");

    await fetchProfile();
    await fetchHistory();
  };

  if (loading) return <p style={{ textAlign: "center" }}>Ładowanie...</p>;

  if (!session) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>🐍 Tyson Snake App 🥊</h1>
        <p>Ten wąż nie pyta. Ten wąż planuje karmienie.</p>

        <label>Nick</label>
        <br />
        <input value={nick} onChange={(e) => setNick(e.target.value)} />

        <br />
        <br />

        <label>Hasło</label>
        <br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />
        <br />

        <button onClick={login}>Zaloguj</button>
        <button onClick={register} style={{ marginLeft: 10 }}>
          Zarejestruj
        </button>
      </main>
    );
  }

  if (!isProfileComplete || view === "profile") {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>Profil węża 🐍</h1>
        <p>Uzupełnij dane potrzebne do wyliczenia karmienia.</p>

        <label>Imię węża</label>
        <br />
        <input
          value={snakeName}
          onChange={(e) => setSnakeName(e.target.value)}
        />

        <br />
        <br />

        <label>Waga węża (g)</label>
        <br />
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />

        <br />
        <br />

        <label>Data ostatniego karmienia</label>
        <br />
        <input
          type="date"
          value={lastFeedingDate}
          onChange={(e) => setLastFeedingDate(e.target.value)}
        />

        <br />
        <br />

        <label>Etap</label>
        <br />
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="young">Young</option>
          <option value="adult">Adult</option>
        </select>

        <br />
        <br />

        <label>Kondycja</label>
        <br />
        <select
          value={bodyCondition}
          onChange={(e) => setBodyCondition(e.target.value)}
        >
          <option value="underweight">Za chudy</option>
          <option value="normal">Normalny</option>
          <option value="overweight">Za gruby</option>
        </select>

        <br />
        <br />

        <button onClick={saveProfile}>Zapisz profil</button>

        {isProfileComplete && (
          <button
            onClick={() => setView("dashboard")}
            style={{ marginLeft: 10 }}
          >
            Wróć
          </button>
        )}

        <br />
        <br />
        <button onClick={logout}>Wyloguj</button>
      </main>
    );
  }

  if (view === "registerFeeding") {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>Zarejestruj karmienie 🐁</h1>

        <label>Data karmienia</label>
        <br />
        <input
          type="date"
          value={feedingDate}
          onChange={(e) => setFeedingDate(e.target.value)}
        />

        <br />
        <br />

        <label>Aktualna waga węża (g)</label>
        <br />
        <input
          type="number"
          value={feedingSnakeWeight}
          onChange={(e) => setFeedingSnakeWeight(e.target.value)}
        />

        <br />
        <br />

        <label>Waga pokarmu (g)</label>
        <br />
        <input
          type="number"
          value={mealWeight}
          onChange={(e) => setMealWeight(e.target.value)}
        />

        <br />
        <br />

        <button onClick={saveFeeding}>Zapisz karmienie</button>
        <button onClick={() => setView("dashboard")} style={{ marginLeft: 10 }}>
          Wróć
        </button>

        {feedingSaved && (
          <div style={{ marginTop: 20 }}>
            <p>Karmienie zapisane 🐍</p>
            <button onClick={() => setView("history")}>
              Historia karmienia
            </button>
          </div>
        )}
      </main>
    );
  }

  if (view === "history") {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>Historia karmienia 📜</h1>

        {history.length === 0 ? (
          <p>Brak danych</p>
        ) : (
          <table border="1" cellPadding="8" style={{ margin: "0 auto" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Waga węża</th>
                <th>Waga pokarmu</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{item.feeding_date}</td>
                  <td>{item.snake_weight} g</td>
                  <td>{item.meal_weight} g</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <br />
        <button onClick={() => setView("dashboard")}>Wróć</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, textAlign: "center" }}>
      <div style={{ textAlign: "right" }}>
        <button onClick={() => setView("profile")}>Profil węża</button>
        <button onClick={logout} style={{ marginLeft: 10 }}>
          Wyloguj
        </button>
      </div>

      <h1>Witaj, {profile.name} 🐍</h1>
      <p>Dane kompletne — możesz liczyć karmienie.</p>

      <button onClick={calculateFeeding}>Oblicz datę karmienia</button>

      {result && (
        <section style={{ marginTop: 20 }}>
          <h2>Wynik</h2>
          <p>Rekomendowana waga pokarmu: {result.mealWeight} g</p>
          <p>Najbliższa data karmienia: {result.nextFeedingDate}</p>
          <p>Czy po terminie: {result.isOverdue ? "Tak" : "Nie"}</p>

          {result.isOverdue ? (
            <p style={{ color: "red", fontWeight: "bold" }}>
              ⚠️ Dni po terminie: {result.daysOverdue}
            </p>
          ) : (
            <p>Dni do karmienia: {result.daysLeft}</p>
          )}

          <button onClick={() => setView("registerFeeding")}>
            Zarejestruj karmienie
          </button>
        </section>
      )}

      <br />
      <br />

      <button onClick={() => setView("registerFeeding")}>
        Zarejestruj karmienie
      </button>
      <button onClick={() => setView("history")} style={{ marginLeft: 10 }}>
        Historia karmienia
      </button>
    </main>
  );
}

export default App;
