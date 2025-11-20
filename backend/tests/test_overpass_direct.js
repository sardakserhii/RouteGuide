const query = `
  [out:json]
  [timeout:25]
  ;
  (
    node["tourism"](52.51,13.37,52.53,13.40);
    way["tourism"](52.51,13.37,52.53,13.40);
    relation["tourism"](52.51,13.37,52.53,13.40);
  );
  out center;
`;
const url = 'https://overpass-api.de/api/interpreter';

console.log("Query:", query);

fetch(url, {
  method: 'POST',
  body: 'data=' + encodeURIComponent(query),
  headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
  }
}).then(async r => {
    console.log("Status:", r.status);
    if (!r.ok) {
        console.log("Error Body:", await r.text());
    } else {
        const data = await r.json();
        console.log("Success. Elements:", data.elements.length);
    }
}).catch(e => console.error("Fetch error:", e));
