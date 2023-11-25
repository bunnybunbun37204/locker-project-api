import { google } from "googleapis";
import {
  client_email,
  client_id,
  project_id,
  secret,
  token_url,
  type,
  universe_domain,
} from "../lib/constants";

export const auth = new google.auth.GoogleAuth({
  credentials: {
    client_id: client_id,
    client_email: client_email,
    project_id: project_id,
    private_key: secret,
    token_url: token_url,
    universe_domain: universe_domain,
    type: type,
  },
  //keyFile:"credentials.json",
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});
export const getGoogleSheets = (client: any) =>
  google.sheets({
    version: "v4",
    auth: client,
  });
