# Authorized API load testing

This suite is intentionally read-only. It tests the API routes the PWA uses for normal browsing and never sends signup, email, upload, saved-news toggle, quiz-submit, or admin write requests.

## Prerequisites

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) on the load-generator machine. Use a dedicated, non-admin test account for authenticated coverage; never put its password in source control.

Obtain written approval for the target URL, maintenance window, maximum profile, and AWS alert contacts before executing `load` or `stress` against production. Start with smoke, then baseline, then load. Stop immediately if customer traffic or AWS alarms are affected.

## Execute

From `KnowAlledge-Backend`:

```bash
mkdir -p load-tests/results
API_URL=https://backend.knowalledge.in/api/v1 PROFILE=smoke \
  k6 run --summary-export=load-tests/results/smoke-summary.json load-tests/k6/production-read-only.js

# Optional authenticated read-only coverage
API_URL=https://backend.knowalledge.in/api/v1 PROFILE=baseline \
LOAD_TEST_USER_EMAIL=test-user@example.com LOAD_TEST_USER_PASSWORD='stored-outside-git' \
  k6 run --summary-export=load-tests/results/baseline-summary.json load-tests/k6/production-read-only.js

node load-tests/render-report.mjs load-tests/results/baseline-summary.json
```

Profiles: `smoke` peaks at 2 VUs, `baseline` at 10, `load` at 50, and `stress` at 100. A VU is one concurrent virtual browser journey, not a unique registered account. Because a single test account may serve all VUs, the report must state that credential-sharing limitation.

The report generator marks a run as pass only at <1% failed requests and p95 <1.5 seconds. Add AWS load-balancer, compute, MongoDB, and application-log evidence to the generated report before giving it to the client.

## Real active-user API

After deploying both applications, an authenticated superadmin can call:

```text
GET /api/v1/superAdmin/user-activity?windowMinutes=5
```

It returns current 5-minute active users, DAU, WAU, registered users, and the exact measurement time. Counts start accumulating only after the frontend heartbeat deployment; they do not retroactively estimate historical activity.
