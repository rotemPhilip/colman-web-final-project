import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import Comment from "../models/comment";

let accessToken: string;
let userId: string;

async function registerAndLogin(): Promise<{ accessToken: string; userId: string }> {
  const res = await request(app).post("/api/auth/register").send({
    username: "postuser",
    email: "postuser@example.com",
    password: "password123",
  });
  return { accessToken: res.body.accessToken, userId: res.body.user._id };
}

describe("Post API", () => {
  beforeEach(async () => {
    const auth = await registerAndLogin();
    accessToken = auth.accessToken;
    userId = auth.userId;
  });

  // ─── CREATE POST ──────────────────────────────────────────

  describe("POST /api/posts", () => {
    it("should create a post successfully", async () => {
      const res = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          dishName: "Margherita Pizza",
          restaurant: "Pizza Palace",
          description: "Best pizza in town!",
        });

      expect(res.status).toBe(201);
      expect(res.body.dishName).toBe("Margherita Pizza");
      expect(res.body.restaurant).toBe("Pizza Palace");
      expect(res.body.description).toBe("Best pizza in town!");
      expect(res.body.owner).toBeDefined();
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          dishName: "Pizza",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dish name and restaurant are required.");
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app).post("/api/posts").send({
        dishName: "Pizza",
        restaurant: "Place",
        description: "Good",
      });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET ALL POSTS ────────────────────────────────────────

  describe("GET /api/posts", () => {
    beforeEach(async () => {
      // Create some posts
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post("/api/posts")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            dishName: `Dish ${i}`,
            restaurant: `Restaurant ${i}`,
            description: `Description ${i}`,
          });
      }
    });

    it("should get all posts with pagination", async () => {
      const res = await request(app)
        .get("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(3);
      expect(res.body.total).toBe(3);
      expect(res.body.page).toBe(1);
      expect(res.body).toHaveProperty("pages");
    });

    it("should respect pagination parameters", async () => {
      const res = await request(app)
        .get("/api/posts?page=1&limit=2")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(2);
      expect(res.body.total).toBe(3);
      expect(res.body.pages).toBe(2);
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/api/posts");
      expect(res.status).toBe(401);
    });
  });

  // ─── GET POST BY ID ──────────────────────────────────────

  describe("GET /api/posts/:id", () => {
    let postId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          dishName: "Sushi Roll",
          restaurant: "Sushi Bar",
          description: "Fresh sushi",
        });
      postId = res.body._id;
    });

    it("should get a post by ID", async () => {
      const res = await request(app)
        .get(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.dishName).toBe("Sushi Roll");
      expect(res.body).toHaveProperty("commentCount");
    });

    it("should return 404 for non-existent post", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/posts/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Post not found.");
    });
  });

  // ─── GET POSTS BY USER ───────────────────────────────────

  describe("GET /api/posts/user/:userId", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          dishName: "User Dish",
          restaurant: "User Restaurant",
          description: "User's post",
        });
    });

    it("should get posts by user ID", async () => {
      const res = await request(app)
        .get(`/api/posts/user/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].dishName).toBe("User Dish");
    });

    it("should return empty array for user with no posts", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/posts/user/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  // ─── UPDATE POST ──────────────────────────────────────────

  describe("PUT /api/posts/:id", () => {
    let postId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          dishName: "Original Dish",
          restaurant: "Original Restaurant",
          description: "Original description",
        });
      postId = res.body._id;
    });

    it("should update a post successfully", async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          dishName: "Updated Dish",
          description: "Updated description",
        });

      expect(res.status).toBe(200);
      expect(res.body.dishName).toBe("Updated Dish");
      expect(res.body.description).toBe("Updated description");
      expect(res.body.restaurant).toBe("Original Restaurant");
    });

    it("should return 404 for non-existent post", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/posts/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ dishName: "Updated" });

      expect(res.status).toBe(404);
    });

    it("should return 403 when updating someone else's post", async () => {
      // Create another user
      const otherRes = await request(app).post("/api/auth/register").send({
        username: "otheruser",
        email: "other@example.com",
        password: "password123",
      });
      const otherToken = otherRes.body.accessToken;

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ dishName: "Hacked!" });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Not authorized.");
    });
  });

  // ─── DELETE POST ──────────────────────────────────────────

  describe("DELETE /api/posts/:id", () => {
    let postId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          dishName: "To Delete",
          restaurant: "Restaurant",
          description: "Will be deleted",
        });
      postId = res.body._id;
    });

    it("should delete a post successfully", async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Post deleted.");

      // Verify post is gone
      const getRes = await request(app)
        .get(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(getRes.status).toBe(404);
    });

    it("should delete associated comments when deleting a post", async () => {
      // Add a comment to the post
      await request(app)
        .post(`/api/comments/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "A comment" });

      // Delete the post
      await request(app)
        .delete(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // Verify comments are gone
      const commentsCount = await Comment.countDocuments({ post: postId });
      expect(commentsCount).toBe(0);
    });

    it("should return 404 for non-existent post", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/api/posts/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 403 when deleting someone else's post", async () => {
      const otherRes = await request(app).post("/api/auth/register").send({
        username: "otheruser2",
        email: "other2@example.com",
        password: "password123",
      });
      const otherToken = otherRes.body.accessToken;

      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });
});
