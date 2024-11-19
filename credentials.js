import crypto from "crypto";

// Generate COOKIE_PASSWORD
const COOKIE_PASSWORD = crypto.randomBytes(32).toString("hex");
console.log("COOKIE_PASSWORD:", COOKIE_PASSWORD);

// Generate ACCESS_TOKEN_SECRET
const ACCESS_TOKEN_SECRET = crypto.randomBytes(32).toString("hex");
console.log("ACCESS_TOKEN_SECRET:", ACCESS_TOKEN_SECRET);

// Generate REFRESH_TOKEN_SECRET
const REFRESH_TOKEN_SECRET = crypto.randomBytes(32).toString("hex");
console.log("REFRESH_TOKEN_SECRET:", REFRESH_TOKEN_SECRET);
