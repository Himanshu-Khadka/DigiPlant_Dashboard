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

// Function to check if a device is online (has sent data in last 2 minutes)
function isDeviceOnline(lastUpdateTime) {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const lastUpdate = new Date(lastUpdateTime);
    return lastUpdate > twoMinutesAgo;
}

// Function to create a device card
function createDeviceCard(deviceName, data) {
    const deviceCard = document.createElement('div');
    deviceCard.className = 'device-card';

    const isOnline = isDeviceOnline(data.updatedAt);
    const statusClass = isOnline ? 'status-up' : 'status-down';
    const statusText = isOnline ? 'Online' : 'Offline';

    deviceCard.innerHTML = `
        <div class="device-info">
            <h3 class="device-name">${deviceName}</h3>
            <div class="device-status ${statusClass}">
                <span class="status-dot"></span>
                <span class="status-text">${statusText}</span>
            </div>
        </div>
        <div class="last-update">
            Last Update: ${new Date(data.updatedAt).toLocaleString()}
        </div>
    `;

    return deviceCard;
}

// Function to fetch and display devices
async function updateDeviceGrid() {
    try {
        const response = await fetch('/api/devices');
        const devices = await response.json();
        
        const deviceGrid = document.getElementById('device');
        if (!deviceGrid) return;

        // Clear existing content
        deviceGrid.innerHTML = '';

        // Add devices to the grid
        Object.entries(devices).forEach(([deviceName, data]) => {
            const card = createDeviceCard(deviceName, data);
            deviceGrid.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching device data:', error);
    }
}

// Initialize when the DOM is loaded and update every 30 seconds
document.addEventListener('DOMContentLoaded', () => {
    updateDeviceGrid();
    setInterval(updateDeviceGrid, 30000);
});

// Add necessary styles
const styles = `
    .device-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .device-card {
        background: #1a1a1a;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
    }

    .device-card:hover {
        transform: translateY(-2px);
    }

    .device-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .device-name {
        font-family: 'Orbitron', sans-serif;
        color: #ffffff;
        margin: 0;
        font-size: 1.2rem;
    }

    .device-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
    }

    .status-up {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
    }

    .status-down {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
    }

    .status-text {
        font-family: 'Orbitron', sans-serif;
    }

    .last-update {
        color: #666;
        font-size: 0.8rem;
        margin-top: 0.5rem;
        font-family: 'Orbitron', sans-serif;
    }
`;

// Add styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
