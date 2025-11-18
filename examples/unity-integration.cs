/*
 * Unity Integration for TikTok Live Events
 *
 * This script connects to the TikTok Live Event Router via WebSocket
 * and triggers Unity events based on TikTok stream interactions.
 *
 * Usage:
 * 1. Install Socket.IO Unity package from:
 *    https://github.com/itisnajim/SocketIOUnity
 * 2. Attach this script to a GameObject in your scene
 * 3. Configure the serverUrl to point to your Event Router
 *
 * Example Use Cases:
 * - Spawn objects when viewers send gifts
 * - Change game state based on comments
 * - Trigger animations on follows
 * - Scale effects based on viewer count
 */

using UnityEngine;
using UnityEngine.Events;
using SocketIOClient;
using Newtonsoft.Json.Linq;
using System;

public class TikTokLiveIntegration : MonoBehaviour
{
    [Header("Server Configuration")]
    [SerializeField] private string serverUrl = "http://localhost:3000";

    [Header("Events")]
    public UnityEvent<TikTokComment> OnComment;
    public UnityEvent<TikTokGift> OnGift;
    public UnityEvent<TikTokFollow> OnFollow;
    public UnityEvent<TikTokLike> OnLike;
    public UnityEvent<TikTokShare> OnShare;
    public UnityEvent<int> OnViewerCountUpdate;

    private SocketIOUnity socket;
    private bool isConnected = false;

    void Start()
    {
        ConnectToServer();
    }

    void ConnectToServer()
    {
        socket = new SocketIOUnity(serverUrl);

        socket.OnConnected += (sender, e) =>
        {
            Debug.Log("Connected to TikTok Live Event Router!");
            isConnected = true;
        };

        socket.OnDisconnected += (sender, e) =>
        {
            Debug.Log("Disconnected from server");
            isConnected = false;
        };

        // Listen for all events
        socket.On("event", response =>
        {
            var json = response.GetValue<JObject>();
            HandleEvent(json);
        });

        // Listen for specific event types
        socket.On("comment", response => HandleCommentEvent(response.GetValue<JObject>()));
        socket.On("gift", response => HandleGiftEvent(response.GetValue<JObject>()));
        socket.On("follow", response => HandleFollowEvent(response.GetValue<JObject>()));
        socket.On("like", response => HandleLikeEvent(response.GetValue<JObject>()));
        socket.On("share", response => HandleShareEvent(response.GetValue<JObject>()));
        socket.On("viewers", response => HandleViewersEvent(response.GetValue<JObject>()));

        socket.Connect();
    }

    void HandleEvent(JObject data)
    {
        string eventType = data["type"]?.ToString();
        Debug.Log($"Received event: {eventType}");
    }

    void HandleCommentEvent(JObject data)
    {
        var comment = new TikTokComment
        {
            username = data["user"]?["nickname"]?.ToString(),
            message = data["message"]?.ToString(),
            timestamp = data["timestamp"]?.ToObject<long>() ?? 0,
            isCommand = data["isCommand"]?.ToObject<bool>() ?? false,
            command = data["command"]?.ToString()
        };

        OnComment?.Invoke(comment);

        // Example: Spawn a cube when someone comments
        if (comment.isCommand && comment.command == "spawn")
        {
            SpawnCube();
        }
    }

    void HandleGiftEvent(JObject data)
    {
        var gift = new TikTokGift
        {
            username = data["user"]?["nickname"]?.ToString(),
            giftName = data["gift"]?["name"]?.ToString(),
            giftCount = data["gift"]?["count"]?.ToObject<int>() ?? 0,
            diamondCount = data["gift"]?["diamondCount"]?.ToObject<int>() ?? 0
        };

        OnGift?.Invoke(gift);

        // Example: Create particle effect based on gift value
        if (gift.diamondCount >= 1000)
        {
            CreateBigGiftEffect();
        }
        else
        {
            CreateSmallGiftEffect();
        }
    }

    void HandleFollowEvent(JObject data)
    {
        var follow = new TikTokFollow
        {
            username = data["user"]?["nickname"]?.ToString(),
            timestamp = data["timestamp"]?.ToObject<long>() ?? 0
        };

        OnFollow?.Invoke(follow);
    }

    void HandleLikeEvent(JObject data)
    {
        var like = new TikTokLike
        {
            username = data["user"]?["nickname"]?.ToString(),
            likeCount = data["likeCount"]?.ToObject<int>() ?? 0,
            totalLikeCount = data["totalLikeCount"]?.ToObject<int>() ?? 0
        };

        OnLike?.Invoke(like);
    }

    void HandleShareEvent(JObject data)
    {
        var share = new TikTokShare
        {
            username = data["user"]?["nickname"]?.ToString()
        };

        OnShare?.Invoke(share);
    }

    void HandleViewersEvent(JObject data)
    {
        int viewerCount = data["viewerCount"]?.ToObject<int>() ?? 0;
        OnViewerCountUpdate?.Invoke(viewerCount);
    }

    // Example effect methods
    void SpawnCube()
    {
        var cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
        cube.transform.position = new Vector3(
            UnityEngine.Random.Range(-5f, 5f),
            5f,
            UnityEngine.Random.Range(-5f, 5f)
        );
        cube.AddComponent<Rigidbody>();
        Destroy(cube, 5f);
    }

    void CreateSmallGiftEffect()
    {
        // Add your particle effect here
        Debug.Log("Creating small gift effect");
    }

    void CreateBigGiftEffect()
    {
        // Add your big particle effect here
        Debug.Log("Creating BIG gift effect!");
    }

    void OnDestroy()
    {
        if (socket != null)
        {
            socket.Disconnect();
            socket.Dispose();
        }
    }
}

// Data classes
[Serializable]
public class TikTokComment
{
    public string username;
    public string message;
    public long timestamp;
    public bool isCommand;
    public string command;
}

[Serializable]
public class TikTokGift
{
    public string username;
    public string giftName;
    public int giftCount;
    public int diamondCount;
}

[Serializable]
public class TikTokFollow
{
    public string username;
    public long timestamp;
}

[Serializable]
public class TikTokLike
{
    public string username;
    public int likeCount;
    public int totalLikeCount;
}

[Serializable]
public class TikTokShare
{
    public string username;
}
