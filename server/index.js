const { calculateFeeding } = require("./services/feedingService");
const express = require("express");
const { saveFeeding, getHistory } = require("./services/historyService");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*"
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Snake app działa 🐍");
});

app.post("/calculate", (req, res) => {
  try {
    const result = calculateFeeding(req.body);

    saveFeeding({
      ...req.body,
      ...result.result,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

app.get("/history", async (req, res) => {
  try {
    const history = await getHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Błąd pobierania historii" });
  }
});

app.listen(3000, () => {
  console.log("Server działa na porcie 3000");
});
