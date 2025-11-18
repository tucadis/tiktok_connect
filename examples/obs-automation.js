/**
 * OBS Automation Script for TikTok Live Events
 *
 * This script listens to TikTok events and automatically controls OBS scenes,
 * sources, and filters based on viewer interactions.
 *
 * Requirements:
 * - Node.js
 * - OBS Studio with obs-websocket plugin
 * - npm install obs-websocket-js socket.io-client
 *
 * Usage:
 * node obs-automation.js
 */

const OBSWebSocket = require('obs-websocket-js').default;
const io = require('socket.io-client');

// Configuration
const config = {
  tiktokRouter: 'http://localhost:3000',
  obs: {
    address: 'ws://localhost:4455',
    password: 'your-obs-password'
  },
  scenes: {
    default: 'Main Scene',
    bigGift: 'Special Thanks Scene',
    milestone: 'Milestone Celebration'
  }
};

// Initialize OBS WebSocket
const obs = new OBSWebSocket();

// Initialize Socket.IO client
const socket = io(config.tiktokRouter);

// State
let currentViewers = 0;
let totalGifts = 0;
let isInSpecialScene = false;

// Connect to OBS
async function connectOBS() {
  try {
    await obs.connect(config.obs.address, config.obs.password);
    console.log('✅ Connected to OBS WebSocket');

    // List available scenes
    const scenes = await obs.call('GetSceneList');
    console.log('📺 Available scenes:', scenes.scenes.map(s => s.sceneName).join(', '));
  } catch (error) {
    console.error('❌ Failed to connect to OBS:', error);
    process.exit(1);
  }
}

// Connect to TikTok Live Router
socket.on('connect', () => {
  console.log('✅ Connected to TikTok Live Router');
});

socket.on('disconnect', () => {
  console.log('⚠️ Disconnected from TikTok Live Router');
});

// Handle TikTok events
socket.on('event', async (event) => {
  console.log(`📡 Event received: ${event.type}`);

  try {
    switch (event.type) {
      case 'gift':
        await handleGiftEvent(event);
        break;
      case 'follow':
        await handleFollowEvent(event);
        break;
      case 'comment':
        await handleCommentEvent(event);
        break;
      case 'viewers':
        await handleViewersEvent(event);
        break;
    }
  } catch (error) {
    console.error('Error handling event:', error);
  }
});

// Handle gift events
async function handleGiftEvent(event) {
  const { user, gift } = event;
  totalGifts++;

  console.log(`🎁 ${user.nickname} sent ${gift.count}x ${gift.name} (${gift.diamondCount} diamonds)`);

  // Big gift (>= 1000 diamonds) - Switch to special scene
  if (gift.diamondCount >= 1000) {
    await switchToSpecialScene(user.nickname, gift.diamondCount);
  }

  // Medium gift (>= 100 diamonds) - Show text overlay
  else if (gift.diamondCount >= 100) {
    await showThankYouText(user.nickname, gift.diamondCount);
  }

  // Any gift - Trigger confetti effect
  await triggerConfettiEffect(gift.diamondCount);
}

// Handle follow events
async function handleFollowEvent(event) {
  console.log(`👤 New follower: ${event.user.nickname}`);

  // Show follower alert
  await showFollowerAlert(event.user.nickname);
}

// Handle comment events
async function handleCommentEvent(event) {
  if (event.isCommand) {
    console.log(`💬 Command: ${event.command} from ${event.user.nickname}`);
    await handleCommand(event.command, event.args);
  }
}

// Handle viewer count updates
async function handleViewersEvent(event) {
  currentViewers = event.viewerCount;

  // Check for viewer milestones
  if (currentViewers % 100 === 0 && currentViewers > 0) {
    console.log(`🎉 Viewer milestone: ${currentViewers}`);
    await celebrateMilestone(currentViewers);
  }
}

// OBS Control Functions

async function switchToSpecialScene(username, giftValue) {
  if (isInSpecialScene) return;

  console.log(`🌟 Switching to special scene for ${username}'s ${giftValue} diamond gift!`);
  isInSpecialScene = true;

  await obs.call('SetCurrentProgramScene', {
    sceneName: config.scenes.bigGift
  });

  // Update text source with donor name
  await updateTextSource('DonorName', username);
  await updateTextSource('DonationAmount', `${giftValue} Diamonds!`);

  // Return to main scene after 10 seconds
  setTimeout(async () => {
    await obs.call('SetCurrentProgramScene', {
      sceneName: config.scenes.default
    });
    isInSpecialScene = false;
  }, 10000);
}

async function showThankYouText(username, giftValue) {
  await updateTextSource('ThankYouText', `Thank you ${username} for ${giftValue} diamonds!`);

  // Make text source visible
  await setSourceVisibility('ThankYouText', true);

  // Hide after 5 seconds
  setTimeout(async () => {
    await setSourceVisibility('ThankYouText', false);
  }, 5000);
}

async function showFollowerAlert(username) {
  await updateTextSource('FollowerAlert', `${username} is now following!`);
  await setSourceVisibility('FollowerAlert', true);

  setTimeout(async () => {
    await setSourceVisibility('FollowerAlert', false);
  }, 5000);
}

async function triggerConfettiEffect(intensity) {
  // Assuming you have a browser source or video source for confetti
  try {
    await setSourceVisibility('ConfettiEffect', true);

    setTimeout(async () => {
      await setSourceVisibility('ConfettiEffect', false);
    }, 3000);
  } catch (error) {
    // Confetti source might not exist
  }
}

async function celebrateMilestone(viewerCount) {
  await obs.call('SetCurrentProgramScene', {
    sceneName: config.scenes.milestone
  });

  await updateTextSource('MilestoneText', `${viewerCount} VIEWERS! 🎉`);

  setTimeout(async () => {
    await obs.call('SetCurrentProgramScene', {
      sceneName: config.scenes.default
    });
  }, 8000);
}

async function handleCommand(command, args) {
  switch (command) {
    case 'scene':
      if (args && args[0]) {
        await obs.call('SetCurrentProgramScene', {
          sceneName: args[0]
        });
      }
      break;

    case 'filter':
      // Toggle a filter on the camera source
      if (args && args[0]) {
        await toggleFilter('Camera', args[0]);
      }
      break;
  }
}

// Helper functions

async function updateTextSource(sourceName, text) {
  try {
    await obs.call('SetInputSettings', {
      inputName: sourceName,
      inputSettings: {
        text: text
      }
    });
  } catch (error) {
    console.error(`Failed to update text source ${sourceName}:`, error.message);
  }
}

async function setSourceVisibility(sourceName, visible) {
  try {
    const currentScene = await obs.call('GetCurrentProgramScene');
    const sceneItems = await obs.call('GetSceneItemList', {
      sceneName: currentScene.currentProgramSceneName
    });

    const item = sceneItems.sceneItems.find(i => i.sourceName === sourceName);
    if (item) {
      await obs.call('SetSceneItemEnabled', {
        sceneName: currentScene.currentProgramSceneName,
        sceneItemId: item.sceneItemId,
        sceneItemEnabled: visible
      });
    }
  } catch (error) {
    console.error(`Failed to set visibility for ${sourceName}:`, error.message);
  }
}

async function toggleFilter(sourceName, filterName) {
  try {
    await obs.call('SetSourceFilterEnabled', {
      sourceName,
      filterName,
      filterEnabled: true
    });

    setTimeout(async () => {
      await obs.call('SetSourceFilterEnabled', {
        sourceName,
        filterName,
        filterEnabled: false
      });
    }, 5000);
  } catch (error) {
    console.error(`Failed to toggle filter:`, error.message);
  }
}

// Start the automation
async function start() {
  console.log('🚀 Starting OBS Automation for TikTok Live...');
  await connectOBS();
  console.log('📡 Listening for TikTok events...');
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await obs.disconnect();
  socket.disconnect();
  process.exit(0);
});

// Run
start().catch(console.error);
