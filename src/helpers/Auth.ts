import Users from "../models/Users.js";
import bcrypt from "bcrypt";
import {aLogger} from "./logger.js";
import {v4 as uuidv4} from "uuid";
import Sessions from "../models/Sessions.js"; // To generate unique session IDs

export const createDefaultUser = async () => {
  const defaultUser = await Users.findOne({email: "admin@admin.com"});

  if (!defaultUser) {
    const passHash = await hashPassword("hikim2rus");

    const newUser = new Users({
      name: "Super",
      email: "admin@admin.com",
      hash: passHash,
      status: true,
      group: "Administrator",
    });

    await newUser.save();

    aLogger.info(
      "admin@admin.com as the System Default Admin with the default password has been created, ensure the default password is changed.",
    );
  }
};

// Helper function to generate HashPasswords
export const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Helper function to generate session IDs
export const generateSessionId = () => uuidv4();

async function comparePasswords(plainPassword: string, hashedPassword: string) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    aLogger.error("Error comparing passwords:", error);
    throw error;
  }
}

export const verifyUser = async (email: string, password: string) => {
  const exUser = await Users.findOne({email: email});
  if (!exUser) {
    throw new Error("User doesn't exist");
  }
  const passHash = exUser.hash ? exUser.hash : "";
  return await comparePasswords(password, passHash);
};

export const cleanUpSessions = async () => {
  const now = new Date();

  // Remove sessions that have expired based on `expiresAt`
  const expiredSessionsResult = await Sessions.deleteMany({
    expiresAt: {$lt: now},
  });

  aLogger.info(
    `Running scheduled session cleaning, ${expiredSessionsResult.deletedCount} expired sessions.`,
  );
};
