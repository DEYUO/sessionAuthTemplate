import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { aLogger } from "../helpers/logger.js";
import {
  generateSessionId,
  hashPassword,
  verifyUser,
} from "../helpers/Auth.js";
import Sessions from "../models/Sessions.js";
import { sessionCookieProtectedPath } from "../middlewares/Auth.js";
import type { ISession, ISessionContext } from "../types/Sessions.js";
import Users from "../models/Users.js";
import dotenv from "dotenv";

dotenv.config();

const authRouter = new Hono();

authRouter.get(
  "/",
  sessionCookieProtectedPath(),
  async (c: ISessionContext) => {
    try {
      const session = c.session as unknown as ISession;
      if (session) {
        const exUser = await Users.findOne({ email: session.username }).select(
          "-hash",
        );

        return c.json(exUser);
      }
    } catch (e) {
      aLogger.error(e);
      if (e instanceof Error) {
        return c.json({ error: e.message }, 500);
      }
      return c.json({ error: "Unexpected error" }, 500);
    }
  },
);

authRouter.post("/login", async (c: ISessionContext) => {
  try {
    const { email, password } = await c.req.json();
    if (await verifyUser(email, password)) {
      const sessionId = generateSessionId();

      // expires in 1hr
      const newSession = new Sessions({
        _id: sessionId,
        username: email,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      await newSession.save();

      const isProduction = process.env.PRODUCTION === "true";

      // Set session ID in cookie
      setCookie(c, "session_id", sessionId, {
        httpOnly: true,
        maxAge: 60 * 60, // 1 hour
        secure: isProduction,
      });

      const exUser = await Users.findOne({ email: email }).select("-hash");

      return c.json(exUser);
    }

    return c.json({ message: "Invalid Credentials" }, 401);
  } catch (e) {
    aLogger.error(e);
    if (e instanceof Error) {
      return c.json({ error: e.message }, 500);
    }
    return c.json({ error: "Unexpected error" }, 500);
  }
});

authRouter.put(
  "/password",
  sessionCookieProtectedPath(),
  async (c: ISessionContext) => {
    try {
      const email = c.session?.username;
      const body = await c.req.json();

      const password = typeof body.password === "string" ? body.password : "";

      if (!password || password.length < 8) {
        return c.json(
          { error: "Password must be at least 8 characters." },
          400,
        );
      }

      const user = await Users.findOne({ email });

      if (!user) {
        return c.json({ error: "User not found." }, 404);
      }

      user.hash = await hashPassword(password);
      await user.save();

      const updatedUser = await Users.findOne({ email }).select("-hash");
      return c.json(updatedUser);
    } catch (e) {
      aLogger.error(e);
      if (e instanceof Error) {
        return c.json({ error: e.message }, 500);
      }
      return c.json({ error: "Unexpected error" }, 500);
    }
  },
);

authRouter.post(
  "/logout",
  sessionCookieProtectedPath(),
  async (c: ISessionContext) => {
    try {
      const session = c.session as unknown as ISession;

      await Sessions.findByIdAndDelete(session._id);

      deleteCookie(c, "session_id");

      return c.json({ message: "Logged out successfully" });
    } catch (e) {
      aLogger.error(e);
      if (e instanceof Error) {
        return c.json({ error: e.message }, 500);
      }
      return c.json({ error: "Unexpected error" }, 500);
    }
  },
);

export default authRouter;
