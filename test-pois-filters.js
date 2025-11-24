// Test POIs API with filters format (as frontend sends)
const testPoiApi = async () => {
    const url = "https://routeguide.vercel.app/api/pois";

    const body = {
        bbox: [50.0, 51.0, 6.0, 7.5], // Luxembourg region
        filters: {
            categories: ["attraction", "museum", "castle"],
            maxDistance: null,
            limit: 10,
        },
    };

    console.log("Testing with filters format:");
    console.log(JSON.stringify(body, null, 2));

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        console.log(`\nStatus: ${response.status}`);
        const data = await response.json();
        console.log(`Received ${data.pois?.length || 0} POIs`);

        if (data.metadata) {
            console.log("\nMetadata:", JSON.stringify(data.metadata, null, 2));
        }

        if (data.pois && data.pois.length > 0) {
            console.log("\nFirst 3 POIs:");
            data.pois.slice(0, 3).forEach((poi, i) => {
                console.log(
                    `${i + 1}. ${poi.name} (${poi.category}) at [${poi.lat}, ${
                        poi.lon
                    }]`
                );
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

testPoiApi();
