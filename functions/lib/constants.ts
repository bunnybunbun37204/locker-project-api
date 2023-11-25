import dotenv from "dotenv";

dotenv.config();

export const URI = process.env.URI || "your_default_mongodb_uri";
export const CLIENT = process.env.CLIENT || "your_dafault_client";
export const client_id = process.env.client_id || "your_default_client_id";
export const client_email =
  process.env.client_email || "your_default_client_email";
export const project_id = process.env.project_id || "your_default_project_id";
export const spreadsheetsId = process.env.sheet_id || "your_default_sheet_id";
export const token_url = process.env.token_uri || "token_uri_default";
export const universe_domain =
  process.env.univeral_domain || "univeral_domain_default";
export const type = process.env.type || "type_default";
export const secret = process.env.private_key?.replace(/\\n/g, "\n");
