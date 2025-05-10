const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes event data from various TMU sources
 * @returns {Promise<Array>} - Array of event objects
 */
async function scrapeTMUEvents() {
  try {
    console.log('Starting TMU event scraping...');
    let events = [];
    
    // Try multiple TMU event sources
    const sources = [
      {
        name: 'TMU Today Events', 
        url: 'https://www.torontomu.ca/current-students/events/',
        scraper: scrapeTMUTodayEvents
      },
      {
        name: 'TMU Calendar',
        url: 'https://calendar.torontomu.ca',
        scraper: scrapeTMUCalendar
      },
      {
        name: 'TMU Student Life',
        url: 'https://www.torontomu.ca/student-life-and-learning/events/',
        scraper: scrapeTMUStudentLife
      },
      {
        name: 'ConnectRU Events',
        url: 'https://connectru.ryerson.ca/events',
        scraper: scrapeConnectRUEvents
      }
    ];
    
    for (const source of sources) {
      try {
        console.log(`Trying to scrape events from ${source.name}...`);
        const sourceEvents = await source.scraper();
        
        if (sourceEvents && sourceEvents.length > 0) {
          console.log(`Found ${sourceEvents.length} events from ${source.name}`);
          events = [...events, ...sourceEvents];
        }
      } catch (sourceError) {
        console.error(`Error scraping ${source.name}:`, sourceError.message);
      }
    }
    
    // If we didn't find any events from any source, generate mock events
    if (events.length === 0) {
      console.log('No events found from any source. Generating mock TMU events...');
      const mockEvents = generateMockTMUEvents();
      events = [...events, ...mockEvents];
    }
    
    // Sort all events by date
    events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    console.log(`Successfully prepared ${events.length} TMU events`);
    return events;
  } catch (error) {
    console.error('Error in TMU event preparation:', error);
    // Return mock events as a last resort
    return generateMockTMUEvents();
  }
}

/**
 * Scrape events from TMU Today website
 * @returns {Promise<Array>} - Array of event objects
 */
async function scrapeTMUTodayEvents() {
  try {
    const events = [];
    
    // Make request with proper headers and timeout
    const response = await axios.get('https://www.torontomu.ca/current-students/events/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Find event cards or listings
    $('.event-item, .event-card, .event-listing, article.event').each((index, element) => {
      try {
        // Extract event information with fallbacks for different structures
        const title = $(element).find('h2, h3, .event-title, .title').first().text().trim();
        
        let dateText = $(element).find('.date, .event-date, [class*="date"]').first().text().trim();
        if (!dateText) {
          // Look for date patterns in text
          const allText = $(element).text();
          const dateMatch = allText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(,? \d{4})?/i);
          if (dateMatch) {
            dateText = dateMatch[0];
          }
        }
        
        let timeText = $(element).find('.time, .event-time, [class*="time"]').first().text().trim();
        if (!timeText) {
          // Look for time patterns in text
          const allText = $(element).text();
          const timeMatch = allText.match(/\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)?\s*(-|to|–)\s*\d{1,2}:\d{2}\s*(am|pm|AM|PM)?/);
          if (timeMatch) {
            timeText = timeMatch[0];
          }
        }
        
        const locationText = $(element).find('.location, .event-location, .venue, [class*="location"], [class*="venue"]')
          .first().text().trim();
        
        const organizerText = $(element).find('.organizer, .host, [class*="organizer"], [class*="host"]')
          .first().text().trim();
        
        const description = $(element).find('.description, .event-description, p, [class*="description"]')
          .first().text().trim();
        
        // Get event URL
        let eventUrl = $(element).find('a').attr('href');
        if (eventUrl && !eventUrl.startsWith('http')) {
          eventUrl = eventUrl.startsWith('/') 
            ? `https://www.torontomu.ca${eventUrl}` 
            : `https://www.torontomu.ca/${eventUrl}`;
        }
        
        // Get image URL
        let imageUrl = $(element).find('img').attr('src');
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('/') 
            ? `https://www.torontomu.ca${imageUrl}` 
            : `https://www.torontomu.ca/${imageUrl}`;
        }
        
        // Parse date and time
        const eventDateTime = parseDateTime(dateText, timeText);
        
        if (title && eventDateTime.startDate) {
          events.push({
            title,
            startDate: eventDateTime.startDate,
            endDate: eventDateTime.endDate,
            location: locationText,
            organizer: organizerText || 'Toronto Metropolitan University',
            description: description || `TMU Event: ${title}`,
            imageUrl,
            eventUrl,
            source: 'TMU Today'
          });
        }
      } catch (eventError) {
        console.error('Error parsing an event item:', eventError);
      }
    });
    
    return events;
  } catch (error) {
    console.error('Error scraping TMU Today Events:', error.message);
    return [];
  }
}

/**
 * Scrape events from TMU Calendar website
 * @returns {Promise<Array>} - Array of event objects
 */
async function scrapeTMUCalendar() {
  try {
    const events = [];
    
    // Get current month and year for the URL
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() is 0-indexed
    
    // Make request with proper headers and timeout
    const response = await axios.get(`https://calendar.torontomu.ca/${year}/${month}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for calendar events
    $('.event, .calendar-event, .event-item, [data-event-id], .vevent').each((index, element) => {
      try {
        const title = $(element).find('.summary, .title, h3, h4').first().text().trim();
        const dateText = $(element).find('.dtstart, .date, [class*="date"]').first().text().trim();
        const timeText = $(element).find('.time, [class*="time"]').first().text().trim();
        const locationText = $(element).find('.location, .place, [class*="location"]').first().text().trim();
        const description = $(element).find('.description, .desc, [class*="description"]').first().text().trim();
        
        // Get event URL
        let eventUrl = $(element).find('a').attr('href');
        if (eventUrl && !eventUrl.startsWith('http')) {
          eventUrl = eventUrl.startsWith('/') 
            ? `https://calendar.torontomu.ca${eventUrl}` 
            : `https://calendar.torontomu.ca/${eventUrl}`;
        }
        
        // Parse date and time
        const eventDateTime = parseDateTime(dateText, timeText);
        
        if (title && eventDateTime.startDate) {
          events.push({
            title,
            startDate: eventDateTime.startDate,
            endDate: eventDateTime.endDate,
            location: locationText,
            organizer: 'Toronto Metropolitan University',
            description: description || `TMU Event: ${title}`,
            imageUrl: null,
            eventUrl,
            source: 'TMU Calendar'
          });
        }
      } catch (eventError) {
        console.error('Error parsing a calendar event:', eventError);
      }
    });
    
    return events;
  } catch (error) {
    console.error('Error scraping TMU Calendar:', error.message);
    return [];
  }
}

/**
 * Scrape events from TMU Student Life website
 * @returns {Promise<Array>} - Array of event objects
 */
async function scrapeTMUStudentLife() {
  try {
    const events = [];
    
    // Make request with proper headers and timeout
    const response = await axios.get('https://www.torontomu.ca/student-life-and-learning/events/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Find event cards or listings
    $('.event, .event-card, article, .event-item, .content-block').each((index, element) => {
      try {
        const title = $(element).find('h2, h3, .title, [class*="title"]').first().text().trim();
        
        // Look for date and time information
        let dateText = '';
        let timeText = '';
        
        // Try to find date and time with different selectors
        const dateTimeText = $(element).find('[class*="date"], [class*="time"], .info, .details').text();
        
        // Extract date
        const dateMatch = dateTimeText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(,? \d{4})?/i);
        if (dateMatch) {
          dateText = dateMatch[0];
        }
        
        // Extract time
        const timeMatch = dateTimeText.match(/\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)?\s*(-|to|–)\s*\d{1,2}:\d{2}\s*(am|pm|AM|PM)?/);
        if (timeMatch) {
          timeText = timeMatch[0];
        }
        
        const locationText = $(element).find('[class*="location"], [class*="venue"], .location').first().text().trim();
        const description = $(element).find('[class*="description"], p, .text').first().text().trim();
        
        // Get event URL
        let eventUrl = $(element).find('a').attr('href');
        if (eventUrl && !eventUrl.startsWith('http')) {
          eventUrl = eventUrl.startsWith('/') 
            ? `https://www.torontomu.ca${eventUrl}` 
            : `https://www.torontomu.ca/${eventUrl}`;
        }
        
        // Get image URL
        let imageUrl = $(element).find('img').attr('src');
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('/') 
            ? `https://www.torontomu.ca${imageUrl}` 
            : `https://www.torontomu.ca/${imageUrl}`;
        }
        
        // Parse date and time
        const eventDateTime = parseDateTime(dateText, timeText);
        
        if (title && eventDateTime.startDate) {
          events.push({
            title,
            startDate: eventDateTime.startDate,
            endDate: eventDateTime.endDate,
            location: locationText,
            organizer: 'TMU Student Life',
            description: description || `TMU Event: ${title}`,
            imageUrl,
            eventUrl,
            source: 'TMU Student Life'
          });
        }
      } catch (eventError) {
        console.error('Error parsing a student life event:', eventError);
      }
    });
    
    return events;
  } catch (error) {
    console.error('Error scraping TMU Student Life:', error.message);
    return [];
  }
}

/**
 * Parse date and time text into JavaScript Date objects
 * @param {string} dateText - Date text from the website
 * @param {string} timeText - Time text from the website
 * @returns {Object} - Object with startDate and endDate properties
 */
function parseDateTime(dateText, timeText) {
  try {
    const result = {
      startDate: null,
      endDate: null
    };
    
    if (!dateText) return result;
    
    // Try to extract date from combined string if needed
    let extractedDate = dateText;
    let extractedTime = timeText;
    
    // If timeText is empty but dateText contains time information
    if (!timeText && dateText.includes(':')) {
      // Try to split it
      const match = dateText.match(/([A-Za-z]+,?\s+[A-Za-z]+\s+\d+,?\s+\d{4})(.+)/);
      if (match) {
        extractedDate = match[1];
        extractedTime = match[2];
      }
    }
    
    // Comprehensive date parsing
    let year, month, day;
    
    // Handle various date formats
    
    // Format: "Monday, March 18, 2024" or "March 18, 2024"
    const longDateRegex = /(?:([A-Za-z]+),\s*)?([A-Za-z]+)\s+(\d{1,2})(?:,?\s*(\d{4}))?/i;
    const longDateMatch = extractedDate.match(longDateRegex);
    
    if (longDateMatch) {
      // Group 1: Day of week (optional)
      // Group 2: Month name
      // Group 3: Day
      // Group 4: Year (optional)
      
      month = getMonthNumber(longDateMatch[2]);
      day = parseInt(longDateMatch[3]);
      year = longDateMatch[4] ? parseInt(longDateMatch[4]) : new Date().getFullYear();
    } else {
      // Try other formats
      // Format: "MM/DD/YYYY" or "DD/MM/YYYY"
      const slashDateRegex = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/;
      const slashDateMatch = extractedDate.match(slashDateRegex);
      
      if (slashDateMatch) {
        // Determine if format is MM/DD or DD/MM
        // For simplicity, assume MM/DD for North American sites
        month = parseInt(slashDateMatch[1]) - 1; // 0-indexed
        day = parseInt(slashDateMatch[2]);
        
        // Handle year
        if (slashDateMatch[3]) {
          year = parseInt(slashDateMatch[3]);
          // Handle 2-digit years
          if (year < 100) {
            year += year < 50 ? 2000 : 1900;
          }
        } else {
          year = new Date().getFullYear();
        }
      } else {
        // Default to today if we can't parse the date
        const today = new Date();
        year = today.getFullYear();
        month = today.getMonth();
        day = today.getDate();
        
        console.warn(`Couldn't parse date: "${extractedDate}", defaulting to today`);
      }
    }
    
    // Validate date components
    if (isNaN(year) || isNaN(month) || isNaN(day) || 
        year < 2000 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
      console.warn(`Invalid date components: year=${year}, month=${month}, day=${day}`);
      return result;
    }
    
    // Parse time
    let startHour = 9, startMinute = 0;  // Default to 9:00 AM
    let endHour = 17, endMinute = 0;     // Default to 5:00 PM
    
    if (extractedTime) {
      // Complex regex to handle various time formats
      const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.)?(?:\s*(?:-|to|–)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|AM|PM|A\.M\.|P\.M\.)?)?/i;
      const timeMatch = extractedTime.match(timeRegex);
      
      if (timeMatch) {
        // Start time
        startHour = parseInt(timeMatch[1]);
        startMinute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const startPeriod = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
        
        // Handle AM/PM
        if (startPeriod && (startPeriod.startsWith('p') || startPeriod.startsWith('P'))) {
          if (startHour < 12) startHour += 12;
        } else if (startPeriod && (startPeriod.startsWith('a') || startPeriod.startsWith('A'))) {
          if (startHour === 12) startHour = 0;
        }
        
        // End time if specified
        if (timeMatch[4]) {
          endHour = parseInt(timeMatch[4]);
          endMinute = timeMatch[5] ? parseInt(timeMatch[5]) : 0;
          const endPeriod = timeMatch[6] ? timeMatch[6].toLowerCase() : null;
          
          // Handle AM/PM for end time
          if (endPeriod && (endPeriod.startsWith('p') || endPeriod.startsWith('P'))) {
            if (endHour < 12) endHour += 12;
          } else if (endPeriod && (endPeriod.startsWith('a') || endPeriod.startsWith('A'))) {
            if (endHour === 12) endHour = 0;
          } else if (!endPeriod && startPeriod) {
            // If end period isn't specified but start period is, assume same period
            // unless the end time is less than start time
            const isStartPM = startPeriod.startsWith('p') || startPeriod.startsWith('P');
            if (isStartPM && endHour < startHour) {
              if (endHour < 12) endHour += 12;
            }
          }
        } else {
          // Default end time 2 hours after start if not specified
          endHour = startHour + 2;
          endMinute = startMinute;
          
          // Adjust if overflow
          if (endHour >= 24) {
            endHour -= 24;
          }
        }
      }
    }
    
    // Create dates
    try {
      result.startDate = new Date(year, month, day, startHour, startMinute);
      result.endDate = new Date(year, month, day, endHour, endMinute);
      
      // Sanity check - ensure end date is after start date
      if (result.endDate < result.startDate) {
        // If end time is earlier, assume it's the next day
        result.endDate.setDate(result.endDate.getDate() + 1);
      }
      
      return result;
    } catch (e) {
      console.error('Error creating date objects:', e);
      return result;
    }
  } catch (error) {
    console.error('Error parsing date and time:', error);
    return { startDate: null, endDate: null };
  }
}

/**
 * Convert month name to month number (0-based)
 * @param {string} monthName - Name of the month
 * @returns {number} - Month number (0-11)
 */
function getMonthNumber(monthName) {
  if (!monthName) return NaN;
  
  const months = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1,
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11
  };
  
  return months[monthName.toLowerCase()];
}

/**
 * Generate mock TMU events for testing when real data cannot be scraped
 * @returns {Array} - Array of mock event objects
 */
function generateMockTMUEvents() {
  console.log('Generating mock TMU events for calendar...');
  const events = [];
  
  // Get current date for reference
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // TMU buildings and locations
  const tmuLocations = [
    'Student Learning Centre (SLC)', 'Rogers Communications Centre (RCC)',
    'Kerr Hall East (KHE)', 'Kerr Hall West (KHW)', 'Kerr Hall North (KHN)', 
    'Kerr Hall South (KHS)', 'Engineering Building (ENG)', 'Jorgenson Hall (JOR)',
    'Victoria Building (VIC)', 'Heidelberg Centre (HEI)', 'Daphne Cockwell Health Sciences Complex (DCC)',
    'Ted Rogers School of Management (TRSM)', 'The Mattamy Athletic Centre (MAC)',
    'Pitman Hall (PIT)', 'International Living & Learning Centre (ILC)',
    'The Catalyst at FCAD', 'The Creative School', 'Image Arts Building (IMA)'
  ];
  
  // Event organizers
  const organizers = [
    'TMU Student Union', 'TMU Athletics', 'TMU Engineering Society',
    'TMU Business Students Association', 'Ted Rogers Students Society',
    'TMU Computer Science Course Union', 'TMU Residence Council',
    'TMU International Student Support', 'Faculty of Arts', 'Faculty of Communication & Design',
    'Faculty of Engineering and Architectural Science', 'Faculty of Science',
    'Ted Rogers School of Management', 'The Creative School', 'TMU Career Centre',
    'TMU Student Affairs'
  ];
  
  // Event types and titles
  const eventTypes = [
    {
      type: 'Workshop',
      titles: [
        'Resume Building Workshop', 'LinkedIn Profile Optimization',
        'Academic Writing Fundamentals', 'Research Methods Workshop',
        'Public Speaking Workshop', 'Design Thinking Workshop',
        'Programming Skills Workshop', 'Data Analytics Bootcamp',
        'Financial Literacy Workshop', 'Interview Preparation'
      ]
    },
    {
      type: 'Networking',
      titles: [
        'Industry Networking Night', 'Alumni Mixer', 'Career Connections',
        'Professional Development Networking', 'Meet the Professionals',
        'First-Year Student Mixer', 'Graduate Student Networking',
        'International Students Welcome Event', 'Diversity in Tech Networking'
      ]
    },
    {
      type: 'Seminar',
      titles: [
        'Guest Speaker Series', 'Research Seminar', 'Innovation in Business',
        'Emerging Technologies', 'Sustainability Practices', 'Mental Health Awareness',
        'Leadership Development', 'Ethics in Computing', 'Global Business Perspectives',
        'Entrepreneurship Fundamentals'
      ]
    },
    {
      type: 'Social',
      titles: [
        'Welcome Week Party', 'International Food Festival', 'Cultural Showcase',
        'Movie Night', 'Game Night', 'End of Semester Celebration',
        'Trivia Night', 'Open Mic Night', 'Dance Showcase', 'Art Exhibition'
      ]
    },
    {
      type: 'Sports',
      titles: [
        'Basketball Tournament', 'Soccer Match: TMU vs UofT', 'Volleyball Intramurals',
        'Hockey Game: TMU Rams', 'Fitness Challenge', 'Yoga in the Quad',
        'Esports Tournament', 'Table Tennis Competition', 'Swimming Meet',
        'TMU Rams Fan Night'
      ]
    },
    {
      type: 'Academic',
      titles: [
        'Thesis Defense Presentation', 'Research Symposium', 'Faculty Lecture Series',
        'Academic Conference', 'Interdisciplinary Panel Discussion',
        'Book Launch', 'Student Research Showcase', 'Department Orientation',
        'Graduate Studies Information Session', 'Academic Success Strategies'
      ]
    }
  ];
  
  // Generate events for the next 3 months
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const targetMonth = (currentMonth + monthOffset) % 12;
    const targetYear = currentMonth + monthOffset >= 12 ? currentYear + 1 : currentYear;
    
    // Get the number of days in the target month
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    // Generate 15-25 events per month
    const numEventsThisMonth = Math.floor(Math.random() * 11) + 15;
    
    for (let i = 0; i < numEventsThisMonth; i++) {
      // Random day of the month (excluding past days for current month)
      let day;
      if (targetMonth === currentMonth && targetYear === currentYear) {
        day = Math.floor(Math.random() * (daysInMonth - now.getDate() + 1)) + now.getDate();
      } else {
        day = Math.floor(Math.random() * daysInMonth) + 1;
      }
      
      // Random event type and title
      const eventTypeIndex = Math.floor(Math.random() * eventTypes.length);
      const eventType = eventTypes[eventTypeIndex];
      const titleIndex = Math.floor(Math.random() * eventType.titles.length);
      
      // Generate start and end times
      const startHour = Math.floor(Math.random() * 12) + 8; // Between 8 AM and 8 PM
      const endHour = Math.min(startHour + Math.floor(Math.random() * 4) + 1, 22); // 1-4 hours after start, max 10 PM
      
      const startDate = new Date(targetYear, targetMonth, day, startHour, 0);
      const endDate = new Date(targetYear, targetMonth, day, endHour, 0);
      
      // Generate a unique ID for the mock event
      const mockId = `mock_tmu_event_${targetYear}${targetMonth}${day}_${i}`;
      
      // Create the event
      events.push({
        title: `${eventType.titles[titleIndex]} (${eventType.type})`,
        startDate: startDate,
        endDate: endDate,
        location: tmuLocations[Math.floor(Math.random() * tmuLocations.length)],
        organizer: organizers[Math.floor(Math.random() * organizers.length)],
        description: generateEventDescription(eventType.type, eventType.titles[titleIndex]),
        imageUrl: null, // No mock images
        eventUrl: null, // No mock URLs
        source: 'TMU Events (Generated)',
        _id: mockId
      });
    }
  }
  
  // Sort events by start date
  events.sort((a, b) => a.startDate - b.startDate);
  
  return events;
}

/**
 * Generate a realistic description for a mock event
 * @param {string} eventType - The type of event
 * @param {string} eventTitle - The title of the event
 * @returns {string} - Generated description
 */
function generateEventDescription(eventType, eventTitle) {
  const descriptions = {
    'Workshop': [
      `Join us for this hands-on ${eventTitle.toLowerCase()} where you'll gain practical skills and knowledge. Open to all TMU students, this workshop provides valuable experience for your academic and professional development.`,
      `This interactive workshop will focus on essential skills related to ${eventTitle.toLowerCase()}. Participants will engage in exercises and receive feedback from experienced facilitators.`,
      `Enhance your capabilities through our comprehensive ${eventTitle.toLowerCase()}. This session includes both theoretical concepts and practical applications relevant to your program and future career.`
    ],
    'Networking': [
      `Connect with industry professionals, alumni, and fellow students at this ${eventTitle.toLowerCase()}. Bring your business cards and enthusiasm for making valuable connections.`,
      `Expand your professional network at our ${eventTitle.toLowerCase()}. Light refreshments will be served as you meet potential mentors, employers, and colleagues.`,
      `This ${eventTitle.toLowerCase()} offers a unique opportunity to engage with leaders in your field of interest. Dress professionally and come prepared with questions.`
    ],
    'Seminar': [
      `Attend this informative seminar on ${eventTitle.toLowerCase()} featuring expert speakers from the field. The presentation will be followed by a Q&A session.`,
      `Gain insights into ${eventTitle.toLowerCase()} through this comprehensive seminar. Topics will cover current trends, challenges, and opportunities in the industry.`,
      `This seminar presents the latest developments in ${eventTitle.toLowerCase()}. Speakers will share research findings, case studies, and professional experiences.`
    ],
    'Social': [
      `Take a break and enjoy this ${eventTitle.toLowerCase()} with your fellow TMU students. This is a great opportunity to relax, have fun, and build community.`,
      `Join us for a fun-filled ${eventTitle.toLowerCase()} event! Meet new friends, enjoy activities, and create memorable experiences on campus.`,
      `This ${eventTitle.toLowerCase()} celebrates our diverse TMU community. Participate in activities, enjoy entertainment, and connect with others in a relaxed setting.`
    ],
    'Sports': [
      `Cheer on your TMU Rams at this exciting ${eventTitle.toLowerCase()}! Show your school spirit and support our athletes as they compete.`,
      `Whether you're a participant or spectator, this ${eventTitle.toLowerCase()} promises to be an energetic event. All skill levels welcome.`,
      `Stay active and engaged with this ${eventTitle.toLowerCase()}. The event promotes physical wellbeing, teamwork, and friendly competition.`
    ],
    'Academic': [
      `Expand your academic horizons at this ${eventTitle.toLowerCase()}. The event features scholarly presentations, intellectual discussions, and academic resources.`,
      `This ${eventTitle.toLowerCase()} showcases academic excellence and intellectual inquiry. Faculty and students will present research and engage in meaningful dialogue.`,
      `Attend this ${eventTitle.toLowerCase()} to deepen your understanding of the subject matter. The event includes presentations, panel discussions, and networking opportunities.`
    ]
  };
  
  // Select a random description template for the event type
  const templates = descriptions[eventType] || descriptions['Workshop'];
  return templates[Math.floor(Math.random() * templates.length)];
}

async function scrapeConnectRUEvents() {
  try {
    const events = [];
    const response = await axios.get('https://connectru.ryerson.ca/events', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    // Example selectors, need to be adjusted based on actual HTML structure
    $('.event-card').each((index, element) => {
      const title = $(element).find('.event-title').text().trim();
      const dateText = $(element).find('.event-date').text().trim();
      const timeText = $(element).find('.event-time').text().trim();
      const locationText = $(element).find('.event-location').text().trim();
      const description = $(element).find('.event-description').text().trim();

      const eventDateTime = parseDateTime(dateText, timeText);

      if (title && eventDateTime.startDate) {
        events.push({
          title,
          startDate: eventDateTime.startDate,
          endDate: eventDateTime.endDate,
          location: locationText,
          organizer: 'ConnectRU',
          description: description || `Event: ${title}`,
          imageUrl: null,
          eventUrl: null,
          source: 'ConnectRU'
        });
      }
    });

    return events;
  } catch (error) {
    console.error('Error scraping ConnectRU Events:', error.message);
    return [];
  }
}

module.exports = { scrapeTMUEvents }; 