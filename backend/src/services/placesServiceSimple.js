const https = require('https');
const url = require('url');

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
      const requestUrl = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}&fields=name,formatted_address,website,formatted_phone_number,rating,place_id`;
      
      const response = await this.makeRequest(requestUrl);
      const data = JSON.parse(response);
      
      // Log raw Google API response
      console.log('=== GOOGLE API RAW RESPONSE ===');
      console.log('First place object:', data.results && data.results[0] ? JSON.stringify(data.results[0], null, 2) : 'No results');
      console.log('All available fields:', data.results && data.results[0] ? Object.keys(data.results[0]) : 'No results');
      console.log('================================');

      if (data.status === 'OK') {
        // Get detailed info for each place to ensure website is included
        const placesWithDetails = await Promise.all(
          data.results.map(async (place) => {
            const detailsUrl = `${this.baseUrl}/details/json?place_id=${place.place_id}&key=${this.apiKey}&fields=name,formatted_address,website,formatted_phone_number,rating`;
            
            try {
              const detailsResponse = await this.makeRequest(detailsUrl);
              const detailsData = JSON.parse(detailsResponse);
              
              if (detailsData.status === 'OK' && detailsData.result) {
                return {
                  name: detailsData.result.name || place.name,
                  address: detailsData.result.formatted_address || place.formatted_address,
                  website: detailsData.result.website || null,
                  phone: detailsData.result.formatted_phone_number || null,
                  rating: detailsData.result.rating || null,
                  placeId: place.place_id
                };
              }
            } catch (error) {
              console.warn(`Failed to get details for ${place.name}:`, error.message);
            }
            
            // Fallback to original data
            return {
              name: place.name,
              address: place.formatted_address,
              website: place.website || null,
              phone: place.formatted_phone_number || null,
              rating: place.rating || null,
              placeId: place.place_id
            };
          })
        );
        
        return {
          success: true,
          places: placesWithDetails
        };
      } else if (data.status === 'ZERO_RESULTS') {
        return {
          success: true,
          places: [],
          message: 'No results found'
        };
      } else {
        // Log Google API response details before throwing error
        console.log('=== GOOGLE API RESPONSE ===');
        console.log('Status:', data.status);
        console.log('Full Response:', JSON.stringify(data, null, 2));
        console.log('============================');
        
        throw new Error(`Google Places API error: ${data.status}`);
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

  makeRequest(requestUrl) {
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(requestUrl);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        method: 'GET',
        headers: {
          'User-Agent': 'B2B-Lead-Scraper/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }
}

module.exports = new PlacesService();
