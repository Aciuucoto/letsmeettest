const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const mongoose = require('mongoose');

// @route   GET api/matches/user/:userId
// @desc    Get all matches for a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const matches = await Match.find({ 
      participants: req.params.userId 
    })
    .populate('participants', 'name')
    .populate('events')
    .sort({ createdAt: -1 });

    res.json(matches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/matches/:id
// @desc    Get match by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('participants', 'name')
      .populate('events');

    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }

    res.json(match);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/matches/:id/respond
// @desc    Respond to a match (accept/decline)
// @access  Public
router.put('/:id/respond', async (req, res) => {
  try {
    const { userId, response } = req.body;

    if (!userId || !response || !['accepted', 'declined'].includes(response)) {
      return res.status(400).json({ msg: 'Please provide valid user ID and response' });
    }

    // Find the match
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ msg: 'Match not found' });
    }

    // Check if user is part of the match
    if (!match.participants.some(p => p.toString() === userId)) {
      return res.status(400).json({ msg: 'User is not part of this match' });
    }

    // Update the user's response
    const statusIndex = match.status.findIndex(s => s.user.toString() === userId);
    if (statusIndex !== -1) {
      match.status[statusIndex].response = response;
    } else {
      match.status.push({ user: userId, response });
    }

    // Check if all participants have accepted
    const allAccepted = match.status.every(s => s.response === 'accepted');
    
    // If all accepted, mark the match as confirmed
    if (allAccepted) {
      match.isConfirmed = true;
    }
    
    // If anyone declined, handle accordingly
    const anyDeclined = match.status.some(s => s.response === 'declined');
    
    // Save the match
    await match.save();

    // Send notifications through socket.io
    const io = req.app.get('io');
    if (io) {
      // Get the other user
      const otherUserId = match.participants.find(p => p.toString() !== userId).toString();
      
      if (response === 'accepted') {
        io.to(otherUserId).emit('matchResponse', { 
          matchId: match._id, 
          userId, 
          response: 'accepted',
          isConfirmed: match.isConfirmed
        });
      } else if (response === 'declined') {
        io.to(otherUserId).emit('matchResponse', { 
          matchId: match._id, 
          userId, 
          response: 'declined'
        });
      }
    }

    res.json(match);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Match not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router; 