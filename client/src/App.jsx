import { useState } from "react";

function App() {
  const [feedingDate, setFeedingDate] = useState("");
  const [weight, setWeight] = useState("");
  const [stage, setStage] = useState("adult");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(
      "https://snake-backend-kb14.onrender.com/calculate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedingDate,
          weight: Number(weight),
          stage,
        }),
      },
    );

    const data = await response.json();
    setResult(data.result);
    fetchHistory();
  };

  const fetchHistory = async () => {
    const response = await fetch(
      "https://snake-backend-kb14.onrender.com/history",
    );
    const data = await response.json();
    setHistory(data);
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Snake Feeding App 🐍</h1>

      <form onSubmit={handleSubmit}>
        <label>Data karmienia:</label>
        <br />
        <input
          type="date"
          value={feedingDate}
          onChange={(e) => setFeedingDate(e.target.value)}
        />

        <br />
        <br />

        <label>Waga węża (g):</label>
        <br />
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />

        <br />
        <br />

        <label>Etap:</label>
        <br />
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="adult">Adult</option>
          <option value="young">Young</option>
        </select>

        <br />
        <br />

        <button type="submit">Oblicz</button>
      </form>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h2>Wynik</h2>
          <p>Porcja: {result.mealWeight} g</p>
          <p>Następne karmienie: {result.nextFeedingDate}</p>
          <p>Czy po terminie: {result.isOverdue ? "Tak" : "Nie"}</p>
          <p>Dni do karmienia: {result.daysLeft}</p>
        </div>
      )}

      <hr />

      <button onClick={fetchHistory}>Pokaż historię</button>

      {history.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2>Historia karmień</h2>

          <table border="1" cellPadding="8" style={{ margin: "0 auto" }}>
            <thead>
              <tr>
                <th>Data karmienia</th>
                <th>Waga węża</th>
                <th>Porcja</th>
                <th>Następne karmienie</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={index}>
                  <td>{item.feedingdate}</td>
                  <td>{item.weight} g</td>
                  <td>{item.mealweight} g</td>
                  <td>{item.nextfeedingdate}</td>
                  <td>{item.isoverdue ? "🔴 Po terminie" : "🟢 OK"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
