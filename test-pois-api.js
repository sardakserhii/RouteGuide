// Test POIs API endpoint
const testPoiApi = async () => {
    const url = "https://routeguide.vercel.app/api/pois";

    const body = {
        bbox: [50.0, 51.0, 6.0, 7.5], // Example bbox: Luxembourg region
        categories: ["attraction", "museum", "castle"],
        limit: 10,
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log(`Received ${data.pois?.length || 0} POIs`);
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
};

testPoiApi();
