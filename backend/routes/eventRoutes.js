const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Match = require('../models/Match');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper function to generate recurring events
const generateRecurringEvents = async (baseEvent, userId) => {
  const { date, time, activity, recurrencePattern } = baseEvent;
  const events = [];
  
  // If no recurrence or recurrence is 'None', just return the base event
  if (!recurrencePattern || recurrencePattern === 'None') {
    return [baseEvent];
  }
  
  // Generate dates for recurring events
  const startDate = new Date(date);
  const occurrences = 10; // Generate 10 occurrences including the original
  
  for (let i = 0; i < occurrences; i++) {
    const eventDate = new Date(startDate);
    
    // Calculate the date based on recurrence pattern
    switch (recurrencePattern) {
      case 'Daily':
        eventDate.setDate(startDate.getDate() + i);
        break;
      case 'Weekly':
        eventDate.setDate(startDate.getDate() + (i * 7));
        break;
      case 'Bi-weekly':
        eventDate.setDate(startDate.getDate() + (i * 14));
        break;
      case 'Monthly':
        eventDate.setMonth(startDate.getMonth() + i);
        break;
      default:
        // Skip if recurrence pattern is not recognized
        continue;
    }
    
    // Create event object
    const eventObj = {
      user: userId,
      date: eventDate,
      time,
      activity,
      recurrencePattern: i === 0 ? recurrencePattern : 'None', // Only the first event has recurrence pattern
      isMatched: false,
      // Flag to identify this as part of a recurring series
      isRecurring: i > 0,
      // Store the ID of the original event if this is a recurring instance
      originalEventId: i === 0 ? null : baseEvent._id || null
    };
    
    events.push(eventObj);
  }
  
  return events;
};

// @route   POST api/events
// @desc    Create a new event/availability
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { userId, date, time, activity, recurrencePattern } = req.body;

    if (!userId || !date || !time || !activity) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Format date to start of day
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);

    // Create base event object
    const baseEvent = {
      user: userId,
      date: eventDate,
      time,
      activity,
      recurrencePattern: recurrencePattern || 'None'
    };

    // Generate recurring events if needed
    const eventsToCreate = await generateRecurringEvents(baseEvent, userId);
    
    // Save all events
    const createdEvents = await Event.insertMany(eventsToCreate);
    
    // Original event is the first one
    const newEvent = createdEvents[0];
    
    // Check for matching events for the original event only
    const matchingEvents = await Event.find({
      date: eventDate,
      time,
      activity,
      user: { $ne: userId },
      isMatched: false
    }).populate('user', 'name');
    
    // If there's a matching event, create a match
    if (matchingEvents.length > 0) {
      const matchEvent = matchingEvents[0];
      
      // Create match
      const newMatch = new Match({
        participants: [userId, matchEvent.user._id],
        events: [newEvent._id, matchEvent._id],
        date: eventDate,
        time,
        activity,
        status: [
          { user: userId, response: 'pending' },
          { user: matchEvent.user._id, response: 'pending' }
        ]
      });
      
      // Update both events to be matched
      newEvent.isMatched = true;
      matchEvent.isMatched = true;
      
      await Promise.all([
        newEvent.save(),
        matchEvent.save(),
        newMatch.save()
      ]);
      
      res.json({ 
        event: newEvent, 
        match: newMatch,
        recurringEvents: createdEvents.length > 1 ? createdEvents.length - 1 : 0
      });
    } else {
      res.json({ 
        event: newEvent,
        recurringEvents: createdEvents.length > 1 ? createdEvents.length - 1 : 0
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/events/:id
// @desc    Update an event recurrence pattern
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { recurrencePattern } = req.body;
    
    if (!recurrencePattern) {
      return res.status(400).json({ msg: 'Please provide recurrence pattern' });
    }
    
    // Find the event
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Delete any existing future recurring events for this event
    await Event.deleteMany({ 
      originalEventId: event._id
    });
    
    // Update the recurrence pattern
    event.recurrencePattern = recurrencePattern;
    await event.save();
    
    // Generate new recurring events
    const baseEvent = {
      _id: event._id,
      user: event.user,
      date: event.date,
      time: event.time,
      activity: event.activity,
      recurrencePattern
    };
    
    const eventsToCreate = await generateRecurringEvents(baseEvent, event.user);
    
    // Skip the first one since it's the original event that we already updated
    const newRecurringEvents = eventsToCreate.slice(1);
    
    // Save all new recurring events
    if (newRecurringEvents.length > 0) {
      await Event.insertMany(newRecurringEvents);
    }
    
    // Return updated event with a count of recurring events
    res.json({ 
      event,
      recurringEvents: newRecurringEvents.length
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/events/user/:userId
// @desc    Get all events for a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const events = await Event.find({ user: req.params.userId })
      .sort({ date: 1 })
      .populate('user', 'name');

    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/events/:id
// @desc    Delete an event
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Check if this event is part of a match
    const match = await Match.findOne({ events: event._id });
    
    if (match) {
      // Remove the event from the match
      match.events = match.events.filter(e => e.toString() !== event._id.toString());
      
      // If there's no events left in match, delete the match
      if (match.events.length === 0) {
        await Match.findByIdAndDelete(match._id);
      } else {
        await match.save();
      }
    }
    
    // Delete only this single event
    await Event.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/events/series/:id
// @desc    Delete an event and all its recurring instances
// @access  Public
router.delete('/series/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    let eventsToDelete = [];
    let originalEventId = null;
    
    // If this is an original event with recurrence
    if (event.recurrencePattern !== 'None' && !event.isRecurring) {
      originalEventId = event._id;
      // Add this event to the list of events to delete
      eventsToDelete.push(event._id);
    } 
    // If this is a recurring instance of another event
    else if (event.isRecurring && event.originalEventId) {
      originalEventId = event.originalEventId;
      // Find the original event
      const originalEvent = await Event.findById(originalEventId);
      if (originalEvent) {
        eventsToDelete.push(originalEvent._id);
      }
    } else {
      // If it's just a single event, only delete this one
      await Event.findByIdAndDelete(req.params.id);
      return res.json({ msg: 'Event removed', count: 1 });
    }
    
    // Find all events in the series
    if (originalEventId) {
      const recurringEvents = await Event.find({ originalEventId });
      eventsToDelete = [...eventsToDelete, ...recurringEvents.map(e => e._id)];
    }
    
    // Check if any of these events are part of matches
    const matches = await Match.find({ events: { $in: eventsToDelete } });
    
    // For each match, remove the events that are being deleted
    for (const match of matches) {
      match.events = match.events.filter(e => !eventsToDelete.some(id => id.equals(e)));
      
      // If there's no events left in match, delete the match
      if (match.events.length === 0) {
        await Match.findByIdAndDelete(match._id);
      } else {
        await match.save();
      }
    }
    
    // Delete all events in the series
    const result = await Event.deleteMany({ 
      $or: [
        { _id: { $in: eventsToDelete } },
        { originalEventId }
      ]
    });
    
    res.json({ 
      msg: 'All events in series removed',
      count: result.deletedCount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/events/available-users
// @desc    Get all users available at a specific time
// @access  Public
router.get('/available-users', async (req, res) => {
  try {
    const { date, time, activity } = req.query;

    if (!date || !time || !activity) {
      return res.status(400).json({ msg: 'Please provide date, time, and activity parameters' });
    }

    // Format date to start of day
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);

    // Find events that match the criteria
    const matchingEvents = await Event.find({
      date: eventDate,
      time,
      activity
    }).populate('user', 'name email location');

    // Extract unique users
    const users = matchingEvents.map(event => event.user);
    const uniqueUsers = Array.from(new Map(users.map(user => [user._id.toString(), user])).values());

    res.json(uniqueUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/events/date
// @desc    Get all events for a specific date
// @access  Public
router.get('/date', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ msg: 'Please provide a date parameter' });
    }

    // Format date to start of day
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    
    // End of day
    const nextDay = new Date(eventDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find events for this date (using range to ensure we catch all events for the day)
    const eventsOnDate = await Event.find({
      date: { 
        $gte: eventDate,
        $lt: nextDay 
      }
    }).populate('user', 'name location email');

    // Log the results to help with debugging
    console.log(`Found ${eventsOnDate.length} events for date ${eventDate.toISOString()}`);
    
    res.json(eventsOnDate);
  } catch (err) {
    console.error('Error fetching events for date:', err);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

module.exports = router; 