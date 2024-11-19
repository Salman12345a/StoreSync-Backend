import { Customer, DeliveryPartner } from "../../models/user.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

const generateTokens = (user) => {
  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET || "default-access-secret";
  const refreshTokenSecret =
    process.env.REFRESH_TOKEN_SECRET || "default-refresh-secret";

  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    accessTokenSecret,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, role: user.role },
    refreshTokenSecret,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

export const loginCustomer = async (req, reply) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return reply.status(400).send({ message: "Phone number is required" });
    }

    let customer = await Customer.findOne({ phone });

    if (!customer) {
      customer = new Customer({
        phone,
        role: "Customer",
        isActivated: true,
      });
      await customer.save();
    }

    const { accessToken, refreshToken } = generateTokens(customer);

    return reply.send({
      message: customer ? "Login Successful" : "Customer created and logged in",
      accessToken,
      refreshToken,
      customer,
    });
  } catch (error) {
    console.error("Error in loginCustomer:", error);
    return reply.status(500).send({
      message: "An error occurred",
      error: error.message || "Unknown error",
    });
  }
};

export const loginDeliveryPartner = async (req, reply) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return reply
        .status(400)
        .send({ message: "Email and password are required" });
    }

    const deliveryPartner = await DeliveryPartner.findOne({ email });

    if (!deliveryPartner) {
      return reply.status(404).send({ message: "Delivery partner not found" });
    }

    if (!deliveryPartner.isActivated) {
      return reply
        .status(403)
        .send({ message: "Delivery partner is not activated" });
    }

    if (deliveryPartner.password !== password) {
      return reply.status(400).send({ message: "Invalid Credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(deliveryPartner);

    return reply.send({
      message: "Login Successful",
      accessToken,
      refreshToken,
      deliveryPartner,
    });
  } catch (error) {
    console.error("Error in loginDeliveryPartner:", error);
    return reply.status(500).send({
      message: "An error occurred",
      error: error.message || "Unknown error",
    });
  }
};

export const refreshToken = async (req, reply) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    console.error("No refresh token provided");
    return reply.status(401).send({ message: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return reply.status(403).send({ message: "Token has expired" });
    }

    let user;
    if (decoded.role === "Customer") {
      user = await Customer.findById(decoded.userId);
    } else if (decoded.role === "DeliveryPartner") {
      user = await DeliveryPartner.findById(decoded.userId);
    } else {
      return reply.status(403).send({ message: "Invalid Role" });
    }

    if (!user) {
      return reply.status(403).send({ message: "Invalid refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    return reply.send({
      message: "Token Refreshed",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Error in refreshToken:", error);
    return reply.status(403).send({
      message: "Invalid Refresh Token",
      error: error.message || "Unknown error",
    });
  }
};

export const fetchUser = async (req, reply) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.error("Token Missing in Request");
      return reply.status(401).send({ message: "Token is required" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;

    const { userId, role } = decoded;
    if (!userId || !role) {
      console.error("Token Missing Required Claims");
      return reply.status(403).send({ message: "Invalid Token Claims" });
    }

    let user;
    if (role === "Customer") {
      user = await Customer.findById(userId);
    } else if (role === "DeliveryPartner") {
      user = await DeliveryPartner.findById(userId);
    } else {
      return reply.status(403).send({ message: "Invalid role" });
    }

    if (!user) {
      return reply.status(404).send({ message: "User not found" });
    }

    return reply.send({ user });
  } catch (error) {
    console.error("Error in fetchUser:", error);
    return reply.status(500).send({
      message: "An error occurred",
      error: error.message || "Unknown error",
    });
  }
};
