const TMUEvent = require('../models/TMUEvent');
const { scrapeTMUEvents } = require('../utils/tmuEventScraper');

// Cache for mock events to avoid generating new ones on every request
let mockEventsCache = null;
let lastMockEventsUpdate = null;

/**
 * Fetches TMU events from ConnectRU and updates the database
 * @returns {Promise<number>} - Number of events updated
 */
async function updateTMUEvents() {
  try {
    console.log('Starting TMU event update...');
    
    // Fetch events from ConnectRU
    const events = await scrapeTMUEvents();
    
    // Filter out mock events which would cause MongoDB validation errors
    const realEvents = events.filter(event => !event._id || (typeof event._id !== 'string' || !event._id.startsWith('mock_')));
    
    if (!realEvents.length) {
      console.log('No real TMU events found to update');
      return 0;
    }
    
    // Track update stats
    let added = 0;
    let updated = 0;
    
    // Process each event
    for (const event of realEvents) {
      // Remove _id if it exists to prevent validation errors
      if (event._id) {
        delete event._id;
      }
      
      // Check if event already exists (using title and start date as unique identifier)
      const existingEvent = await TMUEvent.findOne({
        title: event.title,
        startDate: event.startDate
      });
      
      if (existingEvent) {
        // Update existing event
        await TMUEvent.updateOne(
          { _id: existingEvent._id },
          { 
            ...event,
            lastUpdated: new Date()
          }
        );
        updated++;
      } else {
        // Create new event
        await TMUEvent.create({
          ...event,
          lastUpdated: new Date()
        });
        added++;
      }
    }
    
    console.log(`TMU events update complete: ${added} added, ${updated} updated`);
    return added + updated;
  } catch (error) {
    console.error('Error updating TMU events:', error);
    throw error;
  }
}

/**
 * Gets TMU events within a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Array of TMU events
 */
async function getTMUEvents(startDate, endDate) {
  try {
    // First try to get events from the database
    const query = {};
    
    if (startDate && endDate) {
      // Events that overlap with the given range
      query.$or = [
        { 
          startDate: { $gte: startDate, $lte: endDate } 
        },
        { 
          endDate: { $gte: startDate, $lte: endDate } 
        },
        {
          startDate: { $lte: startDate },
          endDate: { $gte: endDate }
        }
      ];
    } else if (startDate) {
      // Events that start after the given date
      query.startDate = { $gte: startDate };
    } else if (endDate) {
      // Events that end before the given date
      query.endDate = { $lte: endDate };
    }
    
    const dbEvents = await TMUEvent.find(query).sort({ startDate: 1 });
    
    // If we found events in the database, return them
    if (dbEvents.length > 0) {
      return dbEvents;
    }
    
    // If no events in database, generate mock events
    console.log('No TMU events found in database, providing mock events');
    
    // Check if we have cached mock events and they're less than 1 hour old
    const now = new Date();
    if (mockEventsCache && lastMockEventsUpdate && 
        (now.getTime() - lastMockEventsUpdate.getTime() < 60 * 60 * 1000)) {
      console.log('Using cached mock events');
      
      // Filter by date if needed
      if (startDate || endDate) {
        return mockEventsCache.filter(event => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);
          
          if (startDate && endDate) {
            return (eventStart >= startDate && eventStart <= endDate) || 
                  (eventEnd >= startDate && eventEnd <= endDate) ||
                  (eventStart <= startDate && eventEnd >= endDate);
          } else if (startDate) {
            return eventStart >= startDate;
          } else if (endDate) {
            return eventEnd <= endDate;
          }
          
          return true;
        });
      }
      
      return mockEventsCache;
    }
    
    // Generate new mock events
    const { scrapeTMUEvents } = require('../utils/tmuEventScraper');
    const events = await scrapeTMUEvents();
    
    // Cache the mock events
    mockEventsCache = events;
    lastMockEventsUpdate = now;
    
    // Filter by date if needed
    if (startDate || endDate) {
      return events.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        if (startDate && endDate) {
          return (eventStart >= startDate && eventStart <= endDate) || 
                (eventEnd >= startDate && eventEnd <= endDate) ||
                (eventStart <= startDate && eventEnd >= endDate);
        } else if (startDate) {
          return eventStart >= startDate;
        } else if (endDate) {
          return eventEnd <= endDate;
        }
        
        return true;
      });
    }
    
    return events;
  } catch (error) {
    console.error('Error fetching TMU events:', error);
    throw error;
  }
}

/**
 * Gets a TMU event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} - TMU event
 */
async function getTMUEventById(eventId) {
  try {
    // Handle mock event IDs
    if (eventId.startsWith('mock_')) {
      // If we have cached mock events, find the one with matching ID
      if (mockEventsCache) {
        const mockEvent = mockEventsCache.find(event => event._id === eventId);
        if (mockEvent) {
          return mockEvent;
        }
      }
      
      // If no cached mock event found, generate new mock events and try again
      const { scrapeTMUEvents } = require('../utils/tmuEventScraper');
      const events = await scrapeTMUEvents();
      
      // Cache the mock events
      mockEventsCache = events;
      lastMockEventsUpdate = new Date();
      
      // Find the event with matching ID
      const mockEvent = events.find(event => event._id === eventId);
      if (mockEvent) {
        return mockEvent;
      }
      
      // If still not found, return null
      return null;
    }
    
    // For real event IDs, query the database
    const event = await TMUEvent.findById(eventId);
    return event;
  } catch (error) {
    console.error('Error fetching TMU event by ID:', error);
    throw error;
  }
}

module.exports = {
  updateTMUEvents,
  getTMUEvents,
  getTMUEventById
}; 