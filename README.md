# VaultMeet - Complete Project Documentation

## 🎯 Project Overview

**VaultMeet** is a revolutionary 2D virtual world platform designed for hosting and participating in hackathons, workshops, and tech events. It combines real-time collaboration, gaming elements, and professional networking in an immersive virtual environment.

### Key Features
- **2D Virtual World**: Interactive game-like environment built with Phaser.js
- **Real-time Collaboration**: Live chat, video calls, and collaborative coding
- **Event Management**: Complete hackathon and workshop hosting system
- **User Networking**: Professional profiles, connections, and achievements
- **AI-Powered News**: Automated tech news aggregation using Google Gemini
- **Multi-platform Support**: Web-based platform with responsive design

---

## 🏗️ Architecture Overview

VaultMeet follows a **microservices architecture** with the following components:

```
VaultMeet/
├── frontend/          # Next.js 15 React application
├── backend/
│   ├── user/         # User management & authentication service
│   ├── event/        # Event management service
│   └── gateway/      # API gateway & WebSocket server
└── bot/              # AI news aggregation service
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Game Engine**: Phaser.js 3
- **Real-time**: Socket.IO Client
- **Video Calls**: Agora RTC SDK
- **Code Editor**: Monaco Editor
- **UI Components**: Custom components + React Icons

#### Backend Services
- **User Service**: Node.js + Express + TypeScript
- **Event Service**: Node.js + Express + JavaScript
- **Gateway Service**: Node.js + Express + Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **File Upload**: Cloudinary + Multer
- **Email**: Nodemailer + Mailtrap

#### AI Bot Service
- **Framework**: Flask (Python)
- **AI Model**: Google Gemini 2.0 Flash
- **Web Scraping**: Requests library
- **CORS**: Flask-CORS

---

## 📁 Detailed Project Structure

### Frontend Structure (`/frontend`)

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (metaSpace)/       # Virtual world routes
│   │   │   ├── event-space/   # Event-specific spaces
│   │   │   └── room/          # Private rooms
│   │   ├── (website)/         # Public website routes
│   │   │   ├── about/
│   │   │   ├── events/
│   │   │   ├── host/
│   │   │   ├── news/
│   │   │   └── profile/
│   │   └── admin/             # Admin panel
│   ├── components/            # Reusable React components
│   │   ├── Auth/             # Authentication components
│   │   ├── Chat/             # Chat system components
│   │   ├── Dashboard/        # Dashboard components
│   │   ├── Game/             # Game-related components
│   │   │   ├── Scenes/       # Phaser.js game scenes
│   │   │   ├── Modals/       # Game modals
│   │   │   └── Warnings/     # Mobile warnings
│   │   ├── Home/             # Landing page components
│   │   ├── Layout/           # Layout components
│   │   ├── Navbar/           # Navigation components
│   │   └── Profile/          # Profile components
│   ├── context/              # React Context providers
│   ├── data/                 # Static data and configurations
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API service functions
│   ├── utils/                # Utility functions
│   └── Zustand_Store/        # State management stores
├── public/                   # Static assets
│   ├── game/                 # Game assets (maps, tilesets)
│   ├── fonts/                # Custom fonts
│   └── images/               # Images and icons
└── package.json              # Dependencies and scripts
```

### Backend Structure

#### User Service (`/backend/user`)
```
backend/user/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── project.controller.ts
│   │   └── room.controller.ts
│   ├── models/               # MongoDB schemas
│   │   ├── user.model.ts
│   │   ├── message.model.ts
│   │   ├── project.model.ts
│   │   ├── room.model.ts
│   │   ├── report.model.ts
│   │   └── blacklistToken.model.ts
│   ├── routes/               # API routes
│   │   ├── user.routes.ts
│   │   ├── project.routes.ts
│   │   └── room.routes.ts
│   ├── middlewares/          # Express middlewares
│   │   └── auth.middleware.ts
│   ├── services/             # Business logic
│   │   ├── user.service.ts
│   │   └── room.service.ts
│   ├── config/               # Configuration files
│   │   ├── app.config.ts
│   │   ├── cloudinary.ts
│   │   ├── file.upload.ts
│   │   └── mailConfig.ts
│   ├── db/                   # Database connection
│   │   └── db.ts
│   ├── helpers/              # Helper functions
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── uploads/              # File upload directory
│   ├── app.ts                # Express app configuration
│   └── server.ts             # Server entry point
└── package.json
```

#### Event Service (`/backend/event`)
```
backend/event/
├── controllers/              # Event management controllers
│   └── event.controllers.js
├── models/                   # Event-related models
│   ├── event.model.js
│   ├── news.model.js
│   ├── user.model.js
│   └── blacklistToken.model.js
├── routes/                   # Event API routes
│   └── event.routes.js
├── middlewares/              # Authentication middleware
│   └── auth.middleware.js
├── config/                   # Configuration files
│   ├── cloudinary.js
│   └── file.upload.js
├── db/                       # Database connection
│   └── db.js
├── uploads/                  # File uploads
├── app.js                    # Express app
└── server.js                 # Server entry point
```

#### Gateway Service (`/backend/gateway`)
```
backend/gateway/
├── controllers/              # Socket event handlers
│   ├── socketController.js
│   └── chatSocketController.js
├── middlewares/              # Authentication middleware
│   └── auth.middleware.js
├── models/                   # Shared models
│   ├── user.model.js
│   ├── event.model.js
│   └── blacklistToken.model.js
├── app.js                    # Express app with proxy
└── server.js                 # Socket.IO server
```

### Bot Service (`/bot`)
```
bot/
├── main.py                   # Flask application
├── requirements.txt          # Python dependencies
└── venv/                     # Virtual environment
```

---

## 🔄 Data Flow & Communication

### 1. User Authentication Flow
```
Frontend → User Service → MongoDB
    ↓
JWT Token → Gateway Service → Real-time features
```

### 2. Event Management Flow
```
Frontend → Event Service → MongoDB
    ↓
Event Data → User Service → Participant Management
```

### 3. Real-time Communication Flow
```
Frontend ↔ Gateway Service ↔ Socket.IO
    ↓
Real-time events → User Service → Database updates
```

### 4. News Aggregation Flow
```
Admin Panel → Bot Service → Google Gemini AI
    ↓
Processed News → Event Service → Database
```

---

## 🎮 Game System Architecture

### Phaser.js Integration
The game system is built using **Phaser.js 3** with the following components:

#### Game Scenes
- **Lobby Scene**: Main virtual world environment
- **General Space**: Alternative map for different events
- **Room Scenes**: Private collaborative spaces

#### Key Features
- **Real-time Multiplayer**: Socket.IO integration for live player movement
- **Interactive Elements**: Clickable objects, NPCs, and portals
- **Custom Assets**: Tilesets, sprites, and animations
- **Responsive Design**: Adapts to different screen sizes

#### Game Components
```typescript
// Main game component
<PhaserGame 
  eventId={eventId} 
  roomId={roomId} 
  mapType="vaultmeet" 
/>

// Game scenes handle:
- Player movement and physics
- Real-time synchronization
- Interactive elements
- Chat integration
- Video call overlays
```

---

## 💬 Real-time Communication System

### Socket.IO Implementation
The platform uses **dual Socket.IO instances** for different purposes:

#### 1. Main Socket (Port 4000)
- **Purpose**: Game synchronization and real-time events
- **Events**: Player movement, game state, room management
- **Path**: `/socket.io`

#### 2. Chat Socket (Port 4000)
- **Purpose**: Real-time messaging and chat features
- **Events**: Message sending/receiving, typing indicators
- **Path**: `/chat/socket.io`

### Chat System Features
- **Real-time Messaging**: Instant message delivery
- **Typing Indicators**: Show when users are typing
- **Message History**: Persistent chat storage
- **Room-based Chat**: Separate chat for different spaces
- **File Sharing**: Support for image and file uploads

---

## 🎥 Video Communication System

### Agora RTC Integration
The platform integrates **Agora RTC SDK** for video communication:

#### Features
- **High-quality Video**: HD video streaming
- **Screen Sharing**: Collaborative screen sharing
- **Recording**: Session recording capabilities
- **Multiple Participants**: Support for large groups
- **Cross-platform**: Works on web and mobile

#### Implementation
```typescript
// Video call component
<GoogleMeetView 
  channelName={roomId}
  appId={AGORA_APP_ID}
  token={token}
/>
```

---

## 🔐 Authentication & Security

### JWT-based Authentication
- **Token Expiry**: 7 days
- **Blacklisting**: Logged out tokens are invalidated
- **Secure Storage**: HTTP-only cookies + Authorization headers
- **Password Hashing**: bcrypt with salt rounds

### Security Features
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Express-validator for all inputs
- **File Upload Security**: File type and size validation
- **Rate Limiting**: Protection against abuse
- **SQL Injection Protection**: Mongoose ODM

---

## 📊 Database Schema

### User Model
```typescript
{
  fullname: { firstname: String, lastname: String },
  email: String (unique),
  username: String (unique),
  password: String (hashed),
  role: String (user/admin),
  avatar: String (Cloudinary URL),
  banner: String (Cloudinary URL),
  bio: String,
  location: String,
  college: String,
  skills: [String],
  interests: [String],
  social: {
    github: String,
    linkedin: String,
    twitter: String
  },
  featuredProject: {
    title: String,
    description: String,
    link: String,
    techUsed: [String]
  },
  achievements: [String],
  connections: [ObjectId],
  googleId: String
}
```

### Event Model
```typescript
{
  company: {
    name: String,
    website: String,
    industry: String,
    logo: String
  },
  name: String,
  type: String,
  mode: String (online/offline/hybrid),
  startDate: Date,
  endDate: Date,
  description: String,
  banner: String,
  venue: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String
  },
  stages: [{
    stageName: String,
    stageDescription: String,
    stageStartDate: Date,
    stageEndDate: Date,
    onVaultMeet: Boolean
  }],
  prizes: {
    hasPrizes: Boolean,
    prizePool: String,
    prize1: String,
    prize2: String,
    prize3: String
  },
  status: String (draft/published),
  stats: {
    registeredParticipants: Number,
    approvedParticipants: Number
  }
}
```

### Message Model
```typescript
{
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  content: String,
  messageType: String (text/image/file),
  fileUrl: String,
  roomId: String,
  read: Boolean,
  timestamp: Date
}
```

---

## 🚀 Development Setup

### Prerequisites
- **Node.js**: v18+ 
- **Python**: v3.8+
- **MongoDB**: v6+
- **Git**: Latest version

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_GATEWAY_URL=http://localhost:4000
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

#### User Service (.env)
```env
PORT=4001
MONGODB_URI=mongodb://localhost:27017/vaultmeet
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=http://localhost:3000
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_pass
```

#### Event Service (.env)
```env
PORT=4002
MONGODB_URI=mongodb://localhost:27017/vaultmeet
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

#### Gateway Service (.env)
```env
PORT=4000
USER_SERVICE_URL=http://localhost:4001
EVENT_SERVICE_URL=http://localhost:4002
JWT_SECRET=your_jwt_secret
```

#### Bot Service (.env)
```env
FLASK_APP=main.py
FLASK_ENV=development
GEMINI_API_KEY=your_gemini_api_key
```

### Installation Steps

#### 1. Clone Repository
```bash
git clone <repository-url>
cd VaultMeet
```

#### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### 3. Install Backend Dependencies
```bash
# User Service
cd backend/user
npm install

# Event Service
cd backend/event
npm install

# Gateway Service
cd backend/gateway
npm install
```

#### 4. Install Bot Dependencies
```bash
cd bot
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 5. Start Services
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: User Service
cd backend/user
npm run dev

# Terminal 3: Event Service
cd backend/event
node server.js

# Terminal 4: Gateway Service
cd backend/gateway
npm start

# Terminal 5: Bot Service
cd bot
python main.py
```

---

## 🔧 Key Development Concepts

### 1. State Management (Zustand)
The frontend uses **Zustand** for state management with multiple stores:

```typescript
// Auth Store
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (userData) => set({ user: userData.user, token: userData.token }),
  logout: () => set({ user: null, token: null })
}));

// Socket Store
const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket })
}));
```

### 2. API Service Pattern
Services are organized by feature with consistent error handling:

```typescript
// Example API service
export const userService = {
  login: async (credentials) => {
    try {
      const response = await axios.post('/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }
};
```

### 3. Socket Event Handling
Real-time events are handled through custom hooks:

```typescript
// Custom hook for socket events
const useCodingSpaceSocket = () => {
  const { socket } = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    
    return () => {
      socket.off('playerJoined');
      socket.off('playerLeft');
    };
  }, [socket]);
};
```

### 4. Game Scene Management
Phaser.js scenes are managed with proper cleanup:

```typescript
// Game scene with socket integration
class Lobby extends Scene {
  constructor() {
    super({ key: 'Lobby' });
  }
  
  init(data) {
    this.socket = data.socket;
    this.userId = data.userId;
  }
  
  create() {
    // Initialize game objects
    this.createPlayer();
    this.setupSocketEvents();
  }
  
  setupSocketEvents() {
    this.socket.on('playerMoved', this.handlePlayerMove);
  }
}
```

---

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **Component Tests**: Isolated component testing
- **Integration Tests**: API integration testing
- **E2E Tests**: Playwright for critical user flows

### Backend Testing
- **Unit Tests**: Jest for controllers and services
- **Integration Tests**: API endpoint testing
- **Database Tests**: MongoDB integration testing

### Game Testing
- **Scene Tests**: Phaser.js scene testing
- **Socket Tests**: Real-time event testing
- **Performance Tests**: Game performance monitoring

---

## 📈 Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Dynamic imports for game components
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Webpack bundle analyzer
- **Lazy Loading**: Game assets loaded on demand

### Backend Optimizations
- **Database Indexing**: MongoDB query optimization
- **Caching**: Redis for frequently accessed data
- **Connection Pooling**: MongoDB connection management
- **Rate Limiting**: API abuse prevention

### Game Optimizations
- **Asset Preloading**: Critical assets loaded upfront
- **Object Pooling**: Reuse game objects
- **Viewport Culling**: Only render visible objects
- **Memory Management**: Proper cleanup of game objects

---

## 🔒 Security Considerations

### Data Protection
- **Input Sanitization**: All user inputs validated
- **XSS Prevention**: Content Security Policy headers
- **CSRF Protection**: Token-based CSRF protection
- **File Upload Security**: Strict file type validation

### Authentication Security
- **Password Requirements**: Minimum 8 characters
- **Account Lockout**: Failed login attempt limits
- **Session Management**: Secure session handling
- **Token Refresh**: Automatic token renewal

### API Security
- **Rate Limiting**: Prevent API abuse
- **CORS Configuration**: Strict origin policies
- **Request Validation**: All requests validated
- **Error Handling**: Secure error messages

---

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
# Build and deploy
npm run build
vercel --prod
```

### Backend Deployment (Railway/Heroku)
```bash
# User Service
cd backend/user
npm run build
railway up

# Event Service
cd backend/event
railway up

# Gateway Service
cd backend/gateway
railway up
```

### Bot Deployment (Railway)
```bash
cd bot
railway up
```

### Environment Setup
- **Production Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **CDN**: Vercel Edge Network
- **Monitoring**: Sentry for error tracking

---

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Phaser.js Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)

### Development Tools
- **VS Code Extensions**: 
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - MongoDB for VS Code
  - REST Client

### Useful Commands
```bash
# Frontend development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint

# Backend development
npm run dev          # Start with nodemon
npm run build        # Build TypeScript
npm start           # Start production server

# Database
mongosh             # Connect to MongoDB
mongoimport         # Import data
mongoexport         # Export data
```

---

## 🤝 Contributing Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Consistent code style
- **Prettier**: Code formatting
- **Git Hooks**: Pre-commit linting

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation update
style: code formatting
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Pull Request Process
1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit PR with description
6. Code review required
7. Merge after approval

---

This documentation provides a comprehensive overview of the VaultMeet project. For specific implementation details, refer to the individual component files and their inline documentation.
