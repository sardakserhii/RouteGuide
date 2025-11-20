# Project Overview: RouteGuide

## Description

RouteGuide is a web-based travel route planner that allows users to calculate driving routes between two points and discover interesting places (Points of Interest - POIs) along the way. It leverages AI to filter and recommend the most relevant tourist attractions.

## Technology Stack

### Frontend

- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **Maps:** Leaflet (react-leaflet)
- **State Management:** React Hooks (useState, useEffect)
- **HTTP Client:** Native `fetch`

### Backend

- **Runtime:** Node.js
- **Framework:** Fastify
- **Language:** TypeScript
- **External Services:**
  - **OSRM (Open Source Routing Machine):** For route calculation (driving).
  - **Overpass API (OpenStreetMap):** For fetching raw POI data.
  - **Google Gemini AI:** For intelligent filtering and generating descriptions of places.

## Implemented Functionality

### 1. Route Calculation

- **Endpoint:** `GET /api/route`
- **Logic:**
  - Accepts `from` and `to` coordinates (lat,lng).
  - Proxies requests to the OSRM public API (`router.project-osrm.org`).
  - Returns route geometry (GeoJSON), distance, and duration.
- **Frontend:**
  - Users can select start and end points by clicking on the map or (presumably) entering coordinates.
  - Displays the route path using a blue Polyline on the map.

### 2. Points of Interest (POI) Discovery

- **Endpoint:** `POST /api/pois`
- **Logic:**
  - Accepts `bbox` (Bounding Box), `route` (path coordinates), and `filters`.
  - Fetches POIs from Overpass API based on the bounding box and categories.
  - Filters POIs to ensure they are within a specific distance from the route path.
- **Frontend:**
  - Automatically fetches POIs when a route is calculated.
  - Displays POIs as markers on the map.
  - Shows a popup with the POI name and category on click.

### 3. Advanced Filtering System

The application includes a comprehensive filtering system for POIs:

- **Categories:** Users can filter by specific types:
  - _Tourism:_ Attractions, Museums, Viewpoints, Hotels, etc.
  - _Historic:_ Monuments, Castles, Ruins, etc.
  - _Nature:_ Peaks, Beaches, Caves, Parks, etc.
  - _Amenities:_ Restaurants, Cafes, etc.
- **Distance from Route:**
  - Adjustable slider (0.5km to 50km).
  - "Auto" mode (default 5km).
- **AI Smart Filter:**
  - A toggle to enable "Smart AI Filtering".

### 4. AI Integration (Google Gemini)

- **Service:** `GeminiService`
- **Model:** `gemini-2.5-flash`
- **Functionality:**
  - Takes a list of raw POIs from Overpass.
  - Selects the top 10 most interesting places for a tourist.
  - Filters out generic or uninteresting locations (e.g., banks, supermarkets).
  - Generates a short, engaging description for each selected place.
  - Returns a JSON response with enhanced data.

### 5. User Interface

- **Map View:** Full-screen interactive map.
- **Route Panel:** Controls for route input (Start/End).
- **Filter Panel:** Collapsible sidebar for managing POI filters.
- **POI List:** (Component `PoiList`) Displays a list of found places.
- **Loading States:** Visual indicators for route calculation and AI processing.

## Project Structure

### Frontend (`src/`)

- `components/Map/MapView.jsx`: Main component orchestrating the map, route fetching, and state.
- `components/PoiFilter/PoiFilter.jsx`: UI component for the filtering sidebar.
- `components/PoiList/PoiList.jsx`: Component to list POIs (side panel).
- `api/routeApi.js`: API client methods (`fetchRouteData`, `fetchPoisData`).

### Backend (`backend/src/`)

- `routes/routeRoutes.ts`: Handles route calculation requests.
- `routes/poisRoutes.ts`: Handles POI fetching and processing.
- `services/overpassService.ts`: Interacts with Overpass API.
- `services/geminiService.ts`: Interacts with Google Gemini API.
- `services/geoService.ts`: Geographic utility functions (distance calculations).

## Future Planning (For AI Analysis)

- **Optimization:** The current implementation sends large route data in the POST body.
- **AI Context:** The AI currently receives a simplified list of POIs. Context could be improved.
- **Error Handling:** Basic error handling is in place, but could be more robust for API failures.
