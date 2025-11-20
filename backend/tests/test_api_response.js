// Test what the API actually returns
async function test() {
  const bbox = "49.14218,52.520001,9.211055,13.404964";
  const url = `http://localhost:3000/api/pois?bbox=${bbox}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Error:", res.status, res.statusText);
      const text = await res.text();
      console.error("Body:", text);
      return;
    }
    const data = await res.json();
    console.log("Response type:", typeof data);
    console.log("Is array:", Array.isArray(data));
    console.log("POIs count:", data?.length || 0);
    
    if (data && data.length > 0) {
      console.log("\nFirst 3 POIs:");
      data.slice(0, 3).forEach((poi, i) => {
        console.log(`\nPOI ${i + 1}:`, JSON.stringify(poi, null, 2));
      });
    } else {
      console.log("\n⚠️ No POIs returned!");
      console.log("Full response:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

test();
