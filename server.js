// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Use middleware to parse URL-encoded and JSON bodies.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the "public" folder.
app.use(express.static('public'));

// In-memory data store for sensor data.
let sensorData = {};

// Endpoint to update sensor data.
// Example: /update?device=plant1&temp=25.3&hum=55.2&soil=400&ldr=300
app.get('/update', (req, res) => {
  const { device, temp, hum, soil, ldr } = req.query;
  if (!device) {
    return res.status(400).send('Missing device parameter.');
  }
  sensorData[device] = {
    temperature: parseFloat(temp),
    humidity: parseFloat(hum),
    soil: parseInt(soil),
    ldr: parseInt(ldr),
    updatedAt: new Date().toISOString()
  };
  console.log(`Updated sensor data for ${device}:`, sensorData[device]);
  res.send(`Data received for ${device}`);
});

// API endpoint to get sensor data as JSON.
app.get('/api/devices', (req, res) => {
  res.json(sensorData);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
