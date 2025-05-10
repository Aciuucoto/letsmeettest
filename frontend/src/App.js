import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

// Components
import Navbar from './components/layout/Navbar';
import Landing from './components/pages/Landing';
import Register from './components/auth/Register';
import Profile from './components/profile/Profile';
import NotFound from './components/pages/NotFound';
import Login from './components/auth/Login';

// Services
import userService from './services/userService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    // Determine the backend API URL from the proxy setting
    const getBackendUrl = () => {
      // In development with proxy, use the same host but with the proxy port
      if (process.env.NODE_ENV === 'development') {
        const proxyUrl = new URL(window.location.origin);
        const apiPath = '/api/socket';
        
        // Try to make a test request to determine the actual port
        return fetch(apiPath, { method: 'HEAD' })
          .then(res => {
            // If the request is redirected, we can extract the port from the URL
            if (res.redirected) {
              const redirectUrl = new URL(res.url);
              return `http://${redirectUrl.hostname}:${redirectUrl.port}`;
            }
            return `http://localhost:5001`; // Fallback to default port
          })
          .catch(() => {
            console.warn('Could not auto-detect backend port, using default 5001');
            return `http://localhost:5001`; // Fallback to default port
          });
      } else {
        // In production, use the same host (no need for separate port)
        return Promise.resolve(window.location.origin);
      }
    };

    // Connect to socket with dynamic URL
    getBackendUrl().then(backendUrl => {
      console.log(`Connecting to Socket.IO at: ${backendUrl}`);
      const newSocket = io(backendUrl);
      setSocket(newSocket);
    });

    // Clean up socket on unmount
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Check if user is stored in localStorage
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const userData = await userService.getUser(userId);
          setUser(userData);
          
          // Join the user's socket room
          if (socket) {
            socket.emit('join', userId);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          localStorage.removeItem('userId');
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();
  }, [socket]);

  // Function to handle user login
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('userId', userData._id);
    
    // Join the user's socket room
    if (socket) {
      socket.emit('join', userData._id);
    }
  };

  // Function to handle user logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    
    // Leave the socket room
    if (socket) {
      socket.disconnect();
      
      // Reconnect with dynamic URL
      const getBackendUrl = async () => {
        if (process.env.NODE_ENV === 'development') {
          try {
            const res = await fetch('/api/socket', { method: 'HEAD' });
            if (res.redirected) {
              const redirectUrl = new URL(res.url);
              return `http://${redirectUrl.hostname}:${redirectUrl.port}`;
            }
          } catch (error) {
            console.warn('Could not auto-detect backend port, using default 5001');
          }
          return 'http://localhost:5001';
        } else {
          return window.location.origin;
        }
      };
      
      getBackendUrl().then(backendUrl => {
        const newSocket = io(backendUrl);
        setSocket(newSocket);
      });
    }
  };

  if (loading) {
    return <div className="container flex flex-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />
      <ToastContainer position="top-right" autoClose={3000} />
      <main className="container" style={{ paddingTop: '2rem' }}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/profile" /> : <Landing />} />
          <Route path="/register" element={user ? <Navigate to="/profile" /> : <Register handleLogin={handleLogin} />} />
          <Route path="/login" element={user ? <Navigate to="/profile" /> : <Login handleLogin={handleLogin} />} />
          <Route path="/profile" element={user ? <Profile user={user} socket={socket} /> : <Navigate to="/register" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

export default App; 