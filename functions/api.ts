import express, { Express, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import serverless from "serverless-http";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import requestIp from "request-ip";
import { CLIENT } from "./lib/constants";
import lockerApi from "./locker/api";

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  keyGenerator: (req, res) => {
    return req.clientIp || "default ip"; // IP address from requestIp.mw(), as opposed to req.ip
  },
});

const app: Express = express();

app.set("trust proxy", false);
app.use(requestIp.mw());
app.use(cors({ origin: CLIENT, credentials: true }));
app.use(helmet());
app.use(bodyParser.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json");
  next();
});
app.use(limiter);
app.use(morgan("combined"));

app.use(`/.netlify/functions/api/locker`, lockerApi);

export const handler = serverless(app);
