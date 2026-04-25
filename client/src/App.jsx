import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [snakeName, setSnakeName] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
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
    setLoading(false);
  };

  const register = async () => {
    const { error } = await supabase.auth.signUp({
      email,
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
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
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

  // 🔥 NIEZALOGOWANY
  if (!session) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>🐍 Tyson Snake App 🥊</h1>
        <p>Ten wąż nie pyta... ten wąż gryzie pierwszy.</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br /><br />

        <button onClick={login}>Zaloguj</button>
        <button onClick={register} style={{ marginLeft: "10px" }}>
          Zarejestruj
        </button>
      </div>
    );
  }

  // 🔄 ŁADOWANIE
  if (loading) {
    return <p style={{ textAlign: "center" }}>Ładowanie...</p>;
  }

  // 🐍 BRAK PROFILU
  if (!profile) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Nazwij swojego węża 🐍</h1>

        <input
          placeholder="Imię węża (np. Tyson)"
          value={snakeName}
          onChange={(e) => setSnakeName(e.target.value)}
        />

        <br /><br />

        <button onClick={createSnakeProfile}>
          Stwórz profil
        </button>

        <br /><br />
        <button onClick={logout}>Wyloguj</button>
      </div>
    );
  }

  // 🧠 DASHBOARD
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Witaj, {profile.name} 🐍</h1>

      {!profile.weight ? (
        <p>
          Uzupełnij dane {profile.name}, aby obliczyć datę karmienia
        </p>
      ) : (
        <p>Dane kompletne — możesz liczyć karmienie</p>
      )}

      <br />
      <button disabled={!profile.weight}>
        Oblicz datę karmienia
      </button>

      <br /><br />
      <button onClick={logout}>Wyloguj</button>
    </div>
  );
}

export default App;