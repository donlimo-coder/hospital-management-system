# 🏥 Hospital Management System

A full-stack MVP: role-based auth (admin/doctor/patient), doctor & patient
management, appointment booking with double-booking prevention, consultation
notes/prescriptions, and billing.

## Stack
- **Frontend:** React (Vite) + React Router + Axios
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt, role-based middleware

## Project Structure
```
hospital-management/
├── server/          # Express API
│   ├── config/       # db connection, seed script
│   ├── controllers/  # business logic
│   ├── middleware/   # auth, error handling
│   ├── models/       # User, Doctor, Patient, Appointment, Bill
│   ├── routes/
│   └── server.js
└── client/          # React app
    └── src/
        ├── components/  # Navbar, ProtectedRoute
        ├── context/     # AuthContext
        ├── pages/       # Home, Login, Register, Dashboard, BookAppointment
        └── services/    # axios instance
```

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — point at a local MongoDB (`mongodb://127.0.0.1:27017/hospital_management`)
  or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.
- `JWT_SECRET` — any long random string.

Load demo data (2 doctors, 1 patient, 1 admin):
```bash
npm run seed
```

Start the API:
```bash
npm run dev      # with nodemon, auto-restarts
# or
npm start
```
API runs on `http://localhost:5000`. Health check: `GET /api/health`.

**Demo logins after seeding:**
| Role    | Email               | Password  |
|---------|---------------------|-----------|
| Admin   | admin@hospital.com  | admin123  |
| Doctor  | amina@hospital.com  | doctor123 |
| Patient | grace@example.com   | patient123|

## 2. Frontend setup

```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api` calls to the backend
(see `vite.config.js`).

## 3. Core flows implemented
- Register/login as patient, doctor, or admin (JWT issued, role-based routes).
- Patients browse doctors (filter by specialization) and book appointments —
  booking is blocked if the slot is already taken (unique DB index +
  friendly error).
- Doctors confirm/complete appointments from their dashboard.
- Admins see an overview (doctor/patient/appointment counts, revenue).
- Billing: `POST /api/bills` generates a bill off a completed appointment
  (consultation fee + medicine/lab charges − discount); `PUT /api/bills/:id/pay`
  marks it paid.

## 4. API quick reference
| Method | Route                          | Access          |
|--------|---------------------------------|-----------------|
| POST   | /api/auth/register              | public          |
| POST   | /api/auth/login                 | public          |
| GET    | /api/auth/me                    | logged in       |
| GET    | /api/doctors                    | public          |
| PUT    | /api/doctors/:id                | admin/owner doc |
| GET    | /api/patients                   | admin/doctor    |
| GET    | /api/patients/:id               | owner/admin/doc |
| POST   | /api/appointments               | patient         |
| GET    | /api/appointments               | logged in (scoped by role) |
| PUT    | /api/appointments/:id/status    | doctor/admin    |
| PUT    | /api/appointments/:id/cancel    | owner/admin     |
| POST   | /api/bills                      | doctor/admin    |
| GET    | /api/bills                      | logged in       |
| GET    | /api/stats/overview             | admin           |

## 5. Walk-in patients & member numbers
For patients who show up in person and just quote a number instead of
logging in:

- Every patient (whether they self-registered online or were added by
  staff) automatically gets a unique **member number** like `HMS-000001`,
  assigned the moment their record is created.
- **Admins/doctors** can open **Reception** in the navbar to:
  - Search an existing patient by member number
  - Register a brand-new walk-in patient (name, age, gender, phone,
    address — no email/password needed) and get back their new member
    number to hand over
- A patient record no longer requires a linked login account — the `user`
  field on `Patient` is now optional. This means front-desk staff can
  create and manage a patient's file even if that patient never creates
  an online account.
- Staff can also book an appointment on a walk-in patient's behalf: send
  `patientId` (the looked-up patient's `_id`) in the `POST /api/appointments`
  body instead of relying on `req.user.patientProfile`.

| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/patients/walk-in` | admin/doctor — register a walk-in patient |
| GET  | `/api/patients/member/:memberNumber` | admin/doctor — look up by member number |

## 6. File uploads (lab reports / X-rays)
Uses Cloudinary (free tier: 25GB storage/bandwidth) so files aren't stuck on
a server disk that disappears on redeploy.

1. Create a free account at https://cloudinary.com
2. On your Cloudinary Dashboard, copy **Cloud name**, **API Key**, **API Secret**.
3. Paste them into `server/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
4. Endpoints:
   | Method | Route | Access | Body |
   |--------|-------|--------|------|
   | POST | `/api/patients/:id/reports` | owner patient, doctor, admin | `multipart/form-data`: `file` (jpg/png/pdf, max 10MB), optional `label` |
   | GET  | `/api/patients/:id/reports` | owner patient, doctor, admin | — |
   | DELETE | `/api/patients/:id/reports/:reportId` | owner patient, doctor, admin | — |

   Example with curl:
   ```bash
   curl -X POST http://localhost:5000/api/patients/PATIENT_ID/reports \
     -H "Authorization: Bearer YOUR_JWT" \
     -F "file=@/path/to/xray.jpg" \
     -F "label=Chest X-ray"
   ```
   A frontend upload form isn't wired into the React UI yet — the API is
   ready, next step is a file `<input>` on the patient's dashboard page.

## 7. MongoDB Atlas setup (free cloud database — no local install needed)
1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free).
2. Click **Build a Database** → choose the **M0 Free** tier → pick a region
   close to you (e.g. `eu-west` or `af-south` if available) → Create.
3. **Database Access** (left sidebar) → Add New Database User → set a
   username/password (write these down).
4. **Network Access** (left sidebar) → Add IP Address → choose
   **Allow Access from Anywhere** (`0.0.0.0/0`) — fine for development.
5. Go back to your cluster → **Connect** → **Drivers** → copy the connection
   string, it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Paste it into `server/.env` as `MONGO_URI`, replacing `<username>` and
   `<password>` with what you set in step 3, and add a database name before
   the `?`, e.g.:
   ```
   MONGO_URI=mongodb+srv://donald:yourpassword@cluster0.xxxxx.mongodb.net/hospital_management?retryWrites=true&w=majority
   ```
7. Run `npm run seed` then `npm run dev` — you'll see `MongoDB connected: ...`
   in the terminal.

With Atlas, your database lives in the cloud, so `npm run dev` works from
any machine — you don't need MongoDB installed locally.

## 8. Where to go next (from the original project brief)
- Wire the upload API into the React UI (file input on patient dashboard).
- Deploy: Vercel (client) + Render/Railway (server) + MongoDB Atlas.
- Notifications (email/SMS) on booking/confirmation.
- Pagination is already built into `/doctors` and `/patients`; wire it into
  the UI tables next.
- Tests (unit + integration) and a GitHub Actions CI pipeline.

## Known issue
`npm install` in `server/` will warn about 2 high-severity vulnerabilities —
these come from `multer@1.x`, which `multer-storage-cloudinary` currently
requires as a peer dependency. Fine for local development; before a real
deployment, keep an eye on `multer-storage-cloudinary` for a `multer@2.x`-
compatible release, or switch to Cloudinary's own upload widget instead.

## Notes
- This sandbox has no MongoDB instance, so the API was verified to boot and
  serve `/api/health` correctly, and the React app was verified to build
  cleanly — but full request/response testing against a live DB should be
  done on your machine or with an Atlas connection string.
- Passwords are hashed with bcrypt; never stored in plaintext.
- The unique compound index on `Appointment (doctor, date, time)` is the
  real double-booking guard — the pre-check in the controller just gives a
  friendlier error message before hitting that constraint.
