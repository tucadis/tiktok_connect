/*
 * ESP32 LED RGB Controller for TikTok Live Events
 *
 * This sketch connects to an MQTT broker and listens for TikTok events
 * to control RGB LEDs based on different event types.
 *
 * Hardware Requirements:
 * - ESP32 board
 * - RGB LED (common cathode) or WS2812B LED strip
 *
 * Wiring:
 * - Red LED   -> GPIO 25
 * - Green LED -> GPIO 26
 * - Blue LED  -> GPIO 27
 *
 * Install libraries:
 * - PubSubClient by Nick O'Leary
 * - ArduinoJson by Benoit Blanchon
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker
const char* mqtt_server = "192.168.1.100";  // IP of your TikTok Live Router
const int mqtt_port = 1883;

// MQTT Topics
const char* topic_comments = "tiktok/comments";
const char* topic_gifts = "tiktok/gifts";
const char* topic_follows = "tiktok/follows";
const char* topic_likes = "tiktok/likes";

// LED Pins
const int redPin = 25;
const int greenPin = 26;
const int bluePin = 27;

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  // Setup LED pins
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);

  // Turn off LEDs initially
  setColor(0, 0, 0);

  // Connect to WiFi
  setupWiFi();

  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
}

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");

    String clientId = "ESP32-TikTok-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("connected");

      // Subscribe to topics
      client.subscribe(topic_comments);
      client.subscribe(topic_gifts);
      client.subscribe(topic_follows);
      client.subscribe(topic_likes);

      Serial.println("Subscribed to TikTok events");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.println("]");

  // Parse JSON
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  const char* eventType = doc["type"];

  // Handle different event types with different LED colors
  if (strcmp(topic, topic_comments) == 0) {
    // Blue for comments
    flashColor(0, 0, 255, 500);
  }
  else if (strcmp(topic, topic_gifts) == 0) {
    // Gift value determines color intensity
    int diamondCount = doc["gift"]["diamondCount"];

    if (diamondCount >= 1000) {
      // Rainbow effect for big gifts
      rainbowEffect(2000);
    } else if (diamondCount >= 100) {
      // Gold/yellow for medium gifts
      flashColor(255, 215, 0, 1000);
    } else {
      // Green for small gifts
      flashColor(0, 255, 0, 500);
    }
  }
  else if (strcmp(topic, topic_follows) == 0) {
    // Purple for new followers
    flashColor(128, 0, 128, 1000);
  }
  else if (strcmp(topic, topic_likes) == 0) {
    // Red pulse for likes
    pulseColor(255, 0, 0, 300);
  }
}

void setColor(int red, int green, int blue) {
  analogWrite(redPin, red);
  analogWrite(greenPin, green);
  analogWrite(bluePin, blue);
}

void flashColor(int red, int green, int blue, int duration) {
  setColor(red, green, blue);
  delay(duration);
  setColor(0, 0, 0);
}

void pulseColor(int red, int green, int blue, int duration) {
  for (int i = 0; i <= 255; i += 5) {
    setColor((red * i) / 255, (green * i) / 255, (blue * i) / 255);
    delay(duration / 100);
  }
  for (int i = 255; i >= 0; i -= 5) {
    setColor((red * i) / 255, (green * i) / 255, (blue * i) / 255);
    delay(duration / 100);
  }
}

void rainbowEffect(int duration) {
  int delay_time = duration / 360;
  for (int i = 0; i < 360; i++) {
    int r = (sin(i * 0.0175) * 127) + 128;
    int g = (sin((i + 120) * 0.0175) * 127) + 128;
    int b = (sin((i + 240) * 0.0175) * 127) + 128;
    setColor(r, g, b);
    delay(delay_time);
  }
  setColor(0, 0, 0);
}
