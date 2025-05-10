// Function to generate realistic mock data when no API key is available
function generateMockPlaces(city, activity, limit = 10) {
  console.log(`Generating mock data for ${activity} in ${city}`);
  
  // Map activity types to more specific business types for realistic names
  const getBusinessTypes = (activity) => {
    const activityLower = typeof activity === 'string' ? activity.toLowerCase() : 'meetup';
    if (activityLower.includes('coffee')) {
      return ['Coffee Shop', 'Café', 'Bakery & Coffee', 'Espresso Bar'];
    } else if (activityLower.includes('lunch') || activityLower.includes('dinner')) {
      return ['Restaurant', 'Bistro', 'Grill', 'Eatery', 'Kitchen'];
    } else if (activityLower.includes('sports') || activityLower.includes('fitness')) {
      return ['Fitness Center', 'Sports Club', 'Athletic Center', 'Gym'];
    } else if (activityLower.includes('study')) {
      return ['Library', 'Book Café', 'Study Lounge', 'Co-working Space'];
    } else if (activityLower.includes('drinks') || activityLower.includes('bar')) {
      return ['Pub', 'Craft Beer Bar', 'Wine Bar', 'Cocktail Lounge'];
    } else {
      return ['Meeting Space', 'Lounge', 'Social Club', 'Community Center'];
    }
  };
  
  // Get real neighborhoods for different cities
  const getNeighborhoods = (city) => {
    const cityLower = typeof city === 'string' ? city.toLowerCase() : 'downtown';
    if (cityLower.includes('toronto')) {
      return ['Yorkville', 'Liberty Village', 'The Distillery District', 'Kensington Market', 'Queen West'];
    } else if (cityLower.includes('vancouver')) {
      return ['Gastown', 'Yaletown', 'Kitsilano', 'West End', 'Mount Pleasant'];
    } else if (cityLower.includes('montreal')) {
      return ['Le Plateau', 'Mile End', 'Old Montreal', 'Little Italy', 'Griffintown'];
    } else if (cityLower.includes('new york')) {
      return ['SoHo', 'West Village', 'Chelsea', 'Williamsburg', 'Upper East Side'];
    } else if (cityLower.includes('london')) {
      return ['Shoreditch', 'Covent Garden', 'Camden', 'Notting Hill', 'Soho'];
    } else if (cityLower.includes('brampton')) {
      return ['Downtown', 'Mount Pleasant', 'Heart Lake', 'Bramalea', 'Springdale'];
    } else {
      return ['Downtown', 'Midtown', 'Westside', 'Eastside', 'Uptown'];
    }
  };
  
  const businessTypes = getBusinessTypes(activity);
  const neighborhoods = getNeighborhoods(city);
  
  // Generate more realistic place names
  const generatePlaceName = (index) => {
    const businessType = businessTypes[index % businessTypes.length];
    const prefix = ['The', '', 'Urban', 'City', 'Local', 'Central', 'Royal', 'Premium'];
    const atmosphere = ['Cozy', 'Modern', 'Trendy', 'Classic', 'Elegant', 'Rustic'];
    const colors = ['Blue', 'Green', 'Golden', 'Silver', 'Red', 'Black'];
    const nature = ['Oak', 'Pine', 'Maple', 'River', 'Mountain', 'Garden'];
    
    // Different name patterns for variety
    switch (index % 5) {
      case 0:
        return `${prefix[index % prefix.length]} ${colors[index % colors.length]} ${businessType}`;
      case 1:
        return `${neighborhoods[index % neighborhoods.length]} ${businessType}`;
      case 2:
        return `${atmosphere[index % atmosphere.length]} ${businessType}`;
      case 3:
        return `${nature[index % nature.length]} & ${businessType}`;
      case 4:
        return `${city} ${businessType}`;
      default:
        return `${activity} ${businessType}`;
    }
  };
  
  // Create more realistic reviews
  const createReviews = (businessType, neighborhood) => {
    const reviewStarters = [
      `Great place for ${activity}. `,
      `One of the best spots in ${neighborhood}. `,
      `A hidden gem in ${city}. `,
      `Perfect location for ${activity}. `,
      `Excellent ${businessType.toLowerCase()} in ${city}. `
    ];
    
    const reviewMiddle = [
      `The staff was incredibly friendly and helpful. `,
      `The atmosphere is perfect for what we needed. `,
      `Clean, well-maintained, and very comfortable. `,
      `They have everything you need for a great experience. `,
      `Great value for the quality you get. `
    ];
    
    const reviewEndings = [
      `Would definitely recommend to anyone looking for a good ${activity} spot.`,
      `Will be coming back soon!`,
      `Five stars for sure.`,
      `A must-visit when you're in ${neighborhood}.`,
      `Exactly what I was looking for in ${city}.`
    ];
    
    return [
      { 
        author_name: `Local Guide`,
        text: reviewStarters[Math.floor(Math.random() * reviewStarters.length)] + 
              reviewMiddle[Math.floor(Math.random() * reviewMiddle.length)] + 
              reviewEndings[Math.floor(Math.random() * reviewEndings.length)],
        rating: (4 + Math.random()).toFixed(1)
      },
      {
        author_name: `${city} Resident`,
        text: reviewStarters[Math.floor(Math.random() * reviewStarters.length)] + 
              reviewMiddle[Math.floor(Math.random() * reviewMiddle.length)] + 
              reviewEndings[Math.floor(Math.random() * reviewEndings.length)],
        rating: (4 + Math.random()).toFixed(1)
      }
    ];
  };
  
  // Generate limit number of places (or default to 10)
  const places = Array(Math.min(limit, 10)).fill().map((_, index) => {
    const businessType = businessTypes[index % businessTypes.length];
    const neighborhood = neighborhoods[index % neighborhoods.length];
    const name = generatePlaceName(index);
    
    // Generate a more realistic address
    const streetNumbers = [123, 456, 789, 234, 567];
    const streetNames = ['Main St', 'Park Ave', 'Broadway', 'King St', 'Queen St', 'College St', 'University Ave'];
    const address = `${streetNumbers[index % streetNumbers.length]} ${streetNames[index % streetNames.length]}, ${neighborhood}, ${city}`;
    
    // Create rating with realistic distribution
    const baseRating = 3.7 + (Math.random() * 1.2);
    const rating = parseFloat(baseRating.toFixed(1));
    
    // Create realistic number of reviews
    const user_ratings_total = Math.floor(50 + Math.random() * 450);
    
    // Create a real Google Maps URL for this specific place
    const mapSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + neighborhood + ' ' + city)}`;
    
    // Create a place_id-like identifier
    const place_id = `mock_${Math.random().toString(36).substring(2, 15)}`;
    
    // Add popular business hours
    const populationHours = {
      weekday_text: [
        "Monday: 7:00 AM – 10:00 PM",
        "Tuesday: 7:00 AM – 10:00 PM",
        "Wednesday: 7:00 AM – 10:00 PM",
        "Thursday: 7:00 AM – 10:00 PM",
        "Friday: 7:00 AM – 11:00 PM",
        "Saturday: 8:00 AM – 11:00 PM",
        "Sunday: 8:00 AM – 9:00 PM"
      ]
    };
    
    return {
      name,
      formatted_address: address,
      vicinity: address,
      rating,
      user_ratings_total,
      price_level: Math.floor(1 + Math.random() * 3),
      url: mapSearchUrl,
      reviews: createReviews(businessType, neighborhood),
      opening_hours: populationHours,
      photos: [{
        photo_reference: "mock_photo_reference",
        width: 1600,
        height: 1200
      }],
      geometry: {
        location: {
          lat: 43.6 + (Math.random() * 0.2),
          lng: -79.3 + (Math.random() * 0.2)
        }
      },
      place_id
    };
  });
  
  return places;
}

module.exports = { generateMockPlaces }; 