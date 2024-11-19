import "dotenv/config";
import Fastify from "fastify";
import { connectDB } from "./src/config/connect.js";
import { buildAdminRouter } from "./src/config/setup.js";
import { registerRoutes } from "./src/routes/index.js";
import { PORT } from "./src/config/config.js";
import fastifySocketIO from "fastify-socket.io";

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB(process.env.MONGO_URI);

    // Initialize Fastify app
    const app = Fastify();

    // Register Socket.IO with Fastify
    app.register(fastifySocketIO, {
      cors: {
        origin: "*", // Allow all origins
      },
      pingInterval: 10000,
      pingTimeout: 5000,
      transports: ["websocket"], // Use WebSocket transport
    });

    // Add custom reply decorator
    app.decorateReply("redirectFixed", function (url, code = 302) {
      return this.redirect(url, code);
    });

    // Register routes and admin router
    await registerRoutes(app);
    await buildAdminRouter(app);

    // Start the server
    app.listen({ port: PORT }, (err, addr) => {
      if (err) {
        console.error("Server error:", err);
        process.exit(1);
      } else {
        console.log(`Server is running at http://localhost:${PORT}/admin`);
      }
    });

    // Setup WebSocket events
    app.ready().then(() => {
      app.io.on("connection", (socket) => {
        console.log("A User Connected");

        // Join a specific room
        socket.on("joinRoom", (orderId) => {
          socket.join(orderId);
          console.log(`User joined room ${orderId}`);
        });

        // Handle custom events
        socket.on("discount", () => {
          console.log("Discount event received");
        });

        // Handle disconnection
        socket.on("disconnect", () => {
          console.log("User Disconnected");
        });
      });
    });
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
};

start();
