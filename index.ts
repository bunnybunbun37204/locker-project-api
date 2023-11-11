// src/app.ts
import express, { Express, NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import cors from 'cors';
import bodyParser from "body-parser";
import { google } from "googleapis";

require("dotenv").config();

const URI = process.env.URI ?? "your_default_mongodb_uri";

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  locker: {
    locker_id: String,
    status: String,
  },
});

const corsOptions = {
  origin: 'http://localhost:3000/',
};


const User = mongoose.model("Post", userSchema, "users");

// Connect to db
const connectToDatabase = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});
const client = await auth
  .getClient()
  .then(() => {
    console.log("Connect to google client");
  })
  .catch((error) => {
    console.log("Error connect to google", error);
  });

connectToDatabase();

const googleSheets = google.sheets({ version: "v4", auth: client });
const spreadsheetsId = "1AbCRoQPZLXkbgAwYpR6JvCDKErv_A1qQWDBAYrmAyMs";
const app: Express = express();

const port: number = 8000;

app.use(bodyParser.json());
// Middleware to add custom headers
app.use((req : Request, res : Response, next) => {
  res.setHeader('Content-Type','application/json');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, DELETE, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hello Express + TypeScirpt!!",
  });
});

app.post("/signin", async (req: Request, res: Response) => {
  try {
    const { username, password, locker } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Plz provide username or password" });
    }
    const { locker_id, status } = locker;

    if (!locker_id || status === undefined) {
      return res.status(400).json({
        error: "Please provide locker_id and status in the locker object",
      });
    }

    const newUser = new User({
      username,
      password,
      locker: { locker_id, status },
    });

    await newUser.save();

    res.json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating new user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/getUser", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    console.log("REQ", req.body);
    

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Please provide both username and password" });
    }

    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { locker } = user;

    res.json({
      username: user.username,
      locker,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getData", async (req: Request, res: Response) => {

  // Get Row Value Data
  const getRows = await googleSheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: spreadsheetsId,
    range: "Sheet1",
  });

  res.send(getRows.data.values);
});

app.post("/booked", async (req: Request, res: Response) => {
  const { username, locker_id, isBooked } = req.body;
  if (!username || !locker_id || !isBooked) {
    return res.status(400).json({
      error: "Please provide locker_id and username in the req body",
    });
  }

  const updatedValue = [locker_id];

  const getRows = await googleSheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: spreadsheetsId,
    range: "Sheet1",
  });
  const data = getRows.data.values;
  const updatedb = data?.map((r) =>
    updatedValue.includes(r[0]) ? [r[0], isBooked] : r
  );

  await googleSheets.spreadsheets.values.update({
    auth: auth,
    spreadsheetId: spreadsheetsId,
    range: "Sheet1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: updatedb,
    },
  });
  res.send("Book success").status(200);
});


app.listen(port, () => console.log(`Application is running on port ${port}`));
