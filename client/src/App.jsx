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

  // 🔥 feeding form
  const [feedingDate, setFeedingDate] = useState("");
  const [feedingSnakeWeight, setFeedingSnakeWeight] = useState("");
  const [mealWeight, setMealWeight] = useState("");

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

  const saveFeeding = async () => {
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

    alert("Karmienie zapisane 🐍");
    fetchProfile();
  };

  // 🔐 LOGIN
  if (!session) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>🐍 Tyson Snake App 🥊</h1>
        <p>Ten wąż nie pyta... ten wąż gryzie pierwszy.</p>

        <label>Nick:</label>
        <br />
        <input value={nick} onChange={(e) => setNick(e.target.value)} />

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
        <button onClick={register}>Zarejestruj</button>
      </div>
    );
  }

  if (loading) return <p>Ładowanie...</p>;

  if (!profile) {
    return (
      <div style={{ textAlign: "center" }}>
        <h1>Nazwij swojego węża 🐍</h1>

        <input
          value={snakeName}
          onChange={(e) => setSnakeName(e.target.value)}
        />

        <br />
        <br />

        <button onClick={createSnakeProfile}>Stwórz profil</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>{profile.name} 🐍</h1>

      <button onClick={calculateFeeding}>Oblicz karmienie</button>

      {result && (
        <div>
          <p>Porcja: {result.mealWeight} g</p>
          <p>Następne karmienie: {result.nextFeedingDate}</p>

          {result.isOverdue ? (
            <p style={{ color: "red" }}>
              Po terminie: {result.daysOverdue} dni
            </p>
          ) : (
            <p>Dni do karmienia: {result.daysLeft}</p>
          )}
        </div>
      )}

      <hr />

      <h2>Zarejestruj karmienie</h2>

      <input type="date" onChange={(e) => setFeedingDate(e.target.value)} />
      <br />
      <input
        placeholder="waga węża"
        onChange={(e) => setFeedingSnakeWeight(e.target.value)}
      />
      <br />
      <input
        placeholder="waga pokarmu"
        onChange={(e) => setMealWeight(e.target.value)}
      />
      <br />

      <button onClick={saveFeeding}>Zapisz karmienie</button>

      <br />
      <br />
      <button onClick={logout}>Wyloguj</button>
    </div>
  );
}

export default App;
