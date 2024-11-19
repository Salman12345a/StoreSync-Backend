import "dotenv/config";
import fastifySession from "@fastify/session";
import ConnectMongoDBSession from "connect-mongodb-session";
import { Admin } from "../models/index.js";

const MongoDBStore = ConnectMongoDBSession(fastifySession);
export const sessionStore = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

sessionStore.on("error", (error) => {
  console.log("Session store error", error);
});

export const authenticate = async (email, password) => {
  // Define demo email and password
  const demoEmail = "demo@example.com";
  const demoPassword = "demo123";

  if (email && password) {
    // Check if the email and password match the demo credentials
    if (email === demoEmail && password === demoPassword) {
      return Promise.resolve({ email: demoEmail, password: demoPassword });
    }

    // If not, check against the Admin database (as in original code)
    const user = await Admin.findOne({ email });
    if (!user) {
      return null;
    }
    if (user.password === password) {
      return Promise.resolve({ email: email, password: password });
    } else {
      return null;
    }
  }

  return null;
};

export const PORT = process.env.PORT || 3000;
export const COOKIE_PASSWORD = process.env.COOKIE_PASSWORD;
