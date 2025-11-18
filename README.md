# 🎥 TikTok Live Event Router

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

**[English](#english) | [Español](#español)**

---

## English

A powerful, modular system that captures TikTok Live stream events and redistributes them to various platforms via webhooks, MQTT, and WebSockets. Perfect for streamers who want to integrate their TikTok Live interactions with IoT devices, games, OBS, Discord, and more!

### ✨ Features

- 🎯 **Real-time Event Detection**: Comments, gifts, likes, follows, shares, viewers, and joins
- 🔌 **Multiple Output Channels**:
  - Discord Webhooks
  - Custom HTTP Webhooks
  - MQTT for IoT devices
  - WebSocket for web apps
  - OBS WebSocket integration
- 📊 **Live Dashboard**: Beautiful web interface with real-time statistics
- 🎮 **Integration Examples**: ESP32, Unity, OBS automation, Discord bot
- 🔧 **Plugin System**: Easy to extend with custom integrations
- 🐳 **Docker Support**: Complete containerized setup
- 🧪 **Simulation Mode**: Test without connecting to a live stream
- 📈 **Statistics & Analytics**: Track engagement metrics
- 🎨 **Event Filtering**: Spam protection and customizable filters

### 🏗️ Architecture

```
┌─────────────────┐
│  TikTok Live    │
│     Stream      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Event Collector │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Event Parser   │
│   & Filter      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Event Router   │
└────────┬────────┘
         │
         ├─────────────┬──────────────┬──────────────┐
         ▼             ▼              ▼              ▼
    ┌────────┐   ┌─────────┐   ┌──────────┐   ┌─────────┐
    │Webhooks│   │  MQTT   │   │WebSocket │   │   OBS   │
    └────────┘   └─────────┘   └──────────┘   └─────────┘
         │             │              │              │
         ▼             ▼              ▼              ▼
    Discord      ESP32/IoT      Dashboard      Automation
```

### 🚀 Quick Start

#### Prerequisites

- Node.js 18 or higher
- (Optional) Docker & Docker Compose
- (Optional) MQTT Broker (included in Docker setup)
- (Optional) OBS Studio with obs-websocket plugin

#### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tiktok-live-event-router.git
cd tiktok-live-event-router
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure the application**
```bash
cp .env.example .env
cp config/config.example.json config/config.json
```

Edit `config/config.json`:
```json
{
  "tiktok_username": "@your_username",
  "webhooks": {
    "discord": "https://discord.com/api/webhooks/..."
  }
}
```

4. **Start the application**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start

# Simulation mode (for testing)
npm run simulate
```

5. **Access the dashboard**
Open http://localhost:3000/dashboard in your browser

#### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 📚 Configuration

#### Environment Variables (.env)

```env
TIKTOK_USERNAME=@your_username
PORT=3000
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
OBS_HOST=localhost
OBS_PORT=4455
OBS_PASSWORD=your_password
MQTT_BROKER=localhost
MQTT_PORT=1883
```

#### Configuration File (config/config.json)

See `config/config.example.json` for a complete example with all available options.

### 🎯 Use Cases

1. **Stream Interaction Dashboard**: Display live events on a secondary monitor
2. **IoT Integration**: Control RGB lights, displays, or robots based on viewer actions
3. **OBS Automation**: Auto-switch scenes on big gifts, show alerts for followers
4. **Game Integration**: Trigger Unity/Unreal events based on TikTok interactions
5. **Discord Community**: Auto-post highlights to your Discord server
6. **Analytics**: Track engagement metrics and top supporters
7. **Custom Commands**: Respond to viewer commands (!dance, !song, etc.)

### 🔌 Integration Examples

#### ESP32 RGB LED Controller
```arduino
// Control RGB LEDs based on TikTok events
// See examples/esp32-led.ino for complete code
```

Features:
- Different colors for different event types
- Rainbow effect for big gifts
- Pulse animations for likes

#### Unity Game Integration
```csharp
// Spawn objects, trigger animations, change game state
// See examples/unity-integration.cs for complete code
```

Features:
- WebSocket connection to event router
- Custom Unity events for each TikTok event type
- Command system for viewer interaction

#### OBS Automation
```javascript
// Automatically control OBS based on events
// See examples/obs-automation.js for complete code
```

Features:
- Auto scene switching for big gifts
- Text overlays for followers
- Milestone celebrations

#### Discord Bot
```python
# Post TikTok events to Discord channels
# See examples/discord-bot.py for complete code
```

Features:
- Embed messages for important events
- Statistics command
- Connection status monitoring

### 📡 API Endpoints

#### REST API

- `GET /health` - Health check
- `GET /api/stats` - Get current statistics
- `GET /api/config` - Get configuration (sanitized)
- `POST /api/config` - Update configuration
- `GET /api/status` - Get connection status

#### WebSocket Events

**Client → Server:**
- `subscribe` - Subscribe to specific event type
- `unsubscribe` - Unsubscribe from event type

**Server → Client:**
- `event` - New TikTok event
- `stats` - Updated statistics
- `connection_status` - TikTok connection status

### 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm run test:watch

# Simulation mode
npm run simulate
```

### 🛠️ Development

#### Project Structure

```
tiktok-live-event-router/
├── src/
│   ├── collectors/       # TikTok event collection
│   ├── parsers/         # Event parsing and filtering
│   ├── routers/         # Event routing logic
│   ├── integrations/    # Discord, MQTT, OBS, etc.
│   ├── api/            # REST API server
│   ├── websocket/      # WebSocket server
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utilities and helpers
├── public/             # Web dashboard files
├── examples/           # Integration examples
├── tests/             # Unit tests
├── config/            # Configuration files
└── docker/            # Docker configuration
```

#### Adding a Custom Integration

1. Create a new file in `src/integrations/`
2. Implement the `Plugin` interface:

```typescript
import { Plugin, TikTokEvent } from '../types';

export class MyCustomIntegration implements Plugin {
  name = 'my-integration';

  async initialize(): Promise<void> {
    // Setup code
  }

  async onEvent(event: TikTokEvent): Promise<void> {
    // Handle event
  }

  async destroy(): Promise<void> {
    // Cleanup code
  }
}
```

3. Register in `src/index.ts`

### 🔒 Security

- API rate limiting enabled by default
- Helmet.js security headers
- CORS configuration
- Input validation and sanitization
- Secrets excluded from config API endpoint

### 📊 Event Types

| Event Type | Description | Data |
|------------|-------------|------|
| `comment` | User comment | user, message, timestamp |
| `gift` | Gift sent | user, gift name, count, diamonds |
| `like` | Likes sent | user, count |
| `follow` | New follower | user, timestamp |
| `share` | Stream shared | user, timestamp |
| `viewers` | Viewer count update | count, timestamp |
| `join` | User joined stream | user, timestamp |

### 🗺️ Roadmap

- [ ] Redis integration for event caching
- [ ] PostgreSQL support for analytics
- [ ] Grafana dashboards
- [ ] Twitch integration
- [ ] YouTube Live support
- [ ] Plugin marketplace
- [ ] Web-based configuration UI
- [ ] Mobile app
- [ ] AI-powered spam detection

### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

- [TikTok-Live-Connector](https://github.com/zerodytrash/TikTok-Live-Connector) - TikTok Live connection library
- [Socket.IO](https://socket.io/) - Real-time communication
- [MQTT.js](https://github.com/mqttjs/MQTT.js) - MQTT client
- [OBS WebSocket](https://github.com/obsproject/obs-websocket) - OBS integration

### 📞 Support

- 📫 Issues: [GitHub Issues](https://github.com/yourusername/tiktok-live-event-router/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/tiktok-live-event-router/discussions)

---

## Español

Un sistema potente y modular que captura eventos de streams en vivo de TikTok y los redistribuye a varias plataformas mediante webhooks, MQTT y WebSockets. ¡Perfecto para streamers que quieran integrar sus interacciones de TikTok Live con dispositivos IoT, juegos, OBS, Discord y más!

### ✨ Características

- 🎯 **Detección de Eventos en Tiempo Real**: Comentarios, regalos, likes, seguidores, compartidos, espectadores y entradas
- 🔌 **Múltiples Canales de Salida**:
  - Webhooks de Discord
  - Webhooks HTTP personalizados
  - MQTT para dispositivos IoT
  - WebSocket para aplicaciones web
  - Integración con OBS WebSocket
- 📊 **Dashboard en Vivo**: Interfaz web hermosa con estadísticas en tiempo real
- 🎮 **Ejemplos de Integración**: ESP32, Unity, automatización OBS, bot de Discord
- 🔧 **Sistema de Plugins**: Fácil de extender con integraciones personalizadas
- 🐳 **Soporte Docker**: Configuración completa en contenedores
- 🧪 **Modo Simulación**: Prueba sin conectarte a un stream en vivo
- 📈 **Estadísticas y Análisis**: Rastrea métricas de engagement
- 🎨 **Filtrado de Eventos**: Protección contra spam y filtros personalizables

### 🚀 Inicio Rápido

[Mismo contenido que la sección en inglés, traducido]

### 📚 Documentación Adicional

- [API Documentation](docs/API.md)
- [Plugin Development Guide](docs/PLUGINS.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

---

**Made with ❤️ for the TikTok streaming community**
