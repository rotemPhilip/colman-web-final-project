import request from "supertest";
import app from "../app";

describe("Auth API", () => {
  // ─── REGISTER ───────────────────────────────────────────

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user).toHaveProperty("_id");
      expect(res.body.user.username).toBe("testuser");
      expect(res.body.user.email).toBe("test@example.com");
    });

    it("should return 400 if fields are missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("All fields are required.");
    });

    it("should return 409 if email already exists", async () => {
      await request(app).post("/api/auth/register").send({
        username: "testuser1",
        email: "duplicate@example.com",
        password: "password123",
      });

      const res = await request(app).post("/api/auth/register").send({
        username: "testuser2",
        email: "duplicate@example.com",
        password: "password456",
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("Email already in use.");
    });
  });

  // ─── LOGIN ──────────────────────────────────────────────

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        username: "loginuser",
        email: "login@example.com",
        password: "password123",
      });
    });

    it("should login with valid username and password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "loginuser",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user.username).toBe("loginuser");
    });

    it("should login with valid email and password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "login@example.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
    });

    it("should return 400 if fields are missing", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "loginuser",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username/email and password are required.");
    });

    it("should return 401 for wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "loginuser",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid username/email or password.");
    });

    it("should return 401 for non-existent user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "nonexistent",
        password: "password123",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid username/email or password.");
    });
  });

  // ─── REFRESH TOKEN ──────────────────────────────────────

  describe("POST /api/auth/refresh", () => {
    let refreshTokenValue: string;

    beforeEach(async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "refreshuser",
        email: "refresh@example.com",
        password: "password123",
      });
      refreshTokenValue = res.body.refreshToken;
    });

    it("should return new token pair with valid refresh token", async () => {
      // Wait 1 second to ensure JWT timestamp differs
      await new Promise((r) => setTimeout(r, 1000));

      const res = await request(app).post("/api/auth/refresh").send({
        refreshToken: refreshTokenValue,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
    });

    it("should return 400 if refresh token is missing", async () => {
      const res = await request(app).post("/api/auth/refresh").send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Refresh token is required.");
    });

    it("should return 403 for invalid refresh token", async () => {
      const res = await request(app).post("/api/auth/refresh").send({
        refreshToken: "invalid-token",
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Invalid refresh token.");
    });

    it("should invalidate old refresh token after use", async () => {
      // Wait to ensure different JWT token
      await new Promise((r) => setTimeout(r, 1000));

      // Use the refresh token and get a new one
      const refreshRes = await request(app).post("/api/auth/refresh").send({
        refreshToken: refreshTokenValue,
      });
      expect(refreshRes.status).toBe(200);

      // The new token should work
      const newToken = refreshRes.body.refreshToken;
      await new Promise((r) => setTimeout(r, 1000));
      const res2 = await request(app).post("/api/auth/refresh").send({
        refreshToken: newToken,
      });
      expect(res2.status).toBe(200);
    });
  });

  // ─── LOGOUT ─────────────────────────────────────────────

  describe("POST /api/auth/logout", () => {
    let refreshTokenValue: string;

    beforeEach(async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "logoutuser",
        email: "logout@example.com",
        password: "password123",
      });
      refreshTokenValue = res.body.refreshToken;
    });

    it("should logout successfully", async () => {
      const res = await request(app).post("/api/auth/logout").send({
        refreshToken: refreshTokenValue,
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Logged out.");
    });

    it("should return 400 if refresh token is missing", async () => {
      const res = await request(app).post("/api/auth/logout").send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Refresh token is required.");
    });

    it("should invalidate the refresh token after logout", async () => {
      await request(app).post("/api/auth/logout").send({
        refreshToken: refreshTokenValue,
      });

      const res = await request(app).post("/api/auth/refresh").send({
        refreshToken: refreshTokenValue,
      });

      expect(res.status).toBe(403);
    });
  });

  // ─── GET ME ─────────────────────────────────────────────

  describe("GET /api/auth/me", () => {
    let accessToken: string;

    beforeEach(async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "meuser",
        email: "me@example.com",
        password: "password123",
      });
      accessToken = res.body.accessToken;
    });

    it("should return current user data", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.username).toBe("meuser");
      expect(res.body.email).toBe("me@example.com");
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).not.toHaveProperty("refreshTokens");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
    });
  });
});

