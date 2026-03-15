import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BiteShare API",
      version: "1.0.0",
      description: "API documentation for the BiteShare food-sharing platform",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1a2b3c4d5e6f7a8b9c0d" },
            username: { type: "string", example: "johndoe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            profileImage: { type: "string", example: "/uploads/avatar.jpg" },
            googleId: { type: "string", example: "112233445566778899" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Post: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1a2b3c4d5e6f7a8b9c0d" },
            dishName: { type: "string", example: "Margherita Pizza" },
            restaurant: { type: "string", example: "Pizza Palace" },
            description: { type: "string", example: "Best pizza in town!" },
            image: { type: "string", example: "/uploads/pizza.jpg" },
            owner: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/User" },
              ],
            },
            commentCount: { type: "integer", example: 5 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1a2b3c4d5e6f7a8b9c0d" },
            content: { type: "string", example: "Looks delicious!" },
            post: { type: "string", example: "664f1a2b3c4d5e6f7a8b9c0d" },
            owner: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/User" },
              ],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        TokenPair: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        PaginatedPosts: {
          type: "object",
          properties: {
            posts: {
              type: "array",
              items: { $ref: "#/components/schemas/Post" },
            },
            total: { type: "integer" },
            page: { type: "integer" },
            pages: { type: "integer" },
          },
        },
        PaginatedComments: {
          type: "object",
          properties: {
            comments: {
              type: "array",
              items: { $ref: "#/components/schemas/Comment" },
            },
            total: { type: "integer" },
            page: { type: "integer" },
            pages: { type: "integer" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default swaggerSpec;
