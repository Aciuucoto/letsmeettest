const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  location: {
    city: {
      type: String,
      trim: true,
      default: ''
    },
    coordinates: {
      lat: {
        type: Number,
        default: null
      },
      lng: {
        type: Number,
        default: null
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's events
UserSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// Virtual for user's matches
UserSchema.virtual('matches', {
  ref: 'Match',
  localField: '_id',
  foreignField: 'participants',
  justOne: false
});

// Custom method to check for duplicate emails (only for non-null emails)
UserSchema.statics.emailExists = async function(email) {
  if (!email) return false;
  
  const user = await this.findOne({ email });
  return !!user;
};

module.exports = mongoose.model('User', UserSchema); 