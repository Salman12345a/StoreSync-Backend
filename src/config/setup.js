import AdminJS from "adminjs";
import * as AdminJSMongoose from "@adminjs/mongoose";
import * as Models from "../models/index.js";
import AdminJSFastify from "@adminjs/fastify";
import { authenticate, COOKIE_PASSWORD, sessionStore } from "./config.js";
import { dark, light, noSidebar } from "@adminjs/themes";
AdminJS.registerAdapter(AdminJSMongoose);

export const admin = new AdminJS({
  resources: [
    {
      resource: Models.Customer,
      options: {
        listProperties: ["phone", "role", "isActivated"],
        filterProperties: ["phone", "role"],
      },
    },
    {
      resource: Models.DeliveryPartner,
      options: {
        listProperties: ["email", "role", "isActivated"],
        filterProperties: ["email", "role"],
      },
    },
    {
      resource: Models.Admin,
      options: {
        listProperties: ["email", "role", "isActivated"],
        filterProperties: ["email", "role"],
      },
    },
    {
      resource: Models.Branch,
    },
    {
      resource: Models.Product,
    },
    {
      resource: Models.Category,
    },
    {
      resource: Models.Order,
    },
    {
      resource: Models.Counter,
    },
  ],

  branding: {
    companyName: "storesync",
    withMadeWithLove: false,
    favicon:
      "https://moodbanao.net/wp-content/uploads/2024/11/Untitled-design-8-modified.png",
    logo: "https://moodbanao.net/wp-content/uploads/2024/11/Untitled-design-8-modified.png",
  },
  defaultTheme: dark.id,
  rootPath: "/admin",
  availableThemes: [dark, light, noSidebar],
});

export const buildAdminRouter = async (app) => {
  await AdminJSFastify.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookiePassword: COOKIE_PASSWORD,
      cookieName: "adminjs",
    },
    app,
    {
      store: sessionStore,
      saveUnintialized: true,
      secret: COOKIE_PASSWORD,
      cookie: {
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      },
    }
  );
};
