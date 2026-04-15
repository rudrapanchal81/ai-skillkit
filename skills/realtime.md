---
name: realtime
description: Real-time communication patterns with WebSockets, Server-Sent Events, and polling for live updates
version: 1.0.0
category: realtime
tags: [websocket, sse, server-sent-events, socket-io, realtime, live-updates, polling]
---

# Real-Time Communication Skill

Production-ready patterns for real-time features using WebSockets, Server-Sent Events, and intelligent polling.

## Quick Reference

| Request Type | Use This Skill | Don't Use If |
|--------------|----------------|--------------|
| WebSocket connections | ✅ Yes | Static content only |
| Server-Sent Events (SSE) | ✅ Yes | No live updates needed |
| Live chat/messaging | ✅ Yes | Async messaging only |
| Real-time notifications | ✅ Yes | Email notifications only |
| Live dashboards/analytics | ✅ Yes | Batch reports only |

## Triggers

Use this skill when the request includes:
- WebSocket, Socket.IO, real-time
- Server-Sent Events, SSE, EventSource
- Live updates, push notifications
- Chat, messaging, collaboration
- Polling, long-polling
- Real-time dashboard, live data

## Anti-Triggers

Do NOT use this skill when:
- Static content without updates
- Batch processing only
- Email/SMS notifications
- Scheduled jobs/cron tasks

## Implementation Patterns

### 1. WebSocket with Socket.IO (Bidirectional)

```ts
// server.ts - Socket.IO server setup
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Admin UI for debugging
instrument(io, {
  auth: false,
  mode: 'development',
});

// Middleware for authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const user = await verifyToken(token);
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Connection handling
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`User connected: ${user.id}`);

  // Join user to their personal room
  socket.join(`user:${user.id}`);

  // Handle chat messages
  socket.on('chat:message', async (data: { roomId: string; message: string }) => {
    const { roomId, message } = data;

    // Save message to database
    const savedMessage = await prisma.message.create({
      data: {
        content: message,
        roomId,
        userId: user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Broadcast to room
    io.to(roomId).emit('chat:message', savedMessage);
  });

  // Handle typing indicators
  socket.on('chat:typing', (data: { roomId: string; isTyping: boolean }) => {
    socket.to(data.roomId).emit('chat:typing', {
      userId: user.id,
      userName: user.name,
      isTyping: data.isTyping,
    });
  });

  // Join chat room
  socket.on('chat:join', (roomId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('chat:user-joined', {
      userId: user.id,
      userName: user.name,
    });
  });

  // Leave chat room
  socket.on('chat:leave', (roomId: string) => {
    socket.leave(roomId);
    socket.to(roomId).emit('chat:user-left', {
      userId: user.id,
      userName: user.name,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${user.id}`);
  });
});

httpServer.listen(3001, () => {
  console.log('Socket.IO server running on port 3001');
});

// Emit events from API routes
app.post('/api/notifications', async (req, res) => {
  const { userId, notification } = req.body;

  // Save notification
  const saved = await prisma.notification.create({
    data: notification,
  });

  // Send to user's socket
  io.to(`user:${userId}`).emit('notification', saved);

  res.json({ success: true });
});
```

```tsx
// client.tsx - Socket.IO React client
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

function useSocket(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:3001', {
      auth: { token },
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  return { socket, isConnected };
}

function ChatRoom({ roomId, token }: { roomId: string; token: string }) {
  const { socket, isConnected } = useSocket(token);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('chat:join', roomId);

    // Listen for messages
    socket.on('chat:message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicators
    socket.on('chat:typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (data.isTyping) {
          next.add(data.userName);
        } else {
          next.delete(data.userName);
        }
        return next;
      });
    });

    return () => {
      socket.emit('chat:leave', roomId);
      socket.off('chat:message');
      socket.off('chat:typing');
    };
  }, [socket, roomId]);

  const handleSend = () => {
    if (!socket || !inputValue.trim()) return;

    socket.emit('chat:message', {
      roomId,
      message: inputValue,
    });

    setInputValue('');
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit('chat:typing', { roomId, isTyping: true });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (!socket) return;
    socket.emit('chat:typing', { roomId, isTyping: false });
  };

  return (
    <div className="chat-room">
      <div className="connection-status">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <img src={msg.user.avatar} alt={msg.user.name} />
            <div>
              <strong>{msg.user.name}</strong>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {typingUsers.size > 0 && (
        <div className="typing-indicator">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <div className="input-area">
        <input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            handleTyping();
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
```

### 2. Server-Sent Events (SSE) - Server to Client Only

```ts
// server.ts - SSE endpoint
import express from 'express';

const app = express();

// SSE endpoint for notifications
app.get('/api/notifications/stream', async (req, res) => {
  const userId = req.user.id; // From auth middleware

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write('data: {"type":"connected"}\n\n');

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Listen for new notifications
  const notificationListener = (notification: any) => {
    if (notification.userId === userId) {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
  };

  // Subscribe to notifications (using EventEmitter or Redis pub/sub)
  notificationEmitter.on('notification', notificationListener);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    notificationEmitter.off('notification', notificationListener);
    res.end();
  });
});

// Trigger notification from another endpoint
app.post('/api/posts/:id/like', async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
  });

  await prisma.like.create({
    data: {
      postId: req.params.id,
      userId: req.user.id,
    },
  });

  // Emit notification
  const notification = {
    userId: post.authorId,
    type: 'like',
    message: `${req.user.name} liked your post`,
    postId: post.id,
  };

  notificationEmitter.emit('notification', notification);

  res.json({ success: true });
});
```

```tsx
// client.tsx - SSE React client
import { useEffect, useState } from 'react';

interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

function useNotifications(token: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/notifications/stream?token=${token}`
    );

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connected') {
        console.log('Connected to notifications');
        return;
      }

      setNotifications((prev) => [data, ...prev]);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

  return { notifications, isConnected };
}

function NotificationCenter({ token }: { token: string }) {
  const { notifications, isConnected } = useNotifications(token);

  return (
    <div className="notifications">
      <div className="status">
        {isConnected ? '🟢 Live' : '🔴 Offline'}
      </div>

      {notifications.map((notif) => (
        <div key={notif.id} className="notification">
          <p>{notif.message}</p>
          <span>{new Date(notif.createdAt).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}
```

### 3. Intelligent Polling

```tsx
// Smart polling with exponential backoff
import { useEffect, useState, useRef } from 'react';

interface PollingOptions {
  interval: number;
  maxInterval?: number;
  backoffMultiplier?: number;
  enabled?: boolean;
}

function usePolling<T>(
  fetcher: () => Promise<T>,
  options: PollingOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const currentIntervalRef = useRef(options.interval);

  useEffect(() => {
    if (!options.enabled) return;

    const poll = async () => {
      try {
        const result = await fetcher();
        setData(result);
        setError(null);
        setIsLoading(false);

        // Reset interval on success
        currentIntervalRef.current = options.interval;
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);

        // Exponential backoff on error
        if (options.backoffMultiplier && options.maxInterval) {
          currentIntervalRef.current = Math.min(
            currentIntervalRef.current * options.backoffMultiplier,
            options.maxInterval
          );
        }
      }

      // Schedule next poll
      intervalRef.current = setTimeout(poll, currentIntervalRef.current);
    };

    // Start polling
    poll();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [fetcher, options.enabled, options.interval, options.maxInterval, options.backoffMultiplier]);

  return { data, error, isLoading };
}

// Usage
function LiveDashboard() {
  const { data: stats, error } = usePolling(
    () => fetch('/api/stats').then((r) => r.json()),
    {
      interval: 5000, // 5 seconds
      maxInterval: 60000, // Max 1 minute
      backoffMultiplier: 2,
      enabled: true,
    }
  );

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Live Stats</h1>
      <p>Users Online: {stats?.usersOnline}</p>
      <p>Active Sessions: {stats?.activeSessions}</p>
    </div>
  );
}
```

### 4. Optimistic Updates with Real-Time Sync

```tsx
// Optimistic UI with WebSocket sync
function OptimisticChat() {
  const { socket } = useSocket(token);
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, Message>>(new Map());

  useEffect(() => {
    if (!socket) return;

    socket.on('chat:message', (message: Message) => {
      // Remove optimistic message if it exists
      setOptimisticMessages((prev) => {
        const next = new Map(prev);
        next.delete(message.tempId);
        return next;
      });

      // Add real message
      setMessages((prev) => [...prev, message]);
    });

    socket.on('chat:error', (data: { tempId: string; error: string }) => {
      // Remove failed optimistic message
      setOptimisticMessages((prev) => {
        const next = new Map(prev);
        next.delete(data.tempId);
        return next;
      });

      // Show error
      toast.error(data.error);
    });
  }, [socket]);

  const sendMessage = (content: string) => {
    const tempId = `temp-${Date.now()}`;
    
    // Add optimistic message immediately
    const optimisticMsg: Message = {
      id: tempId,
      tempId,
      content,
      userId: currentUser.id,
      user: currentUser,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setOptimisticMessages((prev) => new Map(prev).set(tempId, optimisticMsg));

    // Send to server
    socket?.emit('chat:message', {
      tempId,
      roomId,
      message: content,
    });
  };

  const allMessages = [
    ...messages,
    ...Array.from(optimisticMessages.values()),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div>
      {allMessages.map((msg) => (
        <div key={msg.id} className={msg.pending ? 'pending' : ''}>
          {msg.content}
          {msg.pending && <span>Sending...</span>}
        </div>
      ))}
    </div>
  );
}
```

## Critical Rules

1. **Handle connection failures gracefully**
   - Implement reconnection logic
   - Show connection status to users
   - Queue messages during disconnection

2. **Authenticate WebSocket connections**
   - Verify tokens on connection
   - Use middleware for auth
   - Don't trust client-side data

3. **Implement heartbeats**
   - Detect dead connections
   - Send ping/pong messages
   - Clean up stale connections

4. **Use rooms/namespaces wisely**
   - Organize connections logically
   - Limit broadcast scope
   - Clean up empty rooms

5. **Optimize message size**
   - Send only necessary data
   - Use compression for large payloads
   - Batch updates when possible

6. **Handle scaling**
   - Use Redis adapter for multiple servers
   - Implement sticky sessions
   - Consider message queues

7. **Implement rate limiting**
   - Prevent message spam
   - Limit connection attempts
   - Throttle expensive operations

8. **Clean up on disconnect**
   - Remove event listeners
   - Clear intervals/timeouts
   - Update user presence

## Common Mistakes to Avoid

1. ❌ Not handling reconnection
2. ❌ Missing authentication
3. ❌ No connection status indicator
4. ❌ Not cleaning up listeners
5. ❌ Broadcasting to all users unnecessarily
6. ❌ No rate limiting
7. ❌ Not handling errors
8. ❌ Memory leaks from unclosed connections

## Dependencies

```json
{
  "socket.io": "^4.6.0",
  "socket.io-client": "^4.6.0",
  "@socket.io/admin-ui": "^0.5.0",
  "ioredis": "^5.3.2"
}
```
