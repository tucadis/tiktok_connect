"""
Discord Bot for TikTok Live Events

This bot connects to the TikTok Live Event Router and posts notifications
to a Discord channel for important events.

Requirements:
- Python 3.8+
- pip install discord.py python-socketio aiohttp

Usage:
1. Create a Discord bot at https://discord.com/developers/applications
2. Get the bot token
3. Invite the bot to your server
4. Run: python discord-bot.py
"""

import discord
from discord.ext import commands
import socketio
import asyncio
import aiohttp
import os
from datetime import datetime

# Configuration
DISCORD_TOKEN = os.getenv('DISCORD_BOT_TOKEN', 'your-discord-bot-token')
TIKTOK_ROUTER_URL = os.getenv('TIKTOK_ROUTER_URL', 'http://localhost:3000')
CHANNEL_ID = int(os.getenv('DISCORD_CHANNEL_ID', '0'))  # Channel ID to post to

# Initialize Discord bot
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)

# Initialize Socket.IO client
sio = socketio.AsyncClient()

# State
stats = {
    'comments': 0,
    'gifts': 0,
    'followers': 0,
    'total_diamonds': 0
}


@bot.event
async def on_ready():
    print(f'✅ Discord bot logged in as {bot.user}')
    print(f'📺 Monitoring TikTok events from {TIKTOK_ROUTER_URL}')

    # Connect to TikTok Live Router
    await connect_to_tiktok()


async def connect_to_tiktok():
    """Connect to TikTok Live Event Router"""
    try:
        await sio.connect(TIKTOK_ROUTER_URL)
        print('✅ Connected to TikTok Live Router')
    except Exception as e:
        print(f'❌ Failed to connect to TikTok Router: {e}')


@sio.event
async def connect():
    print('🔌 Socket.IO connected')


@sio.event
async def disconnect():
    print('⚠️ Socket.IO disconnected')


@sio.event
async def event(data):
    """Handle all TikTok events"""
    event_type = data.get('type')

    handlers = {
        'comment': handle_comment,
        'gift': handle_gift,
        'follow': handle_follow,
        'share': handle_share,
        'like': handle_like
    }

    handler = handlers.get(event_type)
    if handler:
        await handler(data)


async def handle_comment(data):
    """Handle comment events"""
    stats['comments'] += 1
    user = data.get('user', {})
    message = data.get('message', '')

    # Only post interesting comments (commands, long messages, etc.)
    if data.get('isCommand') or len(message) > 50:
        await send_embed(
            title='💬 New Comment',
            description=f"**{user.get('nickname')}**: {message}",
            color=discord.Color.blue()
        )


async def handle_gift(data):
    """Handle gift events"""
    stats['gifts'] += 1
    user = data.get('user', {})
    gift = data.get('gift', {})

    gift_name = gift.get('name')
    gift_count = gift.get('count', 1)
    diamonds = gift.get('diamondCount', 0)
    stats['total_diamonds'] += diamonds

    # Create embed color based on gift value
    if diamonds >= 1000:
        color = discord.Color.gold()
        emoji = '🌟'
    elif diamonds >= 100:
        color = discord.Color.orange()
        emoji = '🎁'
    else:
        color = discord.Color.green()
        emoji = '🎁'

    # Only post gifts worth 100+ diamonds
    if diamonds >= 100:
        await send_embed(
            title=f'{emoji} Big Gift Received!',
            description=f"**{user.get('nickname')}** sent **{gift_count}x {gift_name}**",
            color=color,
            fields=[
                {'name': 'Value', 'value': f'{diamonds} 💎', 'inline': True},
                {'name': 'Total Revenue', 'value': f"{stats['total_diamonds']} 💎", 'inline': True}
            ]
        )


async def handle_follow(data):
    """Handle follow events"""
    stats['followers'] += 1
    user = data.get('user', {})

    await send_embed(
        title='👤 New Follower!',
        description=f"**{user.get('nickname')}** is now following!",
        color=discord.Color.green(),
        fields=[
            {'name': 'Total New Followers', 'value': str(stats['followers']), 'inline': True}
        ]
    )


async def handle_share(data):
    """Handle share events"""
    user = data.get('user', {})

    await send_embed(
        title='🔄 Stream Shared!',
        description=f"**{user.get('nickname')}** shared the stream!",
        color=discord.Color.purple()
    )


async def handle_like(data):
    """Handle like events (only for large amounts)"""
    user = data.get('user', {})
    like_count = data.get('likeCount', 0)

    if like_count >= 50:  # Only announce big like bursts
        await send_embed(
            title='❤️ Like Burst!',
            description=f"**{user.get('nickname')}** sent **{like_count}** likes!",
            color=discord.Color.red()
        )


async def send_embed(title, description, color, fields=None):
    """Send an embed message to the Discord channel"""
    channel = bot.get_channel(CHANNEL_ID)
    if not channel:
        print(f'❌ Channel {CHANNEL_ID} not found')
        return

    embed = discord.Embed(
        title=title,
        description=description,
        color=color,
        timestamp=datetime.utcnow()
    )

    if fields:
        for field in fields:
            embed.add_field(
                name=field['name'],
                value=field['value'],
                inline=field.get('inline', False)
            )

    try:
        await channel.send(embed=embed)
    except Exception as e:
        print(f'❌ Failed to send message: {e}')


@bot.command()
async def tiktok_stats(ctx):
    """Display current TikTok stream statistics"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f'{TIKTOK_ROUTER_URL}/api/stats') as response:
                if response.status == 200:
                    data = await response.json()

                    embed = discord.Embed(
                        title='📊 TikTok Live Statistics',
                        color=discord.Color.blue(),
                        timestamp=datetime.utcnow()
                    )

                    embed.add_field(name='💬 Comments', value=str(data.get('totalComments', 0)), inline=True)
                    embed.add_field(name='🎁 Gifts', value=str(data.get('totalGifts', 0)), inline=True)
                    embed.add_field(name='❤️ Likes', value=str(data.get('totalLikes', 0)), inline=True)
                    embed.add_field(name='👤 Followers', value=str(data.get('totalFollows', 0)), inline=True)
                    embed.add_field(name='👁️ Viewers', value=str(data.get('currentViewers', 0)), inline=True)
                    embed.add_field(name='💎 Revenue', value=str(data.get('totalRevenue', 0)), inline=True)

                    if data.get('topGifter'):
                        embed.add_field(
                            name='🌟 Top Gifter',
                            value=data['topGifter'].get('nickname', 'Unknown'),
                            inline=False
                        )

                    await ctx.send(embed=embed)
                else:
                    await ctx.send('❌ Failed to fetch statistics')
    except Exception as e:
        await ctx.send(f'❌ Error: {e}')


@bot.command()
async def tiktok_status(ctx):
    """Check TikTok Live connection status"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f'{TIKTOK_ROUTER_URL}/api/status') as response:
                if response.status == 200:
                    data = await response.json()
                    status = '🟢 Connected' if data.get('connected') else '🔴 Disconnected'
                    await ctx.send(f'TikTok Live Status: {status}')
                else:
                    await ctx.send('❌ Failed to check status')
    except Exception as e:
        await ctx.send(f'❌ Error: {e}')


async def main():
    """Main entry point"""
    # Start Discord bot
    async with bot:
        await bot.start(DISCORD_TOKEN)


if __name__ == '__main__':
    print('🚀 Starting Discord Bot for TikTok Live Events...')
    print(f'📺 TikTok Router: {TIKTOK_ROUTER_URL}')
    print(f'📢 Channel ID: {CHANNEL_ID}')

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('\n👋 Shutting down...')
