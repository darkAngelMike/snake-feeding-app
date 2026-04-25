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

  const [feedingDate, setFeedingDate] = useState("");
  const [feedingSnakeWeight, setFeedingSnakeWeight] = useState("");
  const [mealWeight, setMealWeight] = useState("");

  const [history, setHistory] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
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

  useEffect(() => {
    if (profile) {
      fetchHistory();
    }
  }, [profile]);

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

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("feedings")
      .select("*")
      .eq("snake_id", profile.id)
      .order("feeding_date", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setHistory(data);
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
    setProfile(null);
    setResult(null);
  };

  const createSnakeProfile = async () => {
    if (!snakeName) {
      alert("Podaj imię węża");
      return;
    }

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
    if (!weight || !lastFeedingDate) {
      alert("Uzupełnij dane");
      return;
    }

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

    setResult(null);
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
    if (!feedingDate || !feedingSnakeWeight || !mealWeight) {
      alert("Uzupełnij dane");
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
      alert("Błąd zapisu");
      return;
    }

    await supabase
      .from("snake_profiles")
      .update({
        weight: Number(feedingSnakeWeight),
        last_feeding_date: feedingDate,
      })
      .eq("id", profile.id);

    alert("Zapisano 🐍");

    setFeedingDate("");
    setFeedingSnakeWeight("");
    setMealWeight("");
    setResult(null);

    fetchProfile();
    fetchHistory();
  };

  const isProfileComplete = profile?.weight && profile?.last_feeding_date;

  if (loading) return <p>Ładowanie...</p>;

  if (!session) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h1>🐍 Tyson Snake App 🥊</h1>

        <input
          placeholder="nick"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />
        <br />
        <button onClick={login}>Login</button>
        <button onClick={register}>Register</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center" }}>
        <h1>Nazwij węża</h1>
        <input
          value={snakeName}
          onChange={(e) => setSnakeName(e.target.value)}
        />
        <br />
        <br />
        <button onClick={createSnakeProfile}>OK</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h1>{profile.name}</h1>

      {!isProfileComplete && (
        <>
          <p>Uzupełnij profil</p>

          <input
            placeholder="waga"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <br />
          <input
            type="date"
            value={lastFeedingDate}
            onChange={(e) => setLastFeedingDate(e.target.value)}
          />

          <br />
          <br />
          <button onClick={updateProfile}>Zapisz</button>
        </>
      )}

      {isProfileComplete && (
        <>
          <button onClick={calculateFeeding}>Oblicz</button>

          {result && (
            <div>
              <p>{result.mealWeight} g</p>
              <p>{result.nextFeedingDate}</p>

              {result.isOverdue ? (
                <p style={{ color: "red" }}>
                  {result.daysOverdue} dni po terminie
                </p>
              ) : (
                <p>{result.daysLeft} dni</p>
              )}
            </div>
          )}

          {result && (
            <>
              <h3>Karmienie</h3>

              <input
                type="date"
                value={feedingDate}
                onChange={(e) => setFeedingDate(e.target.value)}
              />
              <br />
              <input
                placeholder="waga węża"
                value={feedingSnakeWeight}
                onChange={(e) => setFeedingSnakeWeight(e.target.value)}
              />
              <br />
              <input
                placeholder="waga pokarmu"
                value={mealWeight}
                onChange={(e) => setMealWeight(e.target.value)}
              />

              <br />
              <button onClick={saveFeeding}>Zapisz</button>
            </>
          )}

          <hr />

          <h3>Historia</h3>

          {history.length === 0 ? (
            <p>Brak danych</p>
          ) : (
            <table border="1" style={{ margin: "0 auto" }}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Waga</th>
                  <th>Pokarm</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.feeding_date}</td>
                    <td>{h.snake_weight}</td>
                    <td>{h.meal_weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <br />
      <br />
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default App;
