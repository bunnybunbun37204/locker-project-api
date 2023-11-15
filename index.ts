// src/app.ts
import express, { Express, NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import { google } from "googleapis";

require("dotenv").config();

const URI = process.env.URI ?? "your_default_mongodb_uri";

const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  locker: {
    locker_id: String,
    status: String,
  },
});

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
app.use((req: Request, res: Response, next) => {
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

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hello Express + TypeScirpt!!",
  });
});

app.post("/signUp", async (req: Request, res: Response) => {
  try {
    const { email, username, password, locker } = req.body;

    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ error: "Plz provide username or password" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(200).json({ alert: "user exist", id: user._id });
    }
    const { locker_id, status } = locker;

    if (!locker_id || status === undefined) {
      return res.status(400).json({
        error: "Please provide locker_id and status in the locker object",
      });
    }

    const newUser = new User({
      email,
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
    const { email, password } = req.body;
    console.log("REQ", req.body);

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide both email and password" });
    }

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getUser/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: "Please provide a user ID" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      username: user.username,
      locker: user.locker,
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

interface Locker {
  locker_id: string;
  locker_status: string;
}

app.get("/getData", async (req: Request, res: Response) => {
  // Get Row Value Data
  const getRows = await googleSheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: spreadsheetsId,
    range: "Sheet1",
  });
  const result = getRows.data.values;
  result?.shift();
  let datas: Locker[] = [];
  result?.map((d: string[]) =>
    datas.push({
      locker_id: d[0],
      locker_status: d[1],
    })
  );

  res.status(200).send({ data: datas });
});

app.post("/booked", async (req: Request, res: Response) => {
  const { user_id, locker_id, isBooked } = req.body;
  if (!user_id || !locker_id || !isBooked) {
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
  const user = await User.findById(user_id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  await user.updateOne({
    locker : {
      locker_id : locker_id,
      status : isBooked
    }
  });
  res.send({ message: "success" }).status(200);
});

app.listen(port, () => console.log(`Application is running on port ${port}`));
