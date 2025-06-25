import { Hono } from "hono";

const app = new Hono();

// Basic health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

export default app;