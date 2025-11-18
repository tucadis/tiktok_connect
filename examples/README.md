# Integration Examples

This directory contains example integrations for the TikTok Live Event Router.

## Available Examples

### 🔌 Hardware Integration

#### ESP32 RGB LED Controller (`esp32-led.ino`)
Control RGB LEDs based on TikTok events.

**Features:**
- Different colors for different event types
- Rainbow effect for big gifts (1000+ diamonds)
- Pulse animations for likes
- MQTT-based communication

**Hardware Required:**
- ESP32 board
- RGB LED (common cathode) or WS2812B LED strip
- Resistors (if using separate RGB LEDs)

**Setup:**
1. Install Arduino IDE
2. Install required libraries:
   - PubSubClient
   - ArduinoJson
3. Configure WiFi credentials
4. Configure MQTT broker IP
5. Upload to ESP32

---

### 🎮 Game Integration

#### Unity Integration (`unity-integration.cs`)
Integrate TikTok events into Unity games.

**Features:**
- WebSocket connection to event router
- Unity events for each TikTok event type
- Command system (!spawn, etc.)
- Example effects (spawning objects, particles)

**Setup:**
1. Install Socket.IO Unity package
2. Add script to a GameObject in your scene
3. Configure server URL
4. Hook up Unity events in the Inspector

**Example Use Cases:**
- Spawn enemies on gifts
- Change environment on viewer milestones
- Trigger animations on follows
- Display viewer comments in-game

---

### 📺 OBS Automation

#### OBS Scene Controller (`obs-automation.js`)
Automatically control OBS based on TikTok events.

**Features:**
- Auto scene switching for big gifts
- Text overlays for followers
- Milestone celebrations
- Filter effects
- Command-based control

**Setup:**
1. Install OBS Studio
2. Install obs-websocket plugin
3. Install Node.js dependencies: `npm install obs-websocket-js socket.io-client`
4. Configure OBS WebSocket password
5. Run: `node obs-automation.js`

**Example Automations:**
- Switch to "Thanks" scene for 1000+ diamond gifts
- Show follower alert overlay
- Celebrate viewer milestones (100, 500, 1000)
- Toggle filters on command

---

### 🤖 Discord Bot

#### Discord Event Bot (`discord-bot.py`)
Post TikTok events to Discord channels.

**Features:**
- Embed messages for important events
- Statistics command (`!tiktok_stats`)
- Status monitoring (`!tiktok_status`)
- Configurable notification thresholds

**Setup:**
1. Create Discord bot at https://discord.com/developers
2. Install dependencies: `pip install discord.py python-socketio aiohttp`
3. Set environment variables:
   - `DISCORD_BOT_TOKEN`
   - `TIKTOK_ROUTER_URL`
   - `DISCORD_CHANNEL_ID`
4. Run: `python discord-bot.py`

---

### 🔧 Custom Plugin

#### Custom Plugin Template (`custom-plugin-example.ts`)
Template for creating custom plugins.

**Features:**
- Keyword tracking
- High-value gift notifications
- Custom business logic
- Webhook notifications

**Setup:**
1. Copy to `src/integrations/`
2. Customize the logic
3. Register in `src/index.ts`

---

### 🌐 Webhook Receiver

#### Example Webhook Server (`webhook-receiver.js`)
Simple Express server to receive and process webhooks.

**Features:**
- Receives and logs all events
- Event statistics endpoint
- Recent events API
- Easy to extend

**Setup:**
1. Run: `node webhook-receiver.js`
2. Configure router to send webhooks to `http://localhost:4000/webhook`

**Endpoints:**
- `POST /webhook` - Receive events
- `GET /events` - Get recent events
- `GET /stats` - Get event statistics
- `GET /health` - Health check

---

## Creating Your Own Integration

### Plugin Interface

All integrations should implement the `Plugin` interface:

```typescript
interface Plugin {
  name: string;
  initialize(): Promise<void>;
  onEvent(event: TikTokEvent): Promise<void>;
  destroy(): Promise<void>;
}
```

### Event Types

Events you'll receive:

```typescript
type TikTokEvent =
  | CommentEvent    // { type: 'comment', user, message, ... }
  | GiftEvent       // { type: 'gift', user, gift, ... }
  | LikeEvent       // { type: 'like', user, likeCount, ... }
  | FollowEvent     // { type: 'follow', user, ... }
  | ShareEvent      // { type: 'share', user, ... }
  | ViewersEvent    // { type: 'viewers', viewerCount, ... }
  | JoinEvent       // { type: 'join', user, ... }
```

### Quick Start Template

```typescript
import { Plugin, TikTokEvent } from '../types';

export class MyIntegration implements Plugin {
  name = 'my-integration';

  async initialize(): Promise<void> {
    // Setup code
  }

  async onEvent(event: TikTokEvent): Promise<void> {
    switch (event.type) {
      case 'comment':
        // Handle comment
        break;
      case 'gift':
        // Handle gift
        break;
      // ... other cases
    }
  }

  async destroy(): Promise<void> {
    // Cleanup code
  }
}
```

## Need Help?

- 📖 Check the main [README](../README.md)
- 💬 Open an issue on GitHub
- 🔍 Review the source code in `src/integrations/`

## Contributing

Have a cool integration idea? We'd love to see it! Please submit a PR with:
- Your integration code
- Documentation in this README
- Example usage
- Any required dependencies

---

**Happy integrating!** 🚀
