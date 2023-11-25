import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  locker: {
    locker_id: String,
    status: String,
  },
});

export const User = mongoose.model("Post", userSchema, "users");
