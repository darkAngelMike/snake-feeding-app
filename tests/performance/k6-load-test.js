import http from "k6/http";
import { check, sleep } from "k6";

// Opcje konfiguracji obciążenia (Scenariusz Ramping VUs)
export const options = {
  stages: [
    { duration: "10s", target: 5 },  // Wzrost obciążenia do 5 użytkowników
    { duration: "20s", target: 20 }, // Szczytowe obciążenie 20 jednoczesnych hodowców
    { duration: "10s", target: 0 },  // Stopniowe wygaszanie
  ],
  thresholds: {
    // 95% zapytań HTTP musi odpowiedzieć w czasie poniżej 500 ms
    http_req_duration: ["p(95)<500"],
    // Wskaźnik nieudanych zapytań musi być niższy niż 1%
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.API_BASE_URL || "http://localhost:3000";

export default function () {
  // Scenariusz 1: Kalkulacja żywieniowa dla pytona królewskiego (POST /calculate)
  const calculatePayload = JSON.stringify({
    snake_id: "k6-test-snake-uuid",
    last_successful_feeding_date: "2026-04-01",
    weight_g: 1200,
    life_stage: "adult",
    body_condition: "normal",
    refused_meals_count: 0,
    is_shedding: false,
    last_meal_weight_g: 100,
  });

  const calculateParams = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const calculateRes = http.post(
    `${BASE_URL}/calculate`,
    calculatePayload,
    calculateParams,
  );

  check(calculateRes, {
    "Kalkulator HTTP status 200": (r) => r.status === 200,
    "Kalkulator zwraca sugerowaną datę": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body.result && body.result.nextFeedingDate);
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);

  // Scenariusz 2: Pobranie struktury i statusu serwera (GET /)
  const rootRes = http.get(`${BASE_URL}/`);

  check(rootRes, {
    "Strona główna HTTP status 200": (r) => r.status === 200,
  });

  sleep(1);
}
