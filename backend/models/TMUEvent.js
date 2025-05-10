const mongoose = require('mongoose');

const TMUEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  organizer: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String
  },
  eventUrl: {
    type: String
  },
  source: {
    type: String,
    default: 'TMU ConnectRU'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
TMUEventSchema.index({ startDate: 1 });
TMUEventSchema.index({ endDate: 1 });

const TMUEvent = mongoose.model('TMUEvent', TMUEventSchema);

module.exports = TMUEvent; 