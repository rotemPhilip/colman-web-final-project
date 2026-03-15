import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  dishName: string;
  restaurant: string;
  description?: string;
  image?: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    dishName: { type: String, required: true },
    restaurant: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPost>("Post", postSchema);
