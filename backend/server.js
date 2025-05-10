const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { updateFrontendProxy } = require('./updateProxy');

// Import routes
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const matchRoutes = require('./routes/matchRoutes');
const placesRoutes = require('./routes/placesRoutes');
const tmuEventRoutes = require('./routes/tmuEventRoutes');

// Import TMU event service for scheduled updates
const { updateTMUEvents } = require('./services/tmuEventService');

// Load env vars
dotenv.config();

// Initialize express
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/letsmeet', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB Connected');
  
  try {
    // Fix for email duplication issue - drop the email index if it exists
    const User = mongoose.model('User');
    const collection = User.collection;
    
    // Check if the index exists before attempting to drop it
    const indexes = await collection.indexes();
    const emailIndexExists = indexes.some(index => index.key && index.key.email);
    
    if (emailIndexExists) {
      await collection.dropIndex('email_1');
      console.log('Dropped email index to fix duplication issue');
    }
  } catch (err) {
    console.error('Error handling email index:', err.message);
  }
  
  // Initial TMU events update
  try {
    console.log('Performing initial TMU events update...');
    await updateTMUEvents();
    console.log('Initial TMU events update completed');
    
    // Set up daily TMU events update
    setInterval(async () => {
      try {
        console.log('Running scheduled TMU events update...');
        await updateTMUEvents();
        console.log('Scheduled TMU events update completed');
      } catch (error) {
        console.error('Error in scheduled TMU events update:', error);
      }
    }, 24 * 60 * 60 * 1000); // Run once every 24 hours
  } catch (err) {
    console.error('Error in initial TMU events update:', err);
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Join a room based on userId
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/tmu-events', tmuEventRoutes);

// Add a simple endpoint for socket connections to test connectivity
app.head('/api/socket', (req, res) => {
  res.status(200).send();
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
  });
}

// Socket.io instance available to the rest of the application
app.set('io', io);

// Dynamic port detection and handling
const PORT = process.env.PORT || 5001;
let finalPort = PORT;

// Function to detect available port
const detectPort = async (port) => {
  return new Promise((resolve) => {
    const testServer = http.createServer();
    
    testServer.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying ${port + 1}...`);
        resolve(detectPort(port + 1));
      } else {
        resolve(port);
      }
    });
    
    testServer.once('listening', () => {
      testServer.close();
      resolve(port);
    });
    
    testServer.listen(port);
  });
};

// Start server with dynamic port detection
(async () => {
  finalPort = await detectPort(PORT);
  server.listen(finalPort, () => {
    console.log(`Server running on port ${finalPort}`);
    
    // If we're using a different port than what's in .env, let's update the frontend proxy
    if (PORT != finalPort) {
      console.log(`NOTE: Your .env has PORT=${PORT} but we're using ${finalPort} to avoid conflicts.`);
      
      // Automatically update the frontend proxy
      const updated = updateFrontendProxy(finalPort);
      if (!updated) {
        console.log('Manual update may be needed. Update your frontend proxy in frontend/package.json.');
      }
    }
  });
})(); 