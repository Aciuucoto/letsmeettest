# LetsMeet Application

LetsMeet is a MERN stack application that helps users schedule meetings and find common availability.

## Features

- User registration and login
- Location settings for users (city-based)
- Calendar integration
- Availability management
- Automatic matching with other users based on availability
- Real-time updates via Socket.IO
- Meeting place recommendations based on users' locations and activity type
- Google Maps integration for place recommendations

## Technical Details

### Backend

- Express.js server with MongoDB database
- Socket.IO for real-time communication
- RESTful API for user management, events, matches, and place recommendations
- Google Maps & Places API integration for location-based recommendations

### Frontend

- React application with React Router
- Socket.IO client for real-time updates
- Modern UI with responsive design

## Automated Port Management

The application includes automated port management and proxy configuration to help resolve common issues:

1. **Automatic Port Detection**: The server will automatically find an available port if the configured port is in use
2. **Proxy Auto-Configuration**: When the server port changes, the frontend proxy is automatically updated
3. **Dynamic Socket.IO Connection**: The frontend connects to the backend using a dynamically determined URL

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB (running locally or a remote instance)

### Environment Setup

1. Create a `.env` file in the `backend` directory with the following variables:
   ```
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/letsmeet
   NODE_ENV=development
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

2. Get a Google Maps API key:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Create API credentials and copy your API key
   - Replace `your_google_maps_api_key` in the `.env` file with your actual API key

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Running the Application

#### Development Mode

1. Start the development server (from the root directory):
   ```
   npm run dev
   ```
   This will start both the backend and frontend servers concurrently.

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api

## Troubleshooting

### Common Issues

1. **Port Conflicts**: The application will automatically detect and use an available port if the default port is in use
2. **Database Connection**: Ensure MongoDB is running and accessible via the connection string in your `.env` file
3. **Socket Connection**: If socket connections fail, check your browser console for error messages

## License

MIT # letsmeettest
