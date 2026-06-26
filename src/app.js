require("dotenv").config();

const cors = require("cors");
const express = require("express");
const apiRoutes = require("./routes/index");

const app = express();
const port = process.env.PORT || 3000;

app.set("json replacer", (key, value) => {
  if (typeof value === "bigint") return value.toString();
  return value;
});

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Internal server error" : error.message;

  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({ message });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Crypto exchange API listening on port ${port}`);
  });
}

module.exports = app;
