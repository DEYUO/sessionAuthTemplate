import { serve } from "@hono/node-server";
import { aLogger, customWebLogger } from "./helpers/logger.js";
import { logger } from "hono/logger";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { cleanUpSessions, createDefaultUser } from "./helpers/Auth.js";
import authRouter from "./routes/Auth.js";
import usersRouter from "./routes/Users.js";

dotenv.config();

mongoose
  .connect(process.env.DB_URI as string, {
    maxPoolSize: 10,
    authSource: "admin",
    auth: {
      username: process.env.DB_USERNAME as string,
      password: process.env.DB_PASSWORD as string,
    },
  })
  .then(async () => {
    aLogger.info("DB Connection established");
    await createDefaultUser();
  })
  .catch((err) => aLogger.error(err.message));

// Run session cleanup every 10 minutes
setInterval(cleanUpSessions, 10 * 60 * 1000); // 10 minutes

const app = new Hono();
const allowedHosts = process.env.ALLOWED_HOSTS
  ? process.env.ALLOWED_HOSTS.split(",")
  : [];
app.use("*", cors({ origin: allowedHosts, credentials: true }));
app.use(logger(customWebLogger));

app.route("auth", authRouter);
app.route("users", usersRouter);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    aLogger.info(`Server is running on http://localhost:${info.port}`);
  },
);
