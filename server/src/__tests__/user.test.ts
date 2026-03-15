import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import User from "../models/user";

let accessToken: string;
let userId: string;

async function registerUser(): Promise<{ accessToken: string; userId: string }> {
  const res = await request(app).post("/api/auth/register").send({
    username: "profileuser",
    email: "profileuser@example.com",
    password: "password123",
  });
  return { accessToken: res.body.accessToken, userId: res.body.user._id };
}

describe("User API", () => {
  beforeEach(async () => {
    const auth = await registerUser();
    accessToken = auth.accessToken;
    userId = auth.userId;
  });

  // ─── GET USER BY ID ──────────────────────────────────────

  describe("GET /api/users/:id", () => {
    it("should get a user by ID", async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.username).toBe("profileuser");
      expect(res.body.email).toBe("profileuser@example.com");
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).not.toHaveProperty("refreshTokens");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found.");
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app).get(`/api/users/${userId}`);
      expect(res.status).toBe(401);
    });
  });

  // ─── UPDATE PROFILE ──────────────────────────────────────

  describe("PUT /api/users/profile", () => {
    it("should update username", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ username: "newusername" });

      expect(res.status).toBe(200);
      expect(res.body.username).toBe("newusername");
      expect(res.body.email).toBe("profileuser@example.com");
    });

    it("should remove profile image when removeImage is true", async () => {
      // First set a profile image by updating the user directly
      await User.findByIdAndUpdate(userId, { profileImage: "/uploads/test.jpg" });

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ removeImage: "true" });

      expect(res.status).toBe(200);
      expect(res.body.profileImage).toBe("");
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .send({ username: "hacker" });

      expect(res.status).toBe(401);
    });

    it("should trim whitespace from username", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ username: "  trimmedname  " });

      expect(res.status).toBe(200);
      expect(res.body.username).toBe("trimmedname");
    });
  });
});
