
const currentLevel = document.getElementById("currentLevel");
const currentStatus = document.getElementById("currentStatus");
const averageLevel = document.getElementById("averageLevel");
const trendElement = document.getElementById("trend");
const lastUpdated = document.getElementById("lastUpdated");
const readingsTable = document.getElementById("readingsTable");

let levelChart = null;

function getStatus(level) {
  if (level < 100) return "Normal";
  if (level < 150) return "Alert";
  return "Danger";
}

async function updateDashboard() {
  try {
    const [readingsResponse, summaryResponse] = await Promise.all([
      fetch("/api/readings"),
      fetch("/api/summary")
    ]);

    if (!readingsResponse.ok || !summaryResponse.ok) {
      throw new Error("Could not load sensor data.");
    }

    const readings = await readingsResponse.json();
    const summary = await summaryResponse.json();

    if (readings.length === 0) {
      lastUpdated.textContent = "Waiting for sensor readings...";
      return;
    }

    const latest = readings[0];
    const status = getStatus(latest.waterLevelCm);

    currentLevel.textContent = latest.waterLevelCm.toFixed(1);
    currentStatus.textContent = status;
    currentStatus.className = status.toLowerCase();
    averageLevel.textContent = summary.average.toFixed(1);
    trendElement.textContent = summary.trend;
    lastUpdated.textContent =
      "Last updated: " + new Date(latest.timestamp).toLocaleTimeString();

    readingsTable.innerHTML = readings.slice(0, 10).map(reading => {
      const readingStatus = getStatus(reading.waterLevelCm);

      return `
        <tr>
          <td>${reading.sensorId}</td>
          <td>${reading.waterLevelCm.toFixed(1)}</td>
          <td>${readingStatus}</td>
          <td>${new Date(reading.timestamp).toLocaleTimeString()}</td>
        </tr>
      `;
    }).join("");

    const chartReadings = readings.slice(0, 10).reverse();

    const chartData = {
      labels: chartReadings.map(r =>
        new Date(r.timestamp).toLocaleTimeString()
      ),
      datasets: [{
        label: "Water Level (cm)",
        data: chartReadings.map(r => r.waterLevelCm),
        borderColor: "#0284c7",
        backgroundColor: "rgba(2, 132, 199, 0.15)",
        fill: true,
        tension: 0.3
      }]
    };

    if (levelChart) {
      levelChart.data = chartData;
      levelChart.update();
    } else {
      const canvas = document.getElementById("levelChart");

      levelChart = new Chart(canvas, {
        type: "line",
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Water Level (cm)"
              }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error("Dashboard error:", error);
    lastUpdated.textContent =
      "Unable to load data. Check the server connection.";
  }
}

updateDashboard();
setInterval(updateDashboard, 5000);
