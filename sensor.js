
const SENSOR_ID = "CREEK-01";
const API_URL = "http://localhost:3000/api/readings";

let waterLevelCm = 85;

async function sendReading() {
  // A real IoT setup would replace this simulation with a
  // microcontroller and an ultrasonic water-level sensor.
  waterLevelCm += Math.random() * 6 - 3;

  waterLevelCm = Math.max(0, Math.min(500, waterLevelCm));

  const reading = {
    sensorId: SENSOR_ID,
    waterLevelCm: Number(waterLevelCm.toFixed(1)),
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reading)
    });

    if (!response.ok) {
      console.error("Failed to send reading:", response.status);
      return;
    }

    console.log("Reading sent:", reading);
  } catch (error) {
    console.error("Could not connect to the server:", error.message);
  }
}

sendReading();
setInterval(sendReading, 5000);
