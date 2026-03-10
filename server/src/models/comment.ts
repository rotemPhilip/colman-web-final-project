import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  content: string;
  post: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Index for fast lookup by post
commentSchema.index({ post: 1, createdAt: -1 });

export default mongoose.model<IComment>("Comment", commentSchema);
