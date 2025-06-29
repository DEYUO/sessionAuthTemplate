import { Schema, model } from "mongoose";
import type { IUser } from "../types/User.js";

const UsersSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  hash: { type: String, required: false },
  createdAt: { type: Date, default: Date.now, required: false },
  lastModifiedAt: { type: Date, default: Date.now, required: false },
  status: { type: Boolean, required: false, default: true },
  group: { type: String, required: true, default: "User" },
});

UsersSchema.pre<IUser>("save", function (next) {
  this.lastModifiedAt = new Date();
  next();
});

const Users = model<IUser>("Users", UsersSchema);
export default Users;
