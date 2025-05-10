const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, location } = req.body;

    if (!name) {
      return res.status(400).json({ msg: 'Please enter your name' });
    }

    // Create user object with only required name
    const userData = { name };
    
    // Add email only if provided, with manual duplicate check
    if (email) {
      // Check if email already exists
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
      userData.email = email;
    }

    // Add location if provided
    if (location) {
      userData.location = location;
    }

    let user = new User(userData);

    await user.save();

    res.status(201).json(user);
  } catch (err) {
    console.error(err.message);
    
    // Handle other server errors
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Find user by ID and populate all relevant data
    const user = await User.findById(req.params.id)
      .populate({
        path: 'events',
        options: { sort: { date: 1 } } // Sort events by date
      })
      .populate({
        path: 'matches',
        populate: [
          {
            path: 'participants',
            select: 'name'
          },
          {
            path: 'events', // Changed from 'event' to 'events' to match the schema
            select: 'date activity'
          }
        ],
        options: { 
          sort: { createdAt: -1 },
          strictPopulate: false // Added to prevent schema validation errors
        }
      })
      .select('-__v');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/login
// @desc    Login a user by name
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { name, checkOnly } = req.body;

    if (!name) {
      return res.status(400).json({ msg: 'Please enter your name' });
    }

    // Find user by name
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ msg: 'User not found. Please register first.' });
    }

    // If it's just a check (to display city info), return minimal data
    if (checkOnly) {
      return res.json({
        _id: user._id,
        name: user.name,
        location: user.location
      });
    }

    // Otherwise, populate all relevant data
    const populatedUser = await User.findById(user._id)
      .populate({
        path: 'events',
        options: { sort: { date: 1 } } // Sort events by date
      })
      .populate({
        path: 'matches',
        populate: [
          {
            path: 'participants',
            select: 'name location'
          },
          {
            path: 'events', // Changed from 'event' to 'events' to match the schema
            select: 'date activity'
          }
        ],
        options: { 
          sort: { createdAt: -1 },
          strictPopulate: false // Added to prevent schema validation errors
        }
      });

    // Return the user with all their data
    res.json(populatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/users/:id
// @desc    Update user profile
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { location } = req.body;
    
    // Find user by ID
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update user's location if provided
    if (location) {
      user.location = location;
    }
    
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router; 