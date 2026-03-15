import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import Comment from "../models/comment";

let accessToken: string;
let userId: string;
let postId: string;

async function setupUserAndPost(): Promise<void> {
  const res = await request(app).post("/api/auth/register").send({
    username: "commentuser",
    email: "commentuser@example.com",
    password: "password123",
  });
  accessToken = res.body.accessToken;
  userId = res.body.user._id;

  const postRes = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      dishName: "Test Dish",
      restaurant: "Test Restaurant",
      description: "Test description",
    });
  postId = postRes.body._id;
}

describe("Comment API", () => {
  beforeEach(async () => {
    await setupUserAndPost();
  });

  // ─── CREATE COMMENT ───────────────────────────────────────

  describe("POST /api/comments/:postId", () => {
    it("should create a comment on a post", async () => {
      const res = await request(app)
        .post(`/api/comments/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "Great dish!" });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Great dish!");
      expect(res.body.post).toBe(postId);
      expect(res.body.owner).toBeDefined();
    });

    it("should return 400 if content is empty", async () => {
      const res = await request(app)
        .post(`/api/comments/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Comment content is required.");
    });

    it("should return 400 if content is missing", async () => {
      const res = await request(app)
        .post(`/api/comments/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Comment content is required.");
    });

    it("should return 404 if post does not exist", async () => {
      const fakePostId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/comments/${fakePostId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "Comment on nonexistent post" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Post not found.");
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .post(`/api/comments/${postId}`)
        .send({ content: "Unauthorized" });

      expect(res.status).toBe(401);
    });

    it("should trim whitespace from content", async () => {
      const res = await request(app)
        .post(`/api/comments/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "  trimmed content  " });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("trimmed content");
    });
  });

  // ─── GET COMMENTS BY POST ────────────────────────────────

  describe("GET /api/comments/:postId", () => {
    beforeEach(async () => {
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post(`/api/comments/${postId}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send({ content: `Comment ${i}` });
      }
    });

    it("should get comments for a post with pagination", async () => {
      const res = await request(app)
        .get(`/api/comments/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.comments).toHaveLength(5);
      expect(res.body.total).toBe(5);
      expect(res.body.page).toBe(1);
    });

    it("should respect pagination parameters", async () => {
      const res = await request(app)
        .get(`/api/comments/${postId}?page=1&limit=2`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.comments).toHaveLength(2);
      expect(res.body.total).toBe(5);
      expect(res.body.pages).toBe(3);
    });

    it("should return empty array for post with no comments", async () => {
      // Create a new post with no comments
      const newPost = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          dishName: "Empty Post",
          restaurant: "Restaurant",
          description: "No comments here",
        });

      const res = await request(app)
        .get(`/api/comments/${newPost.body._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.comments).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  // ─── UPDATE COMMENT ───────────────────────────────────────

  describe("PUT /api/comments/:commentId", () => {
    let commentId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/comments/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "Original comment" });
      commentId = res.body._id;
    });

    it("should update a comment successfully", async () => {
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "Updated comment" });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe("Updated comment");
    });

    it("should return 400 if content is empty", async () => {
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Comment content is required.");
    });

    it("should return 404 for non-existent comment", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/comments/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "Updated" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Comment not found.");
    });

    it("should return 403 when updating someone else's comment", async () => {
      const otherRes = await request(app).post("/api/auth/register").send({
        username: "othercommenter",
        email: "othercommenter@example.com",
        password: "password123",
      });
      const otherToken = otherRes.body.accessToken;

      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ content: "Hacked!" });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Not authorized.");
    });
  });

  // ─── DELETE COMMENT ───────────────────────────────────────

  describe("DELETE /api/comments/:commentId", () => {
    let commentId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/comments/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "To be deleted" });
      commentId = res.body._id;
    });

    it("should delete a comment successfully", async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Comment deleted.");

      // Verify comment is gone
      const count = await Comment.countDocuments({ _id: commentId });
      expect(count).toBe(0);
    });

    it("should return 404 for non-existent comment", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/api/comments/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Comment not found.");
    });

    it("should return 403 when deleting someone else's comment", async () => {
      const otherRes = await request(app).post("/api/auth/register").send({
        username: "otherdeleter",
        email: "otherdeleter@example.com",
        password: "password123",
      });
      const otherToken = otherRes.body.accessToken;

      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Not authorized.");
    });
  });
});
