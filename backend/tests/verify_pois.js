const axios = require('axios');

async function testPoiEndpoint() {
  try {
    const response = await axios.post('http://localhost:3000/api/pois', {
      bbox: [48.85, 48.86, 2.34, 2.35], // Paris center
      filters: {
        categories: ['attraction', 'museum'],
        limit: 10
      }
    });

    console.log('Status:', response.status);
    console.log('POIs found:', response.data.pois.length);
    console.log('First POI:', response.data.pois[0]);
    console.log('Metadata:', response.data.metadata);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPoiEndpoint();
