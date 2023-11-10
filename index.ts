// src/app.ts
import express, { Express, NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";

require("dotenv").config();

const URI = process.env.URI ?? "your_default_mongodb_uri";

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  locker: {
    locker_id: String,
    status: Boolean,
  },
});

const User = mongoose.model("Post", userSchema, 'users');

// Connect to db
const connectToDatabase = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

const app: Express = express();

const port: number = 8000;

app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hello Express + TypeScirpt!!",
  });
});

app.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password, locker } = req.body;
    console.log(req.body);
    
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Plz provide username or password" });
    }
    const { locker_id, status } = locker;

    if (!locker_id || status === undefined) {
      return res
        .status(400)
        .json({
          error: "Please provide locker_id and status in the locker object",
        });
    }

    const newUser = new User({
      username,
      password,
      locker: { locker_id, status },
    });
    console.log("Start");
    
    await newUser.save();
    console.log("finish wating");

    res.json({ message: "Post created successfully" });
  } catch (error) {
    console.error("Error creating new user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Middleware to add custom headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS, PATCH, DELETE, POST, PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  next();
});

app.listen(port, () => console.log(`Application is running on port ${port}`));
connectToDatabase();
