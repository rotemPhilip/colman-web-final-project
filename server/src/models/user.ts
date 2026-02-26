import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  profileImage?: string;
  refreshTokens: string[];
  googleId?: string;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    profileImage: { type: String, default: "" },
    refreshTokens: { type: [String], default: [] },
    googleId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
