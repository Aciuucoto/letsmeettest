const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');
const { generateMockPlaces } = require('../utils/mockPlacesData');

dotenv.config();

// Google Places API base URL
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY';

// Helper function to map activity types to Google Places types
const getGooglePlaceType = (activityType) => {
  const typeMap = {
    'coffee': 'cafe',
    'lunch': 'restaurant',
    'dinner': 'restaurant',
    'drinks': 'bar',
    'sports': 'gym',
    'meetup': 'point_of_interest'
  };
  
  return typeMap[activityType.toLowerCase()] || 'restaurant';
};

// Helper function to fetch place details including reviews
const fetchPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get(`${GOOGLE_PLACES_API_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'reviews',
        key: GOOGLE_MAPS_API_KEY
      }
    });
    
    return response.data.result;
  } catch (err) {
    console.error('Error fetching place details:', err.message);
    return null;
  }
};

// @route   POST api/places/recommendations
// @desc    Get place recommendations based on location and activity
// @access  Public
router.post('/recommendations', async (req, res) => {
  try {
    const { location, activityType, limit = 10 } = req.body;

    if (!location) {
      return res.status(400).json({ msg: 'Location is required', places: [] });
    }

    // Check if we have a valid API key
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY') {
      console.error('Missing Google Maps API key');
      // Generate realistic mock data instead of returning empty array
      const mockPlaces = generateMockPlaces(location, activityType, limit);
      return res.json({ 
        msg: 'Using realistic demo data (API key not configured)',
        places: mockPlaces 
      });
    }

    // Convert activity type to Google Places type
    const googlePlaceType = getGooglePlaceType(activityType);
    
    // Construct the search query
    const searchQuery = `${activityType} in ${location}`;
    
    // Make request to Google Places Text Search API
    const response = await axios.get(`${GOOGLE_PLACES_API_URL}/textsearch/json`, {
      params: {
        query: searchQuery,
        type: googlePlaceType,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    // Check if we got a valid response
    if (!response.data || !response.data.results) {
      console.error('Invalid response from Google Places API:', response.data);
      return res.json({ 
        msg: 'Invalid response from places API', 
        places: [] 
      });
    }

    // Extract relevant place data and limit results
    const places = response.data.results.slice(0, limit);
    
    if (places.length === 0) {
      return res.json({ 
        msg: 'No places found for this query', 
        places: [] 
      });
    }
    
    // Fetch reviews for top 5 places
    const placesWithDetails = await Promise.all(
      places.slice(0, 5).map(async (place) => {
        try {
          const details = await fetchPlaceDetails(place.place_id);
          
          return {
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            priceLevel: place.price_level,
            location: place.geometry.location,
            photo: place.photos && place.photos[0] ? 
              `${GOOGLE_PLACES_API_URL}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}` : 
              null,
            reviews: details && details.reviews ? details.reviews.slice(0, 2) : []
          };
        } catch (err) {
          console.error('Error fetching details for place:', place.place_id, err.message);
          // Return place without reviews if fetching details fails
          return {
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            priceLevel: place.price_level,
            location: place.geometry.location,
            photo: place.photos && place.photos[0] ? 
              `${GOOGLE_PLACES_API_URL}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}` : 
              null,
            reviews: []
          };
        }
      })
    );
    
    // Add remaining places without reviews
    const remainingPlaces = places.slice(5).map(place => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      location: place.geometry.location,
      photo: place.photos && place.photos[0] ? 
        `${GOOGLE_PLACES_API_URL}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}` : 
        null,
      reviews: []
    }));

    res.json({ 
      msg: 'Places found successfully', 
      places: [...placesWithDetails, ...remainingPlaces] 
    });
  } catch (err) {
    console.error('Error fetching place recommendations:', err.message);
    res.status(500).json({ 
      msg: 'Server error', 
      error: err.message,
      places: [] 
    });
  }
});

// @route   GET api/places/details/:placeId
// @desc    Get detailed information about a place
// @access  Public
router.get('/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({ msg: 'Place ID is required' });
    }

    // Make request to Google Places Details API
    const response = await axios.get(`${GOOGLE_PLACES_API_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,formatted_phone_number,website,rating,reviews,photos,price_level,opening_hours,geometry',
        key: GOOGLE_MAPS_API_KEY
      }
    });

    const place = response.data.result;
    
    // Format photos
    const photos = place.photos ? 
      place.photos.slice(0, 5).map(photo => 
        `${GOOGLE_PLACES_API_URL}/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
      ) : [];

    const placeDetails = {
      placeId,
      name: place.name,
      address: place.formatted_address,
      phoneNumber: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      reviews: place.reviews || [],
      photos,
      priceLevel: place.price_level,
      openingHours: place.opening_hours,
      location: place.geometry.location
    };

    res.json(placeDetails);
  } catch (err) {
    console.error('Error fetching place details:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/places/meeting-places
// @desc    Find places between two locations
// @access  Public
router.post('/meeting-places', async (req, res) => {
  try {
    const { location1, location2, activityType, limit = 5 } = req.body;

    if (!location1 || !location2) {
      return res.status(400).json({ 
        msg: 'Both locations are required',
        places: [] 
      });
    }

    // Check if we have a valid API key
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY') {
      console.error('Missing Google Maps API key');
      return res.json({ 
        msg: 'API key configuration issue', 
        places: [] 
      });
    }

    // Convert activity type to Google Places type
    const googlePlaceType = getGooglePlaceType(activityType);
    
    // First, geocode the locations to get coordinates
    try {
      const [loc1, loc2] = await Promise.all([
        axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
          params: {
            address: location1,
            key: GOOGLE_MAPS_API_KEY
          }
        }),
        axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
          params: {
            address: location2,
            key: GOOGLE_MAPS_API_KEY
          }
        })
      ]);
      
      if (!loc1.data.results.length || !loc2.data.results.length) {
        console.log('Geocoding failed for one or both locations', { 
          location1Results: loc1.data.results.length, 
          location2Results: loc2.data.results.length 
        });
        return res.json({ 
          msg: 'Could not geocode one or both locations',
          places: [] 
        });
      }
      
      const coords1 = loc1.data.results[0].geometry.location;
      const coords2 = loc2.data.results[0].geometry.location;
      
      // Calculate midpoint (simple average - not actual geographic midpoint)
      const midpoint = {
        lat: (coords1.lat + coords2.lat) / 2,
        lng: (coords1.lng + coords2.lng) / 2
      };
      
      // Make request to Google Places Nearby Search API using midpoint
      const response = await axios.get(`${GOOGLE_PLACES_API_URL}/nearbysearch/json`, {
        params: {
          location: `${midpoint.lat},${midpoint.lng}`,
          radius: 5000, // 5km radius
          type: googlePlaceType,
          key: GOOGLE_MAPS_API_KEY
        }
      });

      // Check if we got a valid response
      if (!response.data || !response.data.results) {
        console.error('Invalid response from Google Places API:', response.data);
        return res.json({ 
          msg: 'Invalid response from places API', 
          places: [] 
        });
      }

      // Extract results and limit
      const places = response.data.results.slice(0, limit);
      
      if (places.length === 0) {
        return res.json({ 
          msg: 'No places found between these locations', 
          places: [] 
        });
      }
      
      // Fetch reviews for top 3 places
      const placesWithDetails = await Promise.all(
        places.slice(0, 3).map(async (place) => {
          try {
            const details = await fetchPlaceDetails(place.place_id);
            
            return {
              placeId: place.place_id,
              name: place.name,
              address: place.vicinity,
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              priceLevel: place.price_level,
              location: place.geometry.location,
              photo: place.photos && place.photos[0] ? 
                `${GOOGLE_PLACES_API_URL}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}` : 
                null,
              reviews: details && details.reviews ? details.reviews.slice(0, 2) : []
            };
          } catch (err) {
            console.error('Error fetching details for place:', place.place_id, err.message);
            // Return place without reviews if fetching details fails
            return {
              placeId: place.place_id,
              name: place.name,
              address: place.vicinity,
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              priceLevel: place.price_level,
              location: place.geometry.location,
              photo: place.photos && place.photos[0] ? 
                `${GOOGLE_PLACES_API_URL}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}` : 
                null,
              reviews: []
            };
          }
        })
      );
      
      // Add remaining places without reviews
      const remainingPlaces = places.slice(3).map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        priceLevel: place.price_level,
        location: place.geometry.location,
        photo: place.photos && place.photos[0] ? 
          `${GOOGLE_PLACES_API_URL}/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}` : 
          null,
        reviews: []
      }));

      res.json({ 
        msg: 'Places found successfully', 
        places: [...placesWithDetails, ...remainingPlaces] 
      });
    } catch (geocodeErr) {
      console.error('Error during geocoding or nearby search:', geocodeErr.message);
      return res.json({ 
        msg: 'Error finding places between locations', 
        error: geocodeErr.message,
        places: [] 
      });
    }
  } catch (err) {
    console.error('Error in meeting-places API:', err.message);
    res.status(500).json({ 
      msg: 'Server error', 
      error: err.message,
      places: [] 
    });
  }
});

module.exports = router; 