
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const {
  S3Client,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool();

// AWS SDK uses your configured local AWS CLI credentials
const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

// Test API
app.get("/", (req, res) => {
  res.send("AWS S3 File Importer API is running!");
});

// Fetch S3 file and save its text in PostgreSQL
app.post("/api/process", async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: process.env.S3_KEY,
    });

    const result = await s3.send(command);
    const content = await result.Body.transformToString();

    const query = `
      INSERT INTO extracted_files (file_name, content)
      VALUES ($1, $2)
      RETURNING *
    `;

    const saved = await pool.query(query, [
      process.env.S3_KEY,
      content,
    ]);

    res.json({
      message: "File imported successfully!",
      data: saved.rows[0],
    });
  } catch (error) {
    console.error("Import failed:", error);
    res.status(500).json({
      message: "Failed to import file",
      error: error.message,
    });
  }
});

// Get all imported records
app.get("/api/files", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM extracted_files ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      message: "Failed to fetch records",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
