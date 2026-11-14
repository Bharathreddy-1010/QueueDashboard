# QueuePro — Real-Time Queue Management System

![QueuePro Dashboard](https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80)

**QueuePro** is a modern, high-performance, full-stack Queue Management System (QMS) engineered for enterprise customer operations, hospital triage, retail checkouts, and service center dispatch. Built from the ground up with **React**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB/Mongoose**, and **Socket.IO**, QueuePro delivers sub-millisecond atomic dispatch operations, real-time WebSocket synchronization across multiple active clients, and audit-grade analytics calculated from actual database records.

---

## 🎨 Official Design System

QueuePro adheres strictly to the 70 / 20 / 10 UI hierarchy:

| Usage | Color | Hex Code | Visual Application |
|---|---|---|---|
| **Primary** | Dark Canvas | `#050606` (70%) | Main application background, persistent sidebar, navigation bar, dark analytics panels |
| **Secondary** | Warm Alabaster | `#F5F3EF` (20%) | High-contrast dashboard metric cards, queue data tables, form panels, modal dialogs |
| **Accent** | Neon Lime | `#C8FF00` (10%) | Primary action triggers (**Serve Next**, **Add Person**), active navigation states, selected tabs, key chart highlights |

---

## ✨ Key Capabilities & Features

### 1. Operations Dashboard
- **Executive Metric Cards**:
  - **Total in Queue**: Real-time count of waiting customers with period-over-period variance badges.
  - **Average Waiting Time**: Live-calculated wait duration (`calledAt - createdAt`) formatted into readable minutes and seconds.
  - **People Served Today**: Completed transaction throughput.
  - **Queue Efficiency**: Percentage ratio of successfully completed tickets vs total handled.
- **Active Service Desk Banner**: Displays currently serving customer, token number, customer phone, and a **live-ticking service duration timer**.
- **Prominent "Serve Next" Dispatch**: Atomically pulls the next waiting customer to the service desk.
- **Queue Overview Table**: Live tabular overview featuring real-time waiting timers, position badges, and reordering controls.
- **Embedded Analytics Preview**: Recharts AreaChart for queue volume timeline and DonutChart for token status distribution.

### 2. Multi-Queue Management
- Create, edit, pause, and delete service queues.
- Configurable token prefixes (e.g., `T` for General, `VIP` for Priority, `TECH` for Support).
- Instant activate/deactivate toggle to pause incoming tokens during breaks or shift rotations.
- Cascading clean deletion of associated tokens and queue telemetry.

### 3. Concurrency-Safe Token Lifecycle
- **Add Customer**: Automatically assigns monotonically increasing token numbers (`T001`, `T002`, `T003`) and assigns next position in line.
- **Move Token Up / Down**: Change the priority order of waiting customers with strict boundary enforcement (cannot move above `#1` or below the last position).
- **Atomic "Serve Next"**: Uses atomic MongoDB `findOneAndUpdate` operators to completely eliminate race conditions and double-serving when multiple managers click simultaneously.
- **Complete Service**: Records precise `completedAt` timestamps and records service duration.
- **Token Cancellation**: Confirmation modal with cancellation reasons, automatic re-compaction of queue positions, and strict exclusion from served metrics.

### 4. Real-Time Socket.IO Synchronization
- Live bidirectional updates via WebSockets for:
  - `queue:token_added`
  - `queue:token_moved`
  - `queue:token_served`
  - `queue:token_completed`
  - `queue:token_cancelled`
  - `queue:updated`
- Multi-client synchronization: Changes made by one manager instantly reflect across all other connected terminals without manual page reloads.
- Authenticated WebSocket handshake validating JWT tokens.

### 5. Audit-Grade Analytics & Reporting
- Dedicated Analytics Dashboard supporting:
  - **Today**
  - **Last 7 Days**
  - **Last 30 Days**
  - **Custom Date Range**
- Queue filtering: Filter across All Queues or isolate a specific queue station.
- Interactive Visualizations:
  - **Customer Throughput**: Hourly/daily bar chart of completed customers.
  - **Queue Length Timeline**: Area chart tracing queue volume over time based on immutable `QueueEvent` records.
  - **Average Wait Time Trend**: Line chart tracking wait duration in minutes.
  - **Token Status Breakdown**: High-contrast donut distribution chart.

### 6. Multi-Tenant Manager Security
- JWT-based authentication with bcrypt-hashed passwords.
- Manager isolation: Managers can only access and modify queues belonging to their account.
- Protected frontend client routes and backend API middleware.

---

## 🛠 Technology Stack

### Frontend (`/client`)
- **React 18** & **Vite 6**
- **Tailwind CSS 3** with custom theme tokens
- **React Router DOM 6**
- **Axios** with global interceptors
- **Socket.IO Client**
- **Recharts 2** for responsive SVG data visualizations
- **Lucide React** for modern iconography
- **React Hot Toast** for operational notifications

### Backend (`/server`)
- **Node.js** & **Express 4**
- **MongoDB** & **Mongoose 8**
- **Embedded MongoMemoryServer** (Zero-configuration fallback: runs out-of-the-box on any machine without needing a pre-installed MongoDB service)
- **Socket.IO 4** with authenticated room management
- **JSON Web Tokens (JWT)** & **bcryptjs**
- **Zod** schema validation for all incoming request bodies and query parameters
- **Morgan** HTTP request logger

---

## 📂 Project Structure

```
Queue Dashboard/
├── client/                      # Frontend Single Page Application
│   ├── src/
│   │   ├── api/                 # Axios API service modules
│   │   │   ├── client.js
│   │   │   ├── authApi.js
│   │   │   ├── queueApi.js
│   │   │   ├── tokenApi.js
│   │   │   └── analyticsApi.js
│   │   ├── components/          # Reusable UI component library
│   │   │   ├── common/          # Button, Modal, Badge, Card, Input, Skeletons
│   │   │   ├── layout/          # Sidebar, Header, MainLayout
│   │   │   ├── dashboard/       # MetricCard, CurrentServingBanner, OverviewTable
│   │   │   ├── queues/          # CreateQueueModal, EditQueueModal
│   │   │   └── tokens/          # AddTokenModal, CancelTokenModal
│   │   ├── context/             # AuthContext, SocketContext
│   │   ├── hooks/               # useLiveTimer custom hook
│   │   ├── pages/               # Login, Dashboard, Queues, QueueDetails, Analytics, Settings, Profile
│   │   ├── routes/              # ProtectedRoute wrapper
│   │   ├── utils/               # Formatters, status maps, timer utilities
│   │   ├── App.jsx              # Application router & toast provider
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Tailwind directives & glow utilities
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # Backend REST API & Real-time Server
│   ├── src/
│   │   ├── config/              # MongoDB connection & environment configuration
│   │   ├── controllers/         # authController, queueController, tokenController, analyticsController
│   │   ├── middleware/          # auth, validate, errorHandler
│   │   ├── models/              # User, Queue, Token, QueueEvent schemas
│   │   ├── routes/              # authRoutes, queueRoutes, tokenRoutes, analyticsRoutes
│   │   ├── scripts/             # seed.js (Demo accounts, queues, sample tokens)
│   │   ├── services/            # queueService (atomic operations), analyticsService
│   │   ├── sockets/             # socketManager (rooms, broadcasts, authentication)
│   │   ├── tests/               # run-all-tests.js, socket-test.js
│   │   ├── validators/          # Zod validation schemas
│   │   └── app.js               # Express application initialization
│   ├── server.js                # Server entry point (HTTP + Socket.IO)
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── .env.example
├── package.json                 # Root script runner (concurrently)
└── README.md
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

*(Note: An external MongoDB instance is **optional**. If `MONGODB_URI` is not provided in your `.env`, QueuePro automatically starts an embedded, high-performance in-memory MongoDB instance with full BSON and index support).*

### 1. Clone & Install Dependencies
Run the root setup command to install dependencies across the root, backend, and frontend:

```bash
npm run setup
```

Or manually:
```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in both root and server directories:

```bash
cp server/.env.example server/.env
```

**Default Environment Variables (`server/.env`):**
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=
JWT_SECRET=queuepro-super-secret-jwt-key-development-2025
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Server
Start both the backend server and the frontend client concurrently with a single command:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)
- **Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

*(On startup, QueuePro automatically checks if the database is fresh and auto-seeds the demo managers, queues, and ticket history!)*

---

## 👤 Demo Login Credentials

The application comes pre-seeded with two demo manager accounts to test multi-tenancy:

| Account | Email | Password | Role | Description |
|---|---|---|---|---|
| **Demo Manager 1** | `manager@queuepro.com` | `Password123!` | Manager | Primary demo manager with 4 active queues, waiting customers, and complete analytics history |
| **Demo Manager 2** | `sarah@queuepro.com` | `Password123!` | Manager | Secondary manager used to test queue data isolation |

*(Quick-fill buttons are provided on the login page for one-click access during evaluations).*

---

## 🧪 Automated Testing & QA Verification

QueuePro includes an automated test suite verifying all 14 business-critical requirements plus real-time multi-client WebSockets:

Run the full test suite from the root directory:
```bash
npm test
```

### Test Coverage Summary:
- **Authentication**: Valid login, bad password rejection (401), session token verification.
- **Multi-Tenancy**: Verified that Manager 2 (Sarah) is blocked (404) from viewing or modifying Manager 1's queues.
- **Queue Operations**: Creating new queues, updating status, cascade deletion.
- **Token Generation**: Monotonically increasing prefix numbers (`T001`, `T002`), initial queue positioning.
- **Boundary Checks**: Moving token `#1` up is rejected (400); moving bottom token down is rejected (400).
- **Position Swapping**: Moving token `#2` up correctly swaps `#1` and `#2` and persists order.
- **Atomic Dispatch**: "Serve Next" atomically acquires the first waiting token, marks it `IN_SERVICE`, records `calledAt`, and compacts remaining positions.
- **Service Completion**: Records `completedAt`, calculates duration, and updates analytics.
- **Token Cancellation**: Cancellation reason capture, queue re-compaction, exclusion from served counts.
- **Analytics Calculations**: Verified waiting times, service duration, and throughput metrics.
- **Socket.IO Real-Time Dispatch**: Two concurrent WebSocket clients verify instant delivery of `queue:token_added`, `queue:token_served`, and `queue:token_completed`.

---

## 📡 REST API Documentation

### Authentication
- `POST /api/auth/login` — Sign in with email and password. Returns JWT token.
- `POST /api/auth/register` — Register a new manager account.
- `GET /api/auth/me` — Retrieve the currently authenticated manager session.
- `PATCH /api/auth/profile` — Update manager name, email, or change password.
- `POST /api/auth/logout` — Terminate session.

### Queues
- `GET /api/queues` — List all queues belonging to the authenticated manager with real-time waiting/in-service counts.
- `POST /api/queues` — Create a new service queue (`name`, `description`, `prefix`).
- `GET /api/queues/:id` — Retrieve queue details, summary counts, and currently serving token.
- `PATCH /api/queues/:id` — Update queue name, description, status (`ACTIVE` / `INACTIVE`), or prefix.
- `DELETE /api/queues/:id` — Delete queue and cascade-remove all associated tokens and events.

### Tokens
- `GET /api/queues/:id/tokens` — List tokens for a queue with status filter (`ALL`, `WAITING`, `IN_SERVICE`, `COMPLETED`, `CANCELLED`) and search.
- `POST /api/queues/:id/tokens` — Issue a new token (`customerName`, `phoneNumber`).
- `PATCH /api/tokens/:id/move` — Reorder waiting token (`direction`: `'up'` | `'down'` | `'top'` | `'bottom'`).
- `POST /api/queues/:id/serve-next` — Concurrency-safe atomic dispatch of next waiting customer.
- `POST /api/tokens/:id/complete` — Mark in-service token as `COMPLETED`.
- `POST /api/tokens/:id/cancel` — Cancel waiting or in-service token with confirmation `reason`.

### Analytics
- `GET /api/analytics/overview` — Aggregated metrics and Recharts time-series data across all manager queues. Supports `?range=today|7d|30d|custom&startDate=...&endDate=...`.
- `GET /api/queues/:id/analytics` — Analytics scoped to a specific queue station.

---

## 🛡️ Concurrency & Fault Tolerance

1. **Race-Condition Prevention**: The "Serve Next" operation executes an atomic MongoDB `findOneAndUpdate` query with `{ status: 'WAITING' }`. Even if two managers click "Serve Next" at the exact same millisecond, only one thread can acquire the document.
2. **Monotonic Counter**: Token numbers are incremented atomically via `$inc: { nextTokenNumber: 1 }` on the Queue document.
3. **Continuous Re-indexing**: Whenever a token leaves the waiting line (served, cancelled, or deleted), the remaining waiting tokens are recompacted via a fast bulk write operation to maintain a continuous `1..N` sequence.
4. **Resilient Database Fallback**: If an external MongoDB server is unavailable or not configured, the system automatically spins up an embedded `MongoMemoryServer`, allowing developers to clone and run the application instantly without setup friction.

---

## 📄 License
This project is open-source and available under the **MIT License**.
