import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { getGoogleSheets } from "../googleapi/constants";
import { connectToGoogleSheet } from "../googleapi/connectToClient";
import { booked, getDataRows } from "../googleapi/api";
import { getUserById, singIn, singUp } from "../mongodbapi/api";
import { connectToDatabase } from "../mongodbapi/connectToDb";

connectToDatabase();

const lockerApi = express.Router();
const client: any = connectToGoogleSheet();
const googleSheets = getGoogleSheets(client);

// Validation middleware
const validateSignUp = [
  check("email").isEmail(),
  check("username").isLength({ min: 5 }),
  check("password").isLength({ min: 6 }),
];

const validateGetUser = [
  check("email").isEmail(),
  check("password").isLength({ min: 6 }),
];

lockerApi.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hello Express + TypeScript!!",
  });
});

lockerApi.post(
  "/signUp",
  validateSignUp,
  async (req: Request, res: Response) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;
    const { status, message } = await singUp(email, username, password);
    res.status(status).json({ message: message });
  }
);

lockerApi.post(
  "/getUser",
  validateGetUser,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const { status, message } = await singIn(email, password);
    res.status(status).json({ message: message });
  }
);

lockerApi.get("/getUser/:id", async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { status, message } = await getUserById(userId);
  res.status(status).json({ message: message });
});

lockerApi.get("/getData", async (req: Request, res: Response) => {
  const { status, message } = await getDataRows(googleSheets, "Sheet1");
  res.status(status).json({ message: message });
});

lockerApi.post("/booked", async (req: Request, res: Response) => {
  const { user_id, locker_id, isBooked } = req.body;
  const { status, message } = await booked(
    user_id,
    locker_id,
    isBooked,
    "Sheet1",
    googleSheets
  );
  res.status(status).json({ message: message });
});
export default lockerApi;
