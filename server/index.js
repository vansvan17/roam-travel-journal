import app from "./app.js";
import express from "express";
import { resolve } from "node:path";
app.use(express.static(resolve("dist")));
app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
app.listen(process.env.PORT || 3001, "127.0.0.1", () =>
  console.log(`Roam server ready on port ${process.env.PORT || 3001}`),
);
