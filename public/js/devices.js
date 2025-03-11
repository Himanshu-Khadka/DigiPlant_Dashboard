// Sample device data - in a real app, this would come from an API
const devices = [
    { id: 1, name: 'Plant Sensor 1', status: 'up' },
    { id: 2, name: 'Moisture Monitor 2', status: 'down' },
    { id: 3, name: 'Temperature Sensor 3', status: 'up' },
    { id: 4, name: 'Light Sensor 4', status: 'up' },
    { id: 5, name: 'Humidity Monitor 5', status: 'down' }
];

// Function to create a device card
function createDeviceCard(device) {
    const deviceCard = document.createElement('div');
    deviceCard.className = 'device-card';

    const statusClass = device.status === 'up' ? 'status-up' : 'status-down';
    const statusText = device.status === 'up' ? 'Online' : 'Offline';

    deviceCard.innerHTML = `
        <div class="device-info">
            <h3 class="device-name">${device.name}</h3>
            <div class="device-status ${statusClass}">
                <span class="status-dot"></span>
                <span class="status-text">${statusText}</span>
            </div>
        </div>
    `;

    return deviceCard;
}

// Function to initialize the device grid
function initializeDeviceGrid() {
    const deviceGrid = document.getElementById('device');
    if (!deviceGrid) return;

    // Clear existing content
    deviceGrid.innerHTML = '';

    // Add devices to the grid
    devices.forEach(device => {
        const card = createDeviceCard(device);
        deviceGrid.appendChild(card);
    });
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDeviceGrid);

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
`;

// Add styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
