/**
 * Example Webhook Receiver
 *
 * This is a simple Express server that receives webhooks from
 * the TikTok Live Event Router and processes them.
 *
 * Usage:
 * node webhook-receiver.js
 *
 * Then configure the router to send webhooks to:
 * http://localhost:4000/webhook
 */

const express = require('express');
const app = express();
const PORT = 4000;

app.use(express.json());

// Store recent events in memory (in production, use a database)
const recentEvents = [];
const MAX_EVENTS = 100;

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const { event_type, timestamp, data } = req.body;

  console.log(`\n[${new Date(timestamp).toLocaleTimeString()}] ${event_type.toUpperCase()}`);

  // Handle different event types
  switch (event_type) {
    case 'comment':
      console.log(`💬 ${data.user.nickname}: ${data.message}`);
      if (data.isCommand) {
        console.log(`   ⚡ Command detected: ${data.command}`);
      }
      break;

    case 'gift':
      console.log(
        `🎁 ${data.user.nickname} sent ${data.gift.count}x ${data.gift.name} (${data.gift.diamondCount} 💎)`
      );
      break;

    case 'follow':
      console.log(`👤 ${data.user.nickname} is now following!`);
      break;

    case 'like':
      console.log(`❤️ ${data.user.nickname} sent ${data.likeCount} likes`);
      break;

    case 'share':
      console.log(`🔄 ${data.user.nickname} shared the stream!`);
      break;

    case 'viewers':
      console.log(`👁️ Current viewers: ${data.viewerCount}`);
      break;

    case 'join':
      console.log(`👋 ${data.user.nickname} joined the stream`);
      break;

    default:
      console.log(`Unknown event type: ${event_type}`);
  }

  // Store event
  recentEvents.unshift({ event_type, timestamp, data });
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.pop();
  }

  // Send success response
  res.status(200).json({ success: true, received: timestamp });
});

// Get recent events
app.get('/events', (req, res) => {
  res.json({
    total: recentEvents.length,
    events: recentEvents,
  });
});

// Get event statistics
app.get('/stats', (req, res) => {
  const stats = {
    total: recentEvents.length,
    comments: recentEvents.filter((e) => e.event_type === 'comment').length,
    gifts: recentEvents.filter((e) => e.event_type === 'gift').length,
    follows: recentEvents.filter((e) => e.event_type === 'follow').length,
    likes: recentEvents.filter((e) => e.event_type === 'like').length,
    shares: recentEvents.filter((e) => e.event_type === 'share').length,
    joins: recentEvents.filter((e) => e.event_type === 'join').length,
  };

  res.json(stats);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log('🎯 Webhook Receiver Server');
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`📝 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`📊 Stats URL: http://localhost:${PORT}/stats`);
  console.log(`\nWaiting for webhooks...\n`);
});
