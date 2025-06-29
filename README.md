# 🔐 Hono Auth Starter Template For DEYOU

A lightweight, extensible **authentication starter** built with [Hono.js](https://hono.dev/), MongoDB, and cookie-based session management.

This template provides:
- ✅ Secure login/logout endpoints
- ✅ Cookie-based session with sliding expiration
- ✅ Role-based access control (RBAC)
- ✅ Automatic session cleanup
- ✅ Admin user bootstrapping
- ✅ TypeScript types for safety
- ✅ Simple and scalable code structure

---

## 📁 Project Structure

``` bash
.
├── helpers/
│   └── Auth.js               # Auth utilities (hash, verify, default user)
│   └── logger.js             # Logger setup
├── middlewares/
│   └── Auth.js               # Session + RBAC middleware
├── models/
│   └── Users.js              # Mongoose User model
│   └── Sessions.js           # Mongoose Session model
├── routes/
│   └── Auth.js               # /auth/login, /auth/logout, /auth/
├── types/
│   └── User.js               # User TypeScript interface
│   └── Sessions.js           # Session TypeScript interfaces
├── .env                      # Environment config
└── index.ts                  # Main app entry

````

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
DB_URI=mongodb://localhost:27017/auth_demo
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

SESSION_EXPIRY_TIME_INCREMENT=10

ALLOWED_HOSTS=http://localhost:5173
PRODUCTION=false
````

---

## 🚀 Features

### 🧑‍💻 Auth Endpoints

* `POST /auth/login`: Logs in a user and sets a `session_id` cookie.
* `POST /auth/logout`: Destroys the session and clears the cookie.
* `GET /auth/`: Returns the currently logged-in user's profile.

### 🍪 Cookie-Based Sessions

* Sessions stored in MongoDB.
* `session_id` cookie (HTTP-only, optionally `secure`).
* Sliding expiration with automatic renewal.

### 🔐 RBAC Middleware

Protect routes like this:

```ts
// Allow only authenticated users
app.get("/profile", sessionCookieProtectedPath(), handler);

// Allow only Administrators
app.get("/admin", sessionCookieProtectedPath(["Administrator"]), handler);
```

### 🧹 Session Cleanup

A background job runs every 10 minutes to remove expired sessions:

```ts
setInterval(cleanUpSessions, 10 * 60 * 1000);
```

---

## 🧪 Default Admin User

On first run, the app auto-creates a default admin:

```js
Email:    admin@admin.com
Password: hikim2rus
```

⚠️ **Change this password immediately!**

---

## 🛠️ Tech Stack

* [Hono.js](https://hono.dev/) - Ultra-light web framework
* MongoDB + Mongoose
* bcrypt - Password hashing
* UUID - Session IDs
* dotenv - Environment config

---

## 📦 Install & Run

```bash
# Install dependencies
npm install

# Run the app
npm run dev
```

The server will start on `http://localhost:3000`.

---

## ✅ Example: Protecting Routes

```ts
import { sessionCookieProtectedPath } from "./middlewares/Auth.js";

// Public route
app.get("/public", (c) => c.text("Anyone can access"));

// Protected route for any logged-in user
app.get("/me", sessionCookieProtectedPath(), (c) => {
  const user = c.get("user"); // Optional
  return c.json(user);
});

// Only for admins
app.get("/admin", sessionCookieProtectedPath(["Administrator"]), (c) => {
  return c.text("Welcome Admin");
});
```

---

## 📌 Notes

* Ensure your frontend uses `credentials: 'include'` when making requests.
* In production, set `PRODUCTION=true` to enforce secure cookies.
* If you deploy behind a reverse proxy (e.g. Cloudflare), configure trust proxy settings accordingly.

---

## 👨‍💻 Author

Built by [@eyaadh](https://github.com/eyaadh)