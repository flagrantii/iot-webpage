# Security Monitoring System (IoT Webpage)

## Overview
This project is a real-time security monitoring dashboard designed to visualize data from various IoT sensors (ESP32, Raspberry Pi). It allows security personnel to monitor environmental conditions and security breaches in real-time, with an integrated alert system.

## Key Features
- **Real-time Monitoring**: Live data updates from Firebase Realtime Database.
- **Interactive Charts**:
    - Detailed single-sensor analysis with configurable time ranges (15m, 1h, 6h, 24h).
    - Multi-sensor overview to compare data across different zones.
- **Alert System**:
    - Configurable thresholds for each sensor.
    - Visual alerts (status indicators, counters) when thresholds are breached.
- **Sensor Management**:
    - KPI Cards displaying system health, online sensor count, and active alerts.
    - Detailed sensor table with status badges and sparklines.
- **Security Focus**: Specialized monitoring for:
    - Perimeter Lighting
    - Smoke Detection
    - Audio Monitoring
    - Shaking/Entry Detection
    - Fire Detection

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Firebase Realtime Database
- **Visualization**: Recharts
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (or npm/yarn)
- A Firebase project with Realtime Database enabled

### Installation
1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    pnpm install
    ```
3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory with your Firebase credentials:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    ```
4.  **Run the development server**:
    ```bash
    pnpm dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & layouts
│   ├── page.tsx          # Main Dashboard
│   └── layout.tsx        # Root layout
├── components/           # Reusable UI components
│   ├── AlertConfigPanel.tsx  # Alert threshold configuration
│   ├── KpiCard.tsx           # Key Performance Indicator cards
│   ├── RealtimeChart.tsx     # Single sensor line chart
│   ├── MultiSensorCharts.tsx # Grid of all sensor charts
│   └── SensorTable.tsx       # Data table with status
├── hooks/                # Custom React hooks
│   ├── useLiveSeries.ts      # Single sensor data subscription
│   └── useMultiSensorLive.ts # Multi-sensor data subscription
├── lib/                  # Utilities & Configuration
│   ├── firebase.ts       # Firebase initialization
│   └── rtdb.ts           # Database interaction helpers
├── store/                # Global state (Zustand)
│   └── alerts.store.ts   # Alert rules and events state
└── types/                # TypeScript definitions
```

