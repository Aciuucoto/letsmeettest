const express = require('express');
const router = express.Router();
const { updateTMUEvents, getTMUEvents, getTMUEventById } = require('../services/tmuEventService');

/**
 * @route   GET /api/tmu-events
 * @desc    Get TMU events within a date range
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;
    
    // Validate dates
    if ((startDate && isNaN(parsedStartDate)) || (endDate && isNaN(parsedEndDate))) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const events = await getTMUEvents(parsedStartDate, parsedEndDate);
    res.json(events);
  } catch (error) {
    console.error('Error in GET /api/tmu-events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/tmu-events/:id
 * @desc    Get a TMU event by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const event = await getTMUEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error(`Error in GET /api/tmu-events/${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/tmu-events/update
 * @desc    Trigger manual update of TMU events
 * @access  Admin
 */
router.post('/update', async (req, res) => {
  try {
    // In a production environment, you would add authentication middleware
    // to ensure only admins can trigger this endpoint
    const count = await updateTMUEvents();
    res.json({ 
      message: 'TMU events update completed', 
      eventsUpdated: count 
    });
  } catch (error) {
    console.error('Error in POST /api/tmu-events/update:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 