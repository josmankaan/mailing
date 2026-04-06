const axios = require('axios');

class PlacesService {
  constructor() {
    // Test with new hardcoded API key
    this.apiKey = 'AIzaSyAkMxMY-T3CZX1e4lrKdr1QE2IVT87tNL4';
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  async searchPlaces(sector, city) {
    try {
      console.log('=== API DEBUG ===');
      console.log('API Key exists:', !!this.apiKey);
      console.log('API Key length:', this.apiKey ? this.apiKey.length : 0);
      console.log('API Key starts with:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'null');
      console.log('==================');
      
      const query = `${sector} in ${city}`;
      const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params: {
          query: query,
          key: this.apiKey,
          fields: 'name,formatted_address,website,formatted_phone_number,rating,place_id'
        }
      });

      if (response.data.status === 'OK') {
        return {
          success: true,
          places: response.data.results.map(place => ({
            name: place.name,
            address: place.formatted_address,
            website: place.website || null,
            phone: place.formatted_phone_number || null,
            rating: place.rating || null,
            placeId: place.place_id
          }))
        };
      } else if (response.data.status === 'ZERO_RESULTS') {
        return {
          success: true,
          places: [],
          message: 'No results found'
        };
      } else {
        // Log Google API response details before throwing error
        console.log('=== GOOGLE API RESPONSE ===');
        console.log('Status:', response.data.status);
        console.log('Full Response:', JSON.stringify(response.data, null, 2));
        console.log('============================');
        
        throw new Error(`Google Places API error: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Places API error:', error.message);
      
      // Google API detailed error logging
      if (error.response && error.response.data) {
        console.log('=== GOOGLE API ERROR DETAILS ===');
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
        console.log('==================================');
      }
      
      return {
        success: false,
        error: error.message,
        places: []
      };
    }
  }
}

module.exports = new PlacesService();
