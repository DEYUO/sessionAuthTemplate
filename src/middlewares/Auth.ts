  import dayjs from "dayjs";
  import type { MiddlewareHandler } from "hono";
  import { getCookie } from "hono/cookie";
  import Sessions from "../models/Sessions.js";
  import type { ISessionContext } from "../types/Sessions.js";
  import type {TUserGroup} from "../types/User.js"
  import Users from "../models/Users.js"
  import dotenv from "dotenv";

  dotenv.config();

  const SESSION_EXPIRY_TIME_INCREMENT = Number(
    process.env.SESSION_EXPIRY_TIME_INCREMENT,
  ); // Session expiry time in minutes

export const sessionCookieProtectedPath = (
  allowedGroups: TUserGroup[] = []
): MiddlewareHandler => {
  return async function checkSessionCookieMiddleware(
    c: ISessionContext,
    next: () => Promise<void>,
  ) {
    const sessionId = getCookie(c, "session_id");

    if (!sessionId) {
      return c.json({ message: "Unauthorized - missing cookie" }, 401);
    }

    const session = await Sessions.findById(sessionId);
    if (!session || session.expiresAt <= new Date()) {
      if (session) await Sessions.findByIdAndDelete(sessionId);
      return c.json({ message: "Unauthorized - session expired" }, 401);
    }

    // Extend session expiry
    session.expiresAt = dayjs()
      .add(SESSION_EXPIRY_TIME_INCREMENT, "minute")
      .toDate();
    await session.save();

    // Fetch user from Users collection
    const user = await Users.findOne({ email: session.username });
    if (!user) {
      return c.json({ message: "Unauthorized - user not found" }, 401);
    }

    // Check access control
    if (allowedGroups.length > 0 && !allowedGroups.includes(user.group)) {
      return c.json({ message: "Unauthorized - insufficient role" }, 401);
    }

    // Attach session and user to context
    c.session = session;
    c.set("user", user); // optionally attach full user object for downstream use

    return next();
  };
};
