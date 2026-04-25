import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState(null);

  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");

  const [snakeName, setSnakeName] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [weight, setWeight] = useState("");
  const [stage, setStage] = useState("adult");
  const [lastFeedingDate, setLastFeedingDate] = useState("");
  const [bodyCondition, setBodyCondition] = useState("normal");

  const [result, setResult] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("snake_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(data);
    setWeight(data.weight || "");
    setStage(data.stage || "adult");
    setLastFeedingDate(data.last_feeding_date || "");
    setBodyCondition(data.body_condition || "normal");
    setLoading(false);
  };

  const getFakeEmail = () => `${nick}@snake.local`;

  const register = async () => {
    const { error } = await supabase.auth.signUp({
      email: getFakeEmail(),
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Konto utworzone");
  };

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: getFakeEmail(),
      password,
    });

    if (error) {
      alert(error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const createSnakeProfile = async () => {
    const { error } = await supabase.from("snake_profiles").insert([
      {
        user_id: session.user.id,
        name: snakeName,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Błąd tworzenia profilu");
      return;
    }

    fetchProfile();
  };

  const updateProfile = async () => {
    const { error } = await supabase
      .from("snake_profiles")
      .update({
        weight: Number(weight),
        stage,
        last_feeding_date: lastFeedingDate,
        body_condition: bodyCondition,
      })
      .eq("id", profile.id);

    if (error) {
      console.error(error);
      alert("Błąd update profilu");
      return;
    }

    fetchProfile();
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

  if (!session) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>🐍 Tyson Snake App 🥊</h1>
        <p>Ten wąż nie pyta... ten wąż gryzie pierwszy.</p>

        <label>Nick:</label>
        <br />
        <input
          placeholder="np. mike"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
        />

        <br />
        <br />

        <label>Hasło:</label>
        <br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />
        <br />

        <button onClick={login}>Zaloguj</button>
        <button onClick={register} style={{ marginLeft: "10px" }}>
          Zarejestruj
        </button>
      </div>
    );
  }

  if (loading) {
    return <p style={{ textAlign: "center" }}>Ładowanie...</p>;
  }

  if (!profile) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Nazwij swojego węża 🐍</h1>

        <label>Imię węża:</label>
        <br />
        <input
          placeholder="np. Tyson"
          value={snakeName}
          onChange={(e) => setSnakeName(e.target.value)}
        />

        <br />
        <br />

        <button onClick={createSnakeProfile}>Stwórz profil</button>

        <br />
        <br />

        <button onClick={logout}>Wyloguj</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Witaj, {profile.name} 🐍</h1>

      {!profile.weight || !profile.last_feeding_date ? (
        <div>
          <p>Uzupełnij dane {profile.name}, aby obliczyć datę karmienia</p>

          <label>Waga węża (g):</label>
          <br />
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />

          <br />
          <br />

          <label>Data ostatniego karmienia:</label>
          <br />
          <input
            type="date"
            value={lastFeedingDate}
            onChange={(e) => setLastFeedingDate(e.target.value)}
          />

          <br />
          <br />

          <label>Etap:</label>
          <br />
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="young">Young</option>
            <option value="adult">Adult</option>
          </select>

          <br />
          <br />

          <label>Kondycja:</label>
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

          <button onClick={updateProfile}>Zapisz dane</button>
        </div>
      ) : (
        <p>Dane kompletne — możesz liczyć karmienie</p>
      )}

      <br />

      <button
        disabled={!profile.weight || !profile.last_feeding_date}
        onClick={calculateFeeding}
      >
        Oblicz datę karmienia
      </button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h2>Wynik</h2>
          <p>Porcja: {result.mealWeight} g</p>
          <p>Następne karmienie: {result.nextFeedingDate}</p>
          <p>Czy po terminie: {result.isOverdue ? "Tak" : "Nie"}</p>
          <p>Dni do karmienia: {result.daysLeft}</p>
        </div>
      )}

      <br />
      <br />

      <button onClick={logout}>Wyloguj</button>
    </div>
  );
}

export default App;