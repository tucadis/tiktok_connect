// WebSocket connection
let socket;
let isConnected = false;
const MAX_EVENTS = 50;
const events = [];

// Connect to WebSocket
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  socket = io(wsUrl);

  socket.on('connect', () => {
    console.log('WebSocket connected');
    isConnected = true;
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
    isConnected = false;
  });

  socket.on('event', (event) => {
    handleNewEvent(event);
  });

  socket.on('stats', (stats) => {
    updateStats(stats);
  });

  socket.on('connection_status', (status) => {
    updateConnectionStatus(status.connected);
  });
}

// Handle new event
function handleNewEvent(event) {
  events.unshift(event);

  if (events.length > MAX_EVENTS) {
    events.pop();
  }

  renderEvents();
  playNotificationSound(event);
}

// Render events
function renderEvents() {
  const container = document.getElementById('events-list');
  if (!container) return;

  container.innerHTML = events.map(event => {
    const eventHtml = createEventHTML(event);
    return eventHtml;
  }).join('');
}

// Create event HTML
function createEventHTML(event) {
  const time = new Date(event.timestamp).toLocaleTimeString();

  switch (event.type) {
    case 'comment':
      return `
        <div class="event-item comment">
          <div class="event-header">
            <span class="event-type">💬 Comment</span>
            <span class="event-time">${time}</span>
          </div>
          <div class="event-user">${event.user.nickname}</div>
          <div class="event-message">${escapeHtml(event.message)}</div>
        </div>
      `;

    case 'gift':
      return `
        <div class="event-item gift">
          <div class="event-header">
            <span class="event-type">🎁 Gift</span>
            <span class="event-time">${time}</span>
          </div>
          <div class="event-user">${event.user.nickname}</div>
          <div class="event-message">
            Sent ${event.gift.count}x ${event.gift.name}
            (${event.gift.diamondCount} diamonds)
          </div>
        </div>
      `;

    case 'follow':
      return `
        <div class="event-item follow">
          <div class="event-header">
            <span class="event-type">👤 New Follower</span>
            <span class="event-time">${time}</span>
          </div>
          <div class="event-user">${event.user.nickname} is now following!</div>
        </div>
      `;

    case 'share':
      return `
        <div class="event-item share">
          <div class="event-header">
            <span class="event-type">🔄 Share</span>
            <span class="event-time">${time}</span>
          </div>
          <div class="event-user">${event.user.nickname} shared the stream!</div>
        </div>
      `;

    case 'like':
      return `
        <div class="event-item like">
          <div class="event-header">
            <span class="event-type">❤️ Likes</span>
            <span class="event-time">${time}</span>
          </div>
          <div class="event-user">${event.user.nickname}</div>
          <div class="event-message">Sent ${event.likeCount} likes</div>
        </div>
      `;

    case 'join':
      return `
        <div class="event-item join">
          <div class="event-header">
            <span class="event-type">👋 Joined</span>
            <span class="event-time">${time}</span>
          </div>
          <div class="event-user">${event.user.nickname} joined the stream!</div>
        </div>
      `;

    default:
      return '';
  }
}

// Update stats
function updateStats(stats) {
  const elements = {
    totalComments: document.getElementById('stat-comments'),
    totalGifts: document.getElementById('stat-gifts'),
    totalLikes: document.getElementById('stat-likes'),
    totalFollows: document.getElementById('stat-follows'),
    currentViewers: document.getElementById('stat-viewers'),
    totalRevenue: document.getElementById('stat-revenue')
  };

  if (elements.totalComments) elements.totalComments.textContent = stats.totalComments.toLocaleString();
  if (elements.totalGifts) elements.totalGifts.textContent = stats.totalGifts.toLocaleString();
  if (elements.totalLikes) elements.totalLikes.textContent = stats.totalLikes.toLocaleString();
  if (elements.totalFollows) elements.totalFollows.textContent = stats.totalFollows.toLocaleString();
  if (elements.currentViewers) elements.currentViewers.textContent = stats.currentViewers.toLocaleString();
  if (elements.totalRevenue) elements.totalRevenue.textContent = stats.totalRevenue.toLocaleString();
}

// Update connection status
function updateConnectionStatus(connected) {
  const indicator = document.querySelector('.status-indicator');
  const statusText = document.getElementById('connection-status');

  if (indicator) {
    if (connected) {
      indicator.classList.add('connected');
    } else {
      indicator.classList.remove('connected');
    }
  }

  if (statusText) {
    statusText.textContent = connected ? 'Connected' : 'Disconnected';
  }
}

// Play notification sound
function playNotificationSound(event) {
  // Optional: implement sound notifications
  // const audio = new Audio('/sounds/notification.mp3');
  // audio.play();
}

// Escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Load initial stats
async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();
    updateStats(stats);
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load connection status
async function loadConnectionStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    updateConnectionStatus(data.connected);
  } catch (error) {
    console.error('Error loading connection status:', error);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  connectWebSocket();
  loadStats();
  loadConnectionStatus();

  // Refresh stats every 10 seconds as fallback
  setInterval(loadStats, 10000);
});
