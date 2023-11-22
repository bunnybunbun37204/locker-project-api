import express, { Express, NextFunction, Request, Response } from "express";
import mongoose, { ConnectOptions } from "mongoose";
import bodyParser from "body-parser";
import { Auth, google } from "googleapis";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { check, validationResult } from "express-validator";
import cookieParser from "cookie-parser";

dotenv.config();

const URI = process.env.URI || "your_default_mongodb_uri";
const client_id = process.env.client_id || "your_default_client_id";
const client_email = process.env.client_email || "your_default_client_email";
const project_id = process.env.project_id || "your_default_project_id";
const private_key = process.env.private_key || "your_default_private_key";
const spreadsheetsId = process.env.sheet_id || "your_default_sheet_id";
const token_url = process.env.token_uri || "token_uri_default";
const universe_domain =
  process.env.univeral_domain || "univeral_domain_default";
const type = process.env.type || "type_default";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB 🚀");
  } catch (error) {
    console.error("💀 Error connecting to MongoDB:", error);
  }
};

const auth : Auth.GoogleAuth = new google.auth.GoogleAuth({
  credentials: {
    client_id: client_id,
    client_email: client_email,
    project_id: project_id,
    private_key: private_key,
    token_url: token_url,
    universe_domain: universe_domain,
    type: type,
  },
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

connectToDatabase();

const client = await auth.getClient();

const googleSheets = google.sheets({
  version: "v4",
  auth: client,
});
const app: Express = express();

const port: number = 8000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(helmet());
app.use(cookieParser());

app.use(bodyParser.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// Validation middleware
const validateSignUp = [
  check("email").isEmail(),
  check("username").isLength({ min: 5 }),
  check("password").isLength({ min: 6 }),
];

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

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hello Express + TypeScript!!",
  });
});

app.post("/signUp", validateSignUp, async (req: Request, res: Response) => {
  // Handle validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Rest of the signup logic
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
  console.log((await auth.getCredentials()).client_email);
  console.log((await auth.getCredentials()).private_key);
  
  try {
    // Get Row Value Data
    const getRows = await googleSheets.spreadsheets.values.get({
      auth: auth,
      spreadsheetId: spreadsheetsId,
      range: "Sheet1",
    });

    console.log("Connect to sheet 🚀");
    

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
  } catch (error) {
    console.error("💀 Error fetching data from Google Sheets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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
    locker: {
      locker_id: locker_id,
      status: isBooked,
    },
  });
  res.send({ message: "success" }).status(200);
});

app.listen(port, () =>
  console.log(`Application is running on port ${port} 🚀`)
);
