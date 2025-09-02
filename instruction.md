# Agentic Prompt: Simple Realtime Sensor Dashboard (Next.js 15 + Tailwind + Firebase RTDB)

## Goal

Build a **single‑page realtime dashboard** that reads hardware sensor data from **Firebase Realtime Database (RTDB)**, shows **live charts**, **KPI cards**, a **sensor table**, and a **simple alert system** with configurable thresholds—**no authentication**.

---

## Tech (Minimal)

* **Framework:** Next.js 15 (App Router, React Server Components + Client Components where needed)
* **Language:** TypeScript
* **UI:** Tailwind CSS
* **State:** React Context or Zustand (for client‑side reactive state)
* **Charts:** Recharts
* **Forms/Validation:** React Hook Form + Zod (for alert rule config)
* **Data:** Firebase Realtime Database (client SDK only)
* **Animation:** Framer Motion for tasteful micro‑interactions
* **Quality:** ESLint + Prettier

---

## Data Model (assume simple paths)

```
/sensorsLive/{deviceId}/{sensorId} -> { timestamp: number, value: number, status?: 'ok'|'warn'|'critical' }
/alerts/config/{sensorId} -> { threshold: number, op: 'gt'|'lt'|'gte'|'lte', windowSec: number, enabled: boolean }
/alerts/events/{eventId} -> { sensorId, value, triggeredAt, severity: 'warn'|'critical', acknowledged?: boolean }
/metadata/sensors/{sensorId} -> { name, unit, min?: number, max?: number }
```

*(Adjust keys as needed; keep flat & simple.)*

---

## Features

1. **Dashboard (single route)**

   * KPI cards: total sensors, active alerts, last update time
   * **Live Charts** per selected sensor (line/area), auto‑updating from RTDB
   * **Time range picker**: 15m / 1h / 6h / 24h
   * **Sensor table** with status badges and mini‑sparklines
2. **Alerts**

   * Config panel to set per‑sensor threshold (op, value, windowSec, enabled)
   * Realtime evaluation on incoming data (rolling window)
   * In‑app toast + badge when triggered; list recent events; acknowledge toggle

---

## UX/UI

* Clean, airy layout: topbar (title + time range), content grid of cards + chart + table
* Dark mode toggle (optional but simple)
* Motion: subtle card hover, chart mount fade, toast slide‑in
* Responsive: 2‑column on desktop, single column on mobile
* Accessibility: keyboard focus rings, ARIA for toasts and tables

---

## Architecture (Next.js App Router)

```
src/
  app/
    layout.tsx
    page.tsx (DashboardPage)
    globals.css (Tailwind)
  components/
    KpiCard.tsx
    RealtimeChart.tsx
    SensorTable.tsx
    AlertConfigPanel.tsx
  lib/
    firebase.ts (Firebase init)
    rtdb.ts (subscribe/unsubscribe helpers)
    utils.ts (rolling avg, format)
  hooks/
    useLiveSeries.ts
  store/
    sensors.store.ts
    alerts.store.ts
  types/
    sensor.ts
    alert.ts
```

* Use **Server Components** for static layout and metadata
* Use **Client Components** for charts, tables, realtime data, alerts
* State logic kept minimal with Zustand/Context

---

## Key Implementation Notes

* **RTDB listeners:** use `onValue`/`onChildAdded`; detach on unmount
* **Update throttling:** buffer updates and paint at \~250ms cadence to avoid jank
* **Rolling window:** keep ring buffer of `{t, v}` points for current range
* **Alert logic:** pure function `(series, rule) => Trigger | null` with hysteresis (5%)
* **Local persistence:** keep alert configs in RTDB; fallback to localStorage if offline

---

## Minimal Env

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Acceptance Criteria

* Chart updates live from RTDB with smooth transitions and no dropped frames
* Alert triggers when rule condition is met over rolling window; toast appears; event logged
* KPI cards and sensor table reflect current statuses
* Pass basic axe checks; no console errors

---

## Steps to Implement (Do This Now)

1. **Scaffold:** `npx create-next-app@latest simple-dashboard --ts --use-pnpm`
2. **Add deps:** `pnpm i firebase zustand recharts react-hook-form zod framer-motion`
3. **Tailwind:** install & configure; dark mode via `class`
4. **Firebase:** `firebase.ts` init from env; `rtdb.ts` for typed `subscribeSensor(sensorId)`
5. **State:** `sensors.store.ts` for series buffers; `alerts.store.ts` for rules + events
6. **UI:** `page.tsx` (DashboardPage) with KPI cards, `RealtimeChart`, `SensorTable`, `AlertConfigPanel`
7. **Logic:** implement `useLiveSeries` & alert evaluation util + toasts
8. **Polish:** motion, loading skeletons, error/empty states

---

## Code Stubs to Generate

* `src/lib/firebase.ts` (init with env)
* `src/lib/rtdb.ts` (subscribe helpers)
* `src/hooks/useLiveSeries.ts` (buffer & range)
* `src/store/alerts.store.ts` (rules + events)
* `src/components/AlertConfigPanel.tsx` (RHF+Zod form)
* `src/components/RealtimeChart.tsx` (Recharts line)
* `src/app/page.tsx` (single‑page dashboard)

---

**Produce the code now**: create the Next.js 15 project structure and fill these files so the app runs with `pnpm dev` given valid Firebase env values. Keep it simple—no auth, one dashboard page, clean animations.
