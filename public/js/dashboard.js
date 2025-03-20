// public/js/dashboard.js

// Function to toggle hamburger menu
function setupHamburgerMenu() {
  const hamburger = document.getElementById('hamburger-menu');
  const navMenu = document.getElementById('nav-menu');
  
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }
}

// Run setup when DOM is loaded
document.addEventListener('DOMContentLoaded', setupHamburgerMenu);

// Global storage for chart instances.
let charts = {};

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

// Modify the createDoughnutChart function to be responsive
function createDoughnutChart(canvasId, percentage, parameterType, value) {
  // Get canvas context
  let ctx = document.getElementById(canvasId).getContext('2d');
  
  // Check if we're on mobile (viewport width less than 768px)
  const isMobile = window.innerWidth < 768;
  
  // Determine chart color based on parameter type and value
  let chartColor = '#FFA725'; // Default orange color
  
  // Define thresholds for each parameter
  const thresholds = {
    temp: { good: { min: 18, max: 28 }, fair: { min: 15, max: 32 } },
    hum: { good: { min: 40, max: 70 }, fair: { min: 30, max: 80 } },
    soil: { good: { min: 300, max: 700 }, fair: { min: 200, max: 800 } },
    ldr: { good: { min: 300, max: 800 }, fair: { min: 200, max: 900 } }
  };
  
  // Get the appropriate threshold based on parameter type
  let threshold = thresholds.temp; // Default
  if (parameterType === 'humChart') threshold = thresholds.hum;
  if (parameterType === 'soilChart') threshold = thresholds.soil;
  if (parameterType === 'ldrChart') threshold = thresholds.ldr;
  
  // Determine color based on thresholds
  if (value >= threshold.good.min && value <= threshold.good.max) {
    chartColor = '#22c55e'; // Green - good condition
  } else if (value >= threshold.fair.min && value <= threshold.fair.max) {
    chartColor = '#f97316'; // Orange - fair condition
  } else {
    chartColor = '#ef4444'; // Red - poor condition
  }

  // Create the appropriate chart based on screen size
  let chart;
  
  if (isMobile && !canvasId.includes('healthChart')) {
    // Create line chart for mobile
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', ''],
        datasets: [{
          data: [0, percentage],
          borderColor: chartColor,
          backgroundColor: chartColor + '20',
          borderWidth: 4,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        scales: {
          xAxes: [{ display: false }],
          yAxes: [{ 
            display: false,
            ticks: { min: 0, max: 100 }
          }]
        },
        tooltips: { enabled: false },
        hover: { mode: null },
        animation: {
          duration: 1000
        }
      }
    });
  } else {
    // Create doughnut chart for desktop or health indicator
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [percentage, 100 - percentage],
          backgroundColor: [chartColor, '#555555'],
          borderWidth: 0
        }]
      },
      options: {
        cutoutPercentage: 70,
        tooltips: { enabled: false },
        hover: { mode: null },
        animation: {
          duration: 500,
          animateRotate: true,
          animateScale: false
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

  // Store the chart instance so we can destroy it later
  charts[canvasId] = chart;
  return chart;
}

// Modify the createDeviceCard function to include a health chart
function createDeviceCard(deviceId, data) {
  // Calculate plant health
  const health = calculatePlantHealth(data);
  
  // Select appropriate emoji based on health status
  let healthEmoji = '';
  if (health.score > 80) {
    healthEmoji = '🌱'; // Excellent - sprouting plant
  } else if (health.score > 60) {
    healthEmoji = '🌿'; // Good - healthy plant
  } else if (health.score > 40) {
    healthEmoji = '🍃'; // Fair - leaves
  } else if (health.score > 20) {
    healthEmoji = '🍂'; // Poor - fallen leaves
  } else {
    healthEmoji = '🥀'; // Critical - wilted flower
  }
  
  // Check if we're on mobile
  const isMobile = window.innerWidth < 768;
  
  let card = document.createElement('div');
  card.className = 'card';
  card.id = `card-${deviceId}`;
  
  // Different layout for mobile vs desktop
  if (isMobile) {
    card.innerHTML = `
      <div class="card-header"><h3>${deviceId}</h3></div>
      <div class="card-body">
        <div class="plant-health" style="text-align: center; margin-bottom: 1.5rem;">
          <div class="health-chart-container" style="width: 120px; height: 120px; margin: 0 auto;">
            <canvas id="healthChart-${deviceId}" width="120" height="120"></canvas>
            <div class="health-emoji" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2rem;">
              ${healthEmoji}
            </div>
          </div>
          <div class="health-indicator" style="display: inline-block; padding: 0.5rem 1.5rem; border-radius: 1rem; background-color: ${health.color}20; color: ${health.color}; font-weight: bold; margin: 0.5rem 0;">
            <span>${health.status} (${health.score}%)</span>
          </div>
        </div>
        <div class="sensor-row" style="display: flex; flex-direction: row; justify-content: space-around; align-items: center;">
          <div class="sensor-chart-container" style="width: 100%;">
            <canvas id="tempChart-${deviceId}" width="100%" height="80"></canvas>
            <p>Temperature</p>
          </div>
          <div class="sensor-chart-container" style="width: 100%;">
            <canvas id="humChart-${deviceId}" width="100%" height="80"></canvas>
            <p>Humidity</p>
          </div>
          <div class="sensor-chart-container" style="width: 100%;">
            <canvas id="soilChart-${deviceId}" width="100%" height="80"></canvas>
            <p>Soil Moisture</p>
          </div>
          <div class="sensor-chart-container" style="width: 100%;">
            <canvas id="ldrChart-${deviceId}" width="100%" height="80"></canvas>
            <p>Light</p>
          </div>
        </div>
      </div>
      <div class="card-footer">
        Updated: ${data.updatedAt}
      </div>
    `;
  } else {
    // Desktop layout (unchanged)
    card.innerHTML = `
      <div class="card-header"><h3>${deviceId}</h3></div>
      <div class="card-body">
        <div class="plant-health" style="text-align: center; margin-bottom: 1.5rem;">
          <div class="health-label" style="font-size: 1.2rem; margin-bottom: 0.5rem; color: #fff;">
            Health ${healthEmoji}
          </div>
          <div class="health-indicator" style="display: inline-block; padding: 0.5rem 1.5rem; border-radius: 1rem; background-color: ${health.color}20; color: ${health.color}; font-weight: bold; margin-bottom: 0.5rem;">
            <span>${health.status} (${health.score}%)</span>
          </div>
          <div class="health-bar" style="height: 8px; width: 100%; background-color: #333; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${health.score}%; background-color: ${health.color};"></div>
          </div>
        </div>
        <div class="sensor-row" style="display: flex; flex-direction: row; justify-content: space-around; align-items: center;">
          <div class="sensor-chart-container">
            <canvas id="tempChart-${deviceId}" width="200" height="200"></canvas>
            <p>Temp</p>
          </div>
          <div class="sensor-chart-container">
            <canvas id="humChart-${deviceId}" width="200" height="200"></canvas>
            <p>Hum</p>
          </div>
          <div class="sensor-chart-container">
            <canvas id="soilChart-${deviceId}" width="200" height="200"></canvas>
            <p>Soil</p>
          </div>
          <div class="sensor-chart-container">
            <canvas id="ldrChart-${deviceId}" width="200" height="200"></canvas>
            <p>Light</p>
          </div>
        </div>
      </div>
      <div class="card-footer">
        Updated: ${data.updatedAt}
      </div>
    `;
  }
  
  return card;
}

// Update the updateDashboard function to create the health chart on mobile
async function updateDashboard() {
  try {
    const response = await fetch('/api/devices');
    const devices = await response.json();
    const dashboard = document.getElementById('dashboard');
    
    // Check if we're on mobile
    const isMobile = window.innerWidth < 768;
    
    // Iterate through devices from API response
    for (const device in devices) {
      const data = devices[device];
      let card = document.getElementById(`card-${device}`);
      if (!card) {
         // Create and append new card if it doesn't exist
         card = createDeviceCard(device, data);
         dashboard.appendChild(card);
      } else {
         // Update existing card's content to refresh health indicator and status
         const updatedCard = createDeviceCard(device, data);
         card.innerHTML = updatedCard.innerHTML;
      }
      
      // Destroy any existing chart instances for this device
      const metrics = ["tempChart", "humChart", "soilChart", "ldrChart"];
      if (isMobile) metrics.push("healthChart");
      
      metrics.forEach(metric => {
         let canvasId = `${metric}-${device}`;
         if (charts[canvasId]){
            charts[canvasId].destroy();
         }
      });
      
      // Normalize sensor values to percentages
      let tempPct = Math.min(100, data.temperature); // Assuming 0–50°C scale
      let humPct = Math.min(100, data.humidity);
      let soilPct = Math.min(100, ((1023 - data.soil) / 1023) * 100); // Inverted sensor reading
      let ldrPct = Math.min(100, (data.ldr / 1023) * 100);
      
      // Calculate health for the health chart
      const health = calculatePlantHealth(data);
      
      // Recreate charts with a slight delay to ensure canvases are rendered
      setTimeout(() => {
         createDoughnutChart(`tempChart-${device}`, tempPct, 'tempChart', data.temperature);
         createDoughnutChart(`humChart-${device}`, humPct, 'humChart', data.humidity);
         createDoughnutChart(`soilChart-${device}`, soilPct, 'soilChart', data.soil);
         createDoughnutChart(`ldrChart-${device}`, ldrPct, 'ldrChart', data.ldr);
         
         // Create health chart for mobile
         if (isMobile) {
           createDoughnutChart(`healthChart-${device}`, health.score, 'healthChart', health.score);
         }
      }, 100);
    }
  } catch (err) {
    console.error('Error fetching device data:', err);
  }
}

// Add window resize listener to handle responsive changes
window.addEventListener('resize', () => {
  // Refresh the dashboard when window size changes
  updateDashboard();
});

// Initial update and periodic refresh every 10 seconds.
updateDashboard();
setInterval(updateDashboard, 10000);

// Function to calculate plant health based on sensor values
function calculatePlantHealth(data) {
  // Define ideal ranges for each parameter
  const idealRanges = {
    temperature: { min: 18, max: 28 }, // Celsius
    humidity: { min: 40, max: 70 },    // Percentage
    soil: { min: 300, max: 700 },      // Soil moisture (0-1023, inverted)
    ldr: { min: 300, max: 800 }        // Light level (0-1023)
  };

  // Calculate health score for each parameter (0-100)
  const tempScore = calculateParameterScore(data.temperature, idealRanges.temperature.min, idealRanges.temperature.max);
  const humScore = calculateParameterScore(data.humidity, idealRanges.humidity.min, idealRanges.humidity.max);
  const soilScore = calculateParameterScore(data.soil, idealRanges.soil.min, idealRanges.soil.max);
  const ldrScore = calculateParameterScore(data.ldr, idealRanges.ldr.min, idealRanges.ldr.max);

  // Overall health is the average of all parameters (0-100)
  const overallHealth = Math.round((tempScore + humScore + soilScore + ldrScore) / 4);
  
  // Return health status and score
  let status = 'Critical';
  let color = '#ef4444'; // Red
  
  if (overallHealth > 80) {
    status = 'Excellent';
    color = '#22c55e'; // Green
  } else if (overallHealth > 60) {
    status = 'Good';
    color = '#84cc16'; // Light green
  } else if (overallHealth > 40) {
    status = 'Fair';
    color = '#facc15'; // Yellow
  } else if (overallHealth > 20) {
    status = 'Poor';
    color = '#f97316'; // Orange
  }
  
  return {
    score: overallHealth,
    status: status,
    color: color
  };
}

// Helper function to calculate score for a parameter
function calculateParameterScore(value, min, max) {
  if (value < min) {
    // Below ideal range - score decreases as it gets further from min
    return Math.max(0, 100 - (min - value) * 5);
  } else if (value > max) {
    // Above ideal range - score decreases as it gets further from max
    return Math.max(0, 100 - (value - max) * 5);
  } else {
    // Within ideal range - perfect score
    return 100;
  }
}