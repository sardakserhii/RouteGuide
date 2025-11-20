const axios = require('axios');

async function testPois() {
  try {
    const response = await axios.post('http://localhost:3000/api/pois', {
      bbox: [50.9, 51.1, 6.9, 7.1], // Cologne area
      route: [[50.9375, 6.9603], [50.9575, 6.9803]],
      filters: {
        categories: ['museum'],
        maxDistance: 50,
        limit: 5
      }
    });

    console.log('Status:', response.status);
    console.log('Metadata:', JSON.stringify(response.data.metadata, null, 2));
    console.log('POIs found:', response.data.pois.length);
    if (response.data.pois.length > 0) {
      console.log('First POI:', response.data.pois[0].name, response.data.pois[0].tourism);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPois();
