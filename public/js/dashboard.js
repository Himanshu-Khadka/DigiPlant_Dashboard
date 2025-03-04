// public/js/dashboard.js

// Force Chart.js to use a devicePixelRatio of 1 to prevent canvas scaling issues.
Chart.defaults.global.devicePixelRatio = 1;

// Register a Chart.js plugin to display center text in doughnut charts.
Chart.pluginService.register({
  beforeDraw: function(chart) {
    if (chart.config.options.center) {
      var ctx = chart.chart.ctx;
      var centerConfig = chart.config.options.center;
      var fontStyle = centerConfig.fontStyle || 'Orbitron';
      var txt = centerConfig.text;
      var color = centerConfig.color || '#FFF';
      var sidePadding = centerConfig.sidePadding || 20;
      var sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2);
      ctx.font = "bold " + (chart.innerRadius / 1.5) + "px " + fontStyle;
      var textWidth = ctx.measureText(txt).width;
      var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;
      var widthRatio = elementWidth / textWidth;
      var newFontSize = Math.floor((chart.innerRadius / 1.5) * widthRatio);
      var elementHeight = (chart.innerRadius * 2);
      var fontSizeToUse = Math.min(newFontSize, elementHeight);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
      var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
      ctx.font = "bold " + fontSizeToUse + "px " + fontStyle;
      ctx.fillStyle = color;
      ctx.fillText(txt, centerX, centerY);
    }
  }
});

// Function to create a doughnut chart with center text.
function createDoughnutChart(canvasId, percentage) {
  let ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [percentage, 100 - percentage],
        backgroundColor: ['#FFA725', '#555555'],
        borderWidth: 0
      }]
    },
    options: {
      cutoutPercentage: 70,
      tooltips: { enabled: false },
      hover: { mode: null },
      animation: {
        animateRotate: true,
        animateScale: true
      },
      responsive: true,
      maintainAspectRatio: false,
      center: {
        text: percentage.toFixed(0) + '%',
        color: '#FFF',
        fontStyle: 'Orbitron',
        sidePadding: 20
      }
    }
  });
}

// Function to create a card for a device with sensor charts laid out horizontally.
function createDeviceCard(deviceId, data) {
  let card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-header">Device: ${deviceId}</div>
    <div class="card-body">
      <div class="sensor-row">
        <div class="sensor-chart-container">
          <canvas id="tempChart-${deviceId}"></canvas>
          <p>Temp</p>
        </div>
        <div class="sensor-chart-container">
          <canvas id="humChart-${deviceId}"></canvas>
          <p>Hum</p>
        </div>
        <div class="sensor-chart-container">
          <canvas id="soilChart-${deviceId}"></canvas>
          <p>Soil</p>
        </div>
        <div class="sensor-chart-container">
          <canvas id="ldrChart-${deviceId}"></canvas>
          <p>Light</p>
        </div>
      </div>
    </div>
    <div class="card-footer">
      Updated: ${data.updatedAt}
    </div>
  `;
  return card;
}

// Function to update the dashboard by fetching sensor data.
async function updateDashboard() {
  try {
    const response = await fetch('/api/devices');
    const devices = await response.json();
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = ''; // Clear previous content

    for (const device in devices) {
      const data = devices[device];
      let card = createDeviceCard(device, data);
      dashboard.appendChild(card);

      // Normalize sensor values to percentages.
      let tempPct = Math.min(100, (data.temperature / 50) * 100); // Assuming 0–50°C scale.
      let humPct = Math.min(100, data.humidity);
      let soilPct = Math.min(100, ((1023 - data.soil) / 1023) * 100); // Inverted sensor reading.
      let ldrPct = Math.min(100, (data.ldr / 1023) * 100);

      // Delay slightly to ensure canvases are rendered.
      setTimeout(() => {
        createDoughnutChart(`tempChart-${device}`, tempPct);
        createDoughnutChart(`humChart-${device}`, humPct);
        createDoughnutChart(`soilChart-${device}`, soilPct);
        createDoughnutChart(`ldrChart-${device}`, ldrPct);
      }, 100);
    }
  } catch (err) {
    console.error('Error fetching device data:', err);
  }
}

// Initial update and periodic refresh every 10 seconds.
updateDashboard();
setInterval(updateDashboard, 10000);
