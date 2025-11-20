// Using native fetch (Node 18+)

async function test() {
  // bbox: minLat,maxLat,minLng,maxLng
  // Berlin area
  const bbox = "52.51,52.53,13.37,13.40";
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
    console.log("Success! POIs found:", data.length);
    if (data.length > 0) {
        console.log("First POI:", data[0]);
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

test();
