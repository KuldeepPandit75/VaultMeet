# Design Document

## Overview

This design addresses the critical room synchronization issue in VaultMeet where users joining rooms are not visible to existing participants. The solution implements a robust, atomic room state management system with proper event sequencing, comprehensive error handling, and automatic recovery mechanisms.

The core issue stems from race conditions between socket connection establishment, room permission checking, game scene initialization, and socket event emission. This design provides a unified, reliable approach to room synchronization.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND CLIENT                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Room Manager  │  │  Socket Manager │  │  State Manager  │  │ Game Scene  │ │
│  │   - Join Flow   │  │  - Connection   │  │  - Validation   │  │ - Rendering │ │
│  │   - Validation  │  │  - Events       │  │  - Recovery     │  │ - Updates   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ WebSocket + HTTP
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GATEWAY SERVICE                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Room Controller │  │ Socket Handler  │  │ State Manager   │  │ Event Queue │ │
│  │ - Join Logic    │  │ - Event Routing │  │ - Atomic Ops    │  │ - Ordering  │ │
│  │ - Validation    │  │ - Broadcasting  │  │ - Consistency   │  │ - Recovery  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ROOM STATE STORE                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Room Players  │  │  Player Rooms   │  │  Room Metadata  │  │   Cleanup   │ │
│  │   Map<roomId,   │  │  Map<socketId,  │  │  Map<roomId,    │  │   Manager   │ │
│  │   Set<players>> │  │  roomId>        │  │  metadata>      │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Event Flow Sequence

```
Client A (Joining)          Gateway Service          Client B (Existing)
      │                           │                           │
      │ 1. checkRoomPermission    │                           │
      ├──────────────────────────►│                           │
      │ 2. permission response    │                           │
      ◄──────────────────────────┤                           │
      │                           │                           │
      │ 3. joinRoomGameSpace      │                           │
      ├──────────────────────────►│                           │
      │                           │ 4. atomic state update   │
      │                           │ 5. validate consistency  │
      │                           │                           │
      │ 6. roomGameSpaceJoined    │ 7. playerJoinedRoom      │
      ◄──────────────────────────┤──────────────────────────►│
      │                           │                           │
      │ 8. ready event            │                           │
      ├──────────────────────────►│                           │
      │                           │ 9. broadcast ready       │
      │                           │──────────────────────────►│
      │                           │                           │
      │ 10. state validation      │                           │
      ├──────────────────────────►│                           │
      │ 11. validation response   │                           │
      ◄──────────────────────────┤                           │
```

## Components and Interfaces

### 1. Room State Manager (Backend)

**Purpose**: Centralized, atomic room state management with consistency guarantees.

```javascript
class RoomStateManager {
  constructor() {
    this.roomPlayers = new Map(); // roomId -> Set<socketId>
    this.playerRooms = new Map(); // socketId -> roomId
    this.roomMetadata = new Map(); // roomId -> { createdAt, lastActivity, playerCount }
    this.stateLock = new Map(); // roomId -> Promise (for atomic operations)
  }

  async joinRoom(socketId, roomId, userId) {
    // Atomic operation with consistency checks
  }

  async leaveRoom(socketId, roomId) {
    // Atomic cleanup with validation
  }

  validateRoomState(roomId) {
    // Consistency validation across all maps
  }

  getRoomPlayers(roomId) {
    // Thread-safe player list retrieval
  }
}
```

### 2. Socket Event Handler (Backend)

**Purpose**: Ordered event processing with proper sequencing and error handling.

```javascript
class SocketEventHandler {
  constructor(io, roomStateManager) {
    this.io = io;
    this.roomStateManager = roomStateManager;
    this.eventQueue = new Map(); // socketId -> Queue<Event>
    this.processingEvents = new Set(); // socketId set for processing locks
  }

  async handleJoinRoomGameSpace(socket, { roomId, userId }) {
    // Queued, atomic room joining with validation
  }

  async handlePlayerReady(socket) {
    // State synchronization after scene ready
  }

  async validatePlayerState(socket, roomId) {
    // Real-time state validation
  }
}
```

### 3. Room Manager (Frontend)

**Purpose**: Client-side room state management with automatic recovery.

```typescript
class RoomManager {
  private socket: Socket;
  private roomId: string;
  private joinState: 'disconnected' | 'connecting' | 'joined' | 'error';
  private stateValidationTimer: NodeJS.Timeout;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  async joinRoom(roomId: string): Promise<JoinResult> {
    // Robust room joining with retry logic
  }

  private async validateRoomState(): Promise<boolean> {
    // Periodic state validation
  }

  private async recoverFromSyncError(): Promise<void> {
    // Automatic recovery mechanisms
  }
}
```

### 4. Game Scene Integration

**Purpose**: Proper integration between room state and game rendering.

```typescript
class GameSceneManager {
  private roomManager: RoomManager;
  private playersMap: Map<string, PlayerSprite>;
  private sceneReady: boolean = false;
  private pendingPlayers: PlayerData[] = [];

  async initializeScene(roomId: string): Promise<void> {
    // Proper initialization sequence
  }

  private async onRoomStateChanged(players: PlayerData[]): Promise<void> {
    // Handle room state changes with proper rendering
  }

  private async syncPlayerStates(): Promise<void> {
    // Synchronize visual state with room state
  }
}
```

## Data Models

### Room State Model

```typescript
interface RoomState {
  roomId: string;
  players: Map<string, PlayerInfo>;
  metadata: {
    createdAt: Date;
    lastActivity: Date;
    playerCount: number;
    isActive: boolean;
  };
  consistency: {
    version: number;
    checksum: string;
    lastValidated: Date;
  };
}

interface PlayerInfo {
  socketId: string;
  userId: string;
  position: { x: number; y: number };
  joinedAt: Date;
  lastSeen: Date;
  isReady: boolean;
}
```

### Event Models

```typescript
interface RoomJoinEvent {
  type: 'joinRoomGameSpace';
  roomId: string;
  userId: string;
  timestamp: Date;
  sequenceId: number;
}

interface RoomStateEvent {
  type: 'roomGameSpaceJoined' | 'playerJoinedRoom' | 'playerLeftRoom';
  roomId: string;
  players: PlayerInfo[];
  metadata: RoomMetadata;
  consistency: ConsistencyInfo;
}

interface ValidationEvent {
  type: 'validateRoomState';
  roomId: string;
  expectedPlayers: string[];
  timestamp: Date;
}
```

## Error Handling

### Error Categories

1. **Connection Errors**: Socket disconnection, network issues
2. **State Inconsistency**: Mismatched room state between client/server
3. **Race Conditions**: Simultaneous join/leave operations
4. **Validation Failures**: State validation timeouts or failures

### Error Recovery Strategies

```typescript
class ErrorRecoveryManager {
  async handleConnectionError(error: ConnectionError): Promise<void> {
    // Reconnect with exponential backoff
    // Resynchronize room state after reconnection
  }

  async handleStateInconsistency(error: StateError): Promise<void> {
    // Force state refresh from server
    // Validate and reconcile differences
  }

  async handleRaceCondition(error: RaceError): Promise<void> {
    // Retry with jitter
    // Use atomic operations to prevent future races
  }

  async handleValidationFailure(error: ValidationError): Promise<void> {
    // Manual resync option
    // Detailed error reporting
  }
}
```

### Logging and Monitoring

```typescript
interface RoomSyncLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  event: string;
  roomId: string;
  socketId: string;
  userId?: string;
  details: {
    roomState?: RoomState;
    playerCount?: number;
    error?: Error;
    duration?: number;
  };
}
```

## Testing Strategy

### Unit Tests

1. **RoomStateManager**: Atomic operations, consistency validation
2. **SocketEventHandler**: Event ordering, error handling
3. **RoomManager**: Join/leave flows, retry logic
4. **GameSceneManager**: State synchronization, rendering updates

### Integration Tests

1. **Room Join Flow**: End-to-end room joining with multiple clients
2. **State Synchronization**: Consistency across multiple simultaneous joins
3. **Error Recovery**: Network disconnection and reconnection scenarios
4. **Race Condition Handling**: Concurrent join/leave operations

### Load Tests

1. **Concurrent Joins**: 50+ users joining the same room simultaneously
2. **Room Switching**: Users rapidly switching between rooms
3. **Network Instability**: Simulated network issues during room operations
4. **Memory Leaks**: Long-running rooms with frequent join/leave cycles

## Performance Considerations

### Optimization Strategies

1. **Event Batching**: Batch multiple state changes into single updates
2. **State Caching**: Cache frequently accessed room states
3. **Connection Pooling**: Reuse socket connections efficiently
4. **Lazy Loading**: Load room state only when needed

### Scalability Measures

1. **Room Sharding**: Distribute rooms across multiple server instances
2. **State Persistence**: Persist room state for recovery after server restarts
3. **Load Balancing**: Balance room load across available servers
4. **Cleanup Automation**: Automatic cleanup of inactive rooms

## Security Considerations

### Access Control

1. **Room Permissions**: Validate user permissions before allowing room access
2. **Rate Limiting**: Prevent spam joining/leaving of rooms
3. **Input Validation**: Validate all room-related inputs
4. **Authentication**: Ensure only authenticated users can join rooms

### Data Protection

1. **State Encryption**: Encrypt sensitive room state data
2. **Audit Logging**: Log all room access and modifications
3. **Privacy Controls**: Respect user privacy settings in room contexts
4. **Data Retention**: Implement proper data retention policies

This design provides a comprehensive solution to the room synchronization issue by implementing atomic state management, proper event sequencing, robust error handling, and automatic recovery mechanisms. The solution ensures that users joining rooms are always visible to existing participants and provides a reliable, scalable foundation for real-time collaboration.