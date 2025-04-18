// public/js/dashboard.js

// Theme toggle functionality
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const sunIcon = themeToggle.querySelector('.sun-icon');
  const moonIcon = themeToggle.querySelector('.moon-icon');

  // Set dark mode as default
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
  });
}

function updateThemeIcons(theme) {
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  
  if (theme === 'light') {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }
}

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
document.addEventListener('DOMContentLoaded', () => {
  setupHamburgerMenu();
  setupThemeToggle();
});

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
      var color = centerConfig.color || '#FFFFFF';
      
      // Use a consistent font size calculation
      var fontSize = Math.min(chart.innerRadius / 1.8, 24);
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
      var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
      ctx.font = "bold " + fontSize + "px " + fontStyle;
      ctx.fillStyle = color;
      
      // Add a subtle text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillText(txt, centerX, centerY);
      
      // Reset shadow for other drawing operations
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }
});

// Modify the createDoughnutChart function to always create donut charts
function createDoughnutChart(canvasId, percentage, parameterType, value) {
  // Get canvas context
  let ctx = document.getElementById(canvasId).getContext('2d');
  
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

  // Always create doughnut chart regardless of screen size
  let chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [percentage, 100 - percentage],
        backgroundColor: [chartColor, 'rgba(80, 90, 120, 0.3)'],
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
        color: '#FFFFFF',
        fontStyle: 'Orbitron',
        sidePadding: 20
      }
    }
  });

  // Store the chart instance so we can destroy it later
  charts[canvasId] = chart;
  return chart;
}

// Fix the handleResize function to prevent continuous scrolling
function handleResize() {
  // Use a debounce to prevent too many updates
  if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
  
  this.resizeTimeout = setTimeout(() => {
    // Don't trigger a full redraw - just update chart dimensions
    Object.keys(charts).forEach(chartId => {
      if (charts[chartId]) {
        charts[chartId].resize();
      }
    });
  }, 200); // 200ms debounce
}

// Modify the createDeviceCard function to include mobile-friendly views
function createDeviceCard(deviceId, data) {
  // Calculate plant health
  const health = calculatePlantHealth(data);
  
  // Select appropriate emoji based on health status
  let healthEmoji = '';
  if (health.score > 80) {
    healthEmoji = '🌱';
  } else if (health.score > 60) {
    healthEmoji = '🌿';
  } else if (health.score > 40) {
    healthEmoji = '🍃';
  } else if (health.score > 20) {
    healthEmoji = '🍂';
  } else {
    healthEmoji = '🥀';
  }
  
  let card = document.createElement('div');
  card.className = 'card';
  card.id = `card-${deviceId}`;
  
  // Normalize sensor values to percentages
  let tempPct = Math.min(100, data.temperature);
  let humPct = Math.min(100, data.humidity);
  let soilPct = Math.min(100, ((1023 - data.soil) / 1023) * 100);
  let ldrPct = Math.min(100, (data.ldr / 1023) * 100);
  
  // Get colors for sliders based on parameter thresholds
  const tempColor = getSensorColor('tempChart', data.temperature);
  const humColor = getSensorColor('humChart', data.humidity);
  const soilColor = getSensorColor('soilChart', data.soil);
  const ldrColor = getSensorColor('ldrChart', data.ldr);
  
  card.innerHTML = `
    <div class="card-header"><h3>${deviceId}</h3></div>
    <div class="card-body">
      <div class="plant-health">
        <div class="health-label">
          Health ${healthEmoji}
        </div>
        <div class="health-indicator" style="background-color: ${health.color}20; color: ${health.color};">
          <span>${health.status} (${health.score}%)</span>
        </div>
        <div class="health-bar">
          <div style="height: 100%; width: ${health.score}%; background-color: ${health.color};"></div>
        </div>
      </div>
      
      <!-- Desktop/Tablet view with donut charts -->
      <div class="sensor-container">
        <div class="sensor-row">
          <div class="sensor-chart-container">
            <canvas id="tempChart-${deviceId}"></canvas>
            <p>Temperature</p>
          </div>
          <div class="sensor-chart-container">
            <canvas id="humChart-${deviceId}"></canvas>
            <p>Humidity</p>
          </div>
          <div class="sensor-chart-container">
            <canvas id="soilChart-${deviceId}"></canvas>
            <p>Soil Moisture</p>
          </div>
          <div class="sensor-chart-container">
            <canvas id="ldrChart-${deviceId}"></canvas>
            <p>Light Level</p>
          </div>
        </div>
      </div>
      
      <!-- Mobile view with sliders -->
      <div class="mobile-sensor">
        <div class="sensor-info">
          <div class="sensor-label">Temperature</div>
          <div class="sensor-value" style="color: ${tempColor}">${data.temperature}°C</div>
        </div>
        <div class="sensor-slider">
          <div class="sensor-slider-fill" style="width: ${tempPct}%; background-color: ${tempColor}"></div>
        </div>
        
        <div class="sensor-info">
          <div class="sensor-label">Humidity</div>
          <div class="sensor-value" style="color: ${humColor}">${data.humidity}%</div>
        </div>
        <div class="sensor-slider">
          <div class="sensor-slider-fill" style="width: ${humPct}%; background-color: ${humColor}"></div>
        </div>
        
        <div class="sensor-info">
          <div class="sensor-label">Soil Moisture</div>
          <div class="sensor-value" style="color: ${soilColor}">${soilPct.toFixed(0)}%</div>
        </div>
        <div class="sensor-slider">
          <div class="sensor-slider-fill" style="width: ${soilPct}%; background-color: ${soilColor}"></div>
        </div>
        
        <div class="sensor-info">
          <div class="sensor-label">Light Level</div>
          <div class="sensor-value" style="color: ${ldrColor}">${ldrPct.toFixed(0)}%</div>
        </div>
        <div class="sensor-slider">
          <div class="sensor-slider-fill" style="width: ${ldrPct}%; background-color: ${ldrColor}"></div>
        </div>
      </div>
    </div>
    <div class="card-footer">
      Updated: ${new Date(data.updatedAt).toLocaleString()}
    </div>
  `;
  
  return card;
}

// Helper function to get appropriate color based on sensor value
function getSensorColor(parameterType, value) {
  // Define thresholds for each parameter
  const thresholds = {
    tempChart: { good: { min: 18, max: 28 }, fair: { min: 15, max: 32 } },
    humChart: { good: { min: 40, max: 70 }, fair: { min: 30, max: 80 } },
    soilChart: { good: { min: 300, max: 700 }, fair: { min: 200, max: 800 } },
    ldrChart: { good: { min: 300, max: 800 }, fair: { min: 200, max: 900 } }
  };
  
  // Get the appropriate threshold based on parameter type
  let threshold = thresholds.tempChart; // Default
  if (parameterType === 'humChart') threshold = thresholds.humChart;
  if (parameterType === 'soilChart') threshold = thresholds.soilChart;
  if (parameterType === 'ldrChart') threshold = thresholds.ldrChart;
  
  // Determine color based on thresholds
  if (value >= threshold.good.min && value <= threshold.good.max) {
    return '#22c55e'; // Green - good condition
  } else if (value >= threshold.fair.min && value <= threshold.fair.max) {
    return '#f97316'; // Orange - fair condition
  } else {
    return '#ef4444'; // Red - poor condition
  }
}

// Update the updateDashboard function to prevent continuous reloading
async function updateDashboard() {
  try {
    const response = await fetch('/api/devices');
    const devices = await response.json();
    const dashboard = document.getElementById('dashboard');
    
    if (!dashboard) return; // Safety check
    
    // Check if we're on mobile
    const isMobile = window.innerWidth < 768;
    
    // First, identify devices that no longer exist and remove their cards
    const currentDeviceIds = Object.keys(devices);
    const existingCards = dashboard.querySelectorAll('.card');
    
    existingCards.forEach(card => {
      const cardId = card.id;
      if (cardId && cardId.startsWith('card-')) {
        const deviceId = cardId.replace('card-', '');
        if (!currentDeviceIds.includes(deviceId)) {
          // Device no longer exists in data, remove its card
          dashboard.removeChild(card);
        }
      }
    });
    
    // Iterate through devices from API response
    for (const device in devices) {
      const data = devices[device];
      let card = document.getElementById(`card-${device}`);
      
      if (!card) {
         // Create and append new card if it doesn't exist
         card = createDeviceCard(device, data);
         dashboard.appendChild(card);
      } else {
         // Just update the card's content without full recreation
         const statusElement = card.querySelector('.health-indicator');
         const healthBar = card.querySelector('.health-bar div');
         const updatedTime = card.querySelector('.card-footer');
         
         if (statusElement && healthBar && updatedTime) {
           const health = calculatePlantHealth(data);
           statusElement.innerHTML = `<span>${health.status} (${health.score}%)</span>`;
           statusElement.style.backgroundColor = `${health.color}20`;
           statusElement.style.color = health.color;
           healthBar.style.width = `${health.score}%`;
           healthBar.style.backgroundColor = health.color;
           updatedTime.innerHTML = `Updated: ${data.updatedAt}`;
         }
      }
      
      // Only recreate charts when needed
      const metrics = ["tempChart", "humChart", "soilChart", "ldrChart"];
      
      // Normalize sensor values to percentages
      let tempPct = Math.min(100, data.temperature);
      let humPct = Math.min(100, data.humidity);
      let soilPct = Math.min(100, ((1023 - data.soil) / 1023) * 100);
      let ldrPct = Math.min(100, (data.ldr / 1023) * 100);
      
      // Recreate charts with a slight delay to ensure canvases are rendered
      setTimeout(() => {
        try {
          // Only create charts if they don't exist or need updating
          if (!charts[`tempChart-${device}`]) {
            createDoughnutChart(`tempChart-${device}`, tempPct, 'tempChart', data.temperature);
          } else {
            // Update existing chart data
            charts[`tempChart-${device}`].data.datasets[0].data = [tempPct, 100 - tempPct];
            charts[`tempChart-${device}`].update();
          }
          
          if (!charts[`humChart-${device}`]) {
            createDoughnutChart(`humChart-${device}`, humPct, 'humChart', data.humidity);
          } else {
            charts[`humChart-${device}`].data.datasets[0].data = [humPct, 100 - humPct];
            charts[`humChart-${device}`].update();
          }
          
          if (!charts[`soilChart-${device}`]) {
            createDoughnutChart(`soilChart-${device}`, soilPct, 'soilChart', data.soil);
          } else {
            charts[`soilChart-${device}`].data.datasets[0].data = [soilPct, 100 - soilPct];
            charts[`soilChart-${device}`].update();
          }
          
          if (!charts[`ldrChart-${device}`]) {
            createDoughnutChart(`ldrChart-${device}`, ldrPct, 'ldrChart', data.ldr);
          } else {
            charts[`ldrChart-${device}`].data.datasets[0].data = [ldrPct, 100 - ldrPct];
            charts[`ldrChart-${device}`].update();
          }
        } catch (error) {
          console.error('Error updating charts:', error);
        }
      }, 100);
    }
  } catch (err) {
    console.error('Error fetching device data:', err);
  }
}

// Replace the existing window resize listener
window.removeEventListener('resize', updateDashboard);
window.addEventListener('resize', handleResize);

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