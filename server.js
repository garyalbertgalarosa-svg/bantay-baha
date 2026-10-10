
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Allow the server to receive JSON data.
app.use(express.json());

// Serve the website files from the public folder.
app.use(express.static(path.join(__dirname, "public")));

// Store readings in memory.
const readings = [];

function getStatus(level) {
  if (level < 100) return "Normal";
  if (level < 150) return "Alert";
  return "Danger";
}

// POST: Save a new water-level reading.
app.post("/api/readings", (req, res) => {
  const { sensorId, waterLevelCm, timestamp } = req.body;

  if (
    !sensorId ||
    typeof sensorId !== "string" ||
    typeof waterLevelCm !== "number" ||
    !Number.isFinite(waterLevelCm) ||
    waterLevelCm < 0 ||
    waterLevelCm > 500
  ) {
    return res.status(400).json({
      error: "Provide a sensorId and a waterLevelCm number from 0 to 500."
    });
  }

  const reading = {
    sensorId,
    waterLevelCm,
    timestamp: timestamp || new Date().toISOString()
  };

  readings.push(reading);

  return res.status(201).json({
    message: "Reading saved successfully",
    reading
  });
});

// GET: Return the 50 newest readings first.
app.get("/api/readings", (req, res) => {
  res.json(readings.slice(-50).reverse());
});

// GET: Calculate summary statistics.
app.get("/api/summary", (req, res) => {
  const levels = readings.map((r) => r.waterLevelCm);

  const average = levels.length
    ? levels.reduce((sum, level) => sum + level, 0) / levels.length
    : 0;

  const statusCounts = {
    Normal: 0,
    Alert: 0,
    Danger: 0
  };

  readings.forEach((reading) => {
    statusCounts[getStatus(reading.waterLevelCm)]++;
  });

  const newestFirst = readings.slice(-10).reverse();
  const recentFive = readings.slice(-5);
  const previousFive = readings.slice(-10, -5);

  let trend = "steady";

  if (recentFive.length === 5 && previousFive.length === 5) {
    const recentAverage =
      recentFive.reduce((sum, r) => sum + r.waterLevelCm, 0) / 5;
    const previousAverage =
      previousFive.reduce((sum, r) => sum + r.waterLevelCm, 0) / 5;

    if (recentAverage > previousAverage) trend = "rising";
    if (recentAverage < previousAverage) trend = "falling";
  }

  res.json({
    totalReadings: levels.length,
    average: Number(average.toFixed(2)),
    minimum: levels.length ? Math.min(...levels) : 0,
    maximum: levels.length ? Math.max(...levels) : 0,
    statusCounts,
    trend,
    latestReadings: newestFirst
  });
});

// Basic health check.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Bantay Baha API is running" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bantay Baha server running on port ${PORT}`);
});
