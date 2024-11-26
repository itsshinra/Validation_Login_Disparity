import bodyParser from "body-parser";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { connect, set } from "mongoose";

import authRoutes from "./routes/auth-routes.js";
import modulesRoutes from "./routes/modules-routes.js";
import usersRoutes from "./routes/users-routes.js";
import sectionsRoutes from "./routes/sections-routes.js";
import subscriptionsRoutes from "./routes/subscriptions-routes.js";
import cubesRoutes from "./routes/cubes-routes.js";
import examRoutes from "./routes/exam-routes.js";
import couponRoutes from "./routes/coupon-routes.js";
import paymentRoutes from "./routes/payment-routes.js";

// set up environment variables
dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || "5000");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// set up body parser and cors
app.use(bodyParser.json());
app.use(cors());

// serve public assets
app.use(express.static(path.resolve(__dirname, "public")));

// set up headers to allow cross-origin requests
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  next();
});

// set up API routes
app.use("/api/auth", authRoutes);
app.use("/api/modules", modulesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/sections", sectionsRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/cubes", cubesRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payment", paymentRoutes);

// forward all other requests to react app, so react router can handle them 'will handle 404 errors'
app.use((req, res, next) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

// handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({
    message: "Could not find this route.",
  });
});

// handle next() errors and general errors
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.statusCode || 500;
  const message = error.message || "An unknown error occurred!";
  if (process.env.NODE_ENV === "development")
    console.log(error.message, error.data ?? "");
  res.status(status).json({
    message: message,
  });
});

// start the Express server & db connection
set("strictQuery", false);
connect(process.env.DB_URL ?? "", {
  dbName: process.env.DB_NAME,
  user: process.env.DB_USER,
  pass: process.env.DB_PASS,
})
  .then(() => {
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
      console.log(`⚡️[api]: APIs are running at http://localhost:${port}/api`);
      console.log(
        `⚡️[web app]: Web app is running at http://localhost:${port}/`
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });
