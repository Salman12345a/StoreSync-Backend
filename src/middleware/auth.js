import jwt from "jsonwebtoken";

// Verify the access token
export const verifyToken = async (req, reply) => {
  try {
    // Get the authorization header
    const authHeader = req.headers["authorization"];

    // Check if authorization header exists
    if (!authHeader) {
      console.error("Missing Authorization Header");
      return reply.status(401).send({ message: "Access token required" });
    }

    // Check if authorization header follows Bearer token format
    if (!authHeader.startsWith("Bearer ")) {
      console.error("Invalid Authorization Header Format");
      return reply.status(401).send({ message: "Invalid token format" });
    }

    // Extract token from the authorization header
    const token = authHeader.split(" ")[1];

    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Attach the decoded token's payload to the request object
    req.user = decoded;

    return true; // Token is valid, return true to proceed
  } catch (err) {
    console.error("Token Verification Error:", err);

    // Handle expired token error
    if (err.name === "TokenExpiredError") {
      return reply.status(401).send({ message: "Token has expired" });
    }

    // Handle any other JWT errors (invalid token, etc.)
    return reply.status(403).send({ message: "Invalid token" });
  }
};
