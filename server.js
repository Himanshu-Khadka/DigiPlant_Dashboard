// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Middleware: Parse URL-encoded bodies and JSON.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// In-memory data store for sensor data.
// Each device sends its unique "device" ID.
let sensorData = {};

// Endpoint to receive sensor updates.
// Example: /update?device=plant1&temp=25.3&hum=55.2&soil=400&ldr=300
app.get('/update', (req, res) => {
  const { device, temp, hum, soil, ldr } = req.query;
  if (!device) {
    return res.status(400).send('Missing device parameter.');
  }
  sensorData[device] = {
    temperature: temp,
    humidity: hum,
    soil: soil,
    ldr: ldr,
    updatedAt: new Date().toISOString()
  };
  console.log(`Updated sensor data for ${device}:`, sensorData[device]);
  res.send(`Data received for ${device}`);
});

// API endpoint to get all sensor data as JSON.
app.get('/api/devices', (req, res) => {
  res.json(sensorData);
});

// Serve a static dashboard page.
app.get('/', (req, res) => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Plant Sensor Dashboard</title>
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
      <style>
        body { padding: 20px; }
        .device { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>Plant Sensor Dashboard</h1>
      <div id="devices"></div>
      <script>
        async function fetchDevices() {
          const response = await fetch('/api/devices');
          const devices = await response.json();
          const container = document.getElementById('devices');
          container.innerHTML = '';
          for (const device in devices) {
            const data = devices[device];
            const card = document.createElement('div');
            card.className = 'device card';
            card.innerHTML = \`
              <div class="card-body">
                <h5 class="card-title">Device: \${device}</h5>
                <p class="card-text">
                  Temperature: \${data.temperature || 'N/A'} °C<br>
                  Humidity: \${data.humidity || 'N/A'} %<br>
                  Soil: \${data.soil || 'N/A'}<br>
                  LDR: \${data.ldr || 'N/A'}<br>
                  Updated: \${data.updatedAt}
                </p>
              </div>
            \`;
            container.appendChild(card);
          }
        }
        // Poll the server every 10 seconds for updates.
        setInterval(fetchDevices, 10000);
        fetchDevices();
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
