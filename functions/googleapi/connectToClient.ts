import { auth } from "./constants";

export const connectToGoogleSheet = async () => {
  let client: any;
  try {
    client = await auth.getClient();
    console.log("Connected to google client 🚀");
  } catch (error) {
    console.log("error cliet", error);
  }
  return client;
};
