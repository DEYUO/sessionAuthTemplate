import { Schema, model } from "mongoose";
import type { ISession } from "../types/Sessions.js";

const SessionsSchema = new Schema<ISession>({
  _id: { type: String, required: true }, // UUID becomes _id
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: Date.now },
});

const Sessions = model("Sessions", SessionsSchema);
export default Sessions;
