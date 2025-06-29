import type { Context } from "hono";

export interface ISession {
  _id: string; // this is now sessionId
  username: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ISessionContext extends Context {
  session?: ISession | null;
}
