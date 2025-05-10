const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  activity: {
    type: String,
    required: true,
    enum: ['Meet-up', 'Coffee', 'Lunch', 'Sports']
  },
  isMatched: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['None', 'Daily', 'Weekly', 'Bi-weekly', 'Monthly'],
    default: 'None'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  originalEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster querying by date, time, and activity
EventSchema.index({ date: 1, time: 1, activity: 1 });

module.exports = mongoose.model('Event', EventSchema); 