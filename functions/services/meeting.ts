import express, { Request, Response } from "express";

const meetingApi = express.Router();

meetingApi.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Hello Meeting API" });
});

export default meetingApi;
