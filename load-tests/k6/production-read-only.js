import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";

const API_URL = __ENV.API_URL || "https://backend.knowalledge.in/api/v1";
const PROFILE = __ENV.PROFILE || "smoke";
const USER_EMAIL = __ENV.LOAD_TEST_USER_EMAIL;
const USER_PASSWORD = __ENV.LOAD_TEST_USER_PASSWORD;
const flowDuration = new Trend("browse_flow_duration", true);

const profiles = {
  smoke: [{ duration: "1m", target: 2 }, { duration: "30s", target: 0 }],
  baseline: [{ duration: "2m", target: 10 }, { duration: "5m", target: 10 }, { duration: "1m", target: 0 }],
  load: [{ duration: "2m", target: 10 }, { duration: "3m", target: 25 }, { duration: "5m", target: 50 }, { duration: "2m", target: 0 }],
  stress: [{ duration: "2m", target: 25 }, { duration: "3m", target: 50 }, { duration: "3m", target: 75 }, { duration: "2m", target: 100 }, { duration: "2m", target: 0 }],
};

if (!profiles[PROFILE]) throw new Error(`Unknown PROFILE: ${PROFILE}`);

export const options = {
  scenarios: { browser_journey: { executor: "ramping-vus", stages: profiles[PROFILE], gracefulRampDown: "30s" } },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
    browse_flow_duration: ["p(95)<5000"],
  },
  userAgent: "KnowAllEdge-authorized-load-test/1.0",
};

function get(path, params = {}) {
  return http.get(`${API_URL}${path}`, { tags: { endpoint: path }, ...params });
}

export function setup() {
  // A dedicated non-admin test account is optional. Supplying it exercises the
  // authenticated read path; no test request changes business data.
  if (!USER_EMAIL || !USER_PASSWORD) return { token: null };
  const response = http.post(`${API_URL}/user/signin`, JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }), {
    headers: { "Content-Type": "application/json" }, tags: { endpoint: "/user/signin" },
  });
  check(response, { "test-account login succeeded": (r) => r.status === 200 && !!r.json("data.token") });
  return { token: response.json("data.token") };
}

export default function (data) {
  const startedAt = Date.now();
  group("public browsing", () => {
    const responses = http.batch([
      ["GET", `${API_URL}/superAdmin/topics`, null, { tags: { endpoint: "/superAdmin/topics" } }],
      ["GET", `${API_URL}/superAdmin/news`, null, { tags: { endpoint: "/superAdmin/news" } }],
      ["GET", `${API_URL}/superAdmin/event`, null, { tags: { endpoint: "/superAdmin/event" } }],
      ["GET", `${API_URL}/superAdmin/trivia`, null, { tags: { endpoint: "/superAdmin/trivia" } }],
      ["GET", `${API_URL}/school/getSchool`, null, { tags: { endpoint: "/school/getSchool" } }],
    ]);
    check(responses, { "public endpoints return 2xx": (rs) => rs.every((r) => r.status >= 200 && r.status < 300) });
  });

  if (data.token) {
    group("authenticated read-only browsing", () => {
      const params = { headers: { Authorization: `Bearer ${data.token}` } };
      const feed = get("/user/feed?limit=20", params);
      const saved = get("/user/saved-news", params);
      const score = get("/user/getScore", params);
      check([feed, saved, score], { "authenticated endpoints return 2xx": (rs) => rs.every((r) => r.status >= 200 && r.status < 300) });
    });
  }

  flowDuration.add(Date.now() - startedAt);
  sleep(1 + Math.random() * 2);
}
