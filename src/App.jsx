import "./App.css";
import "leaflet/dist/leaflet.css";

import MapView from "./components/Map/MapView";
import Onboarding from "./components/Onboarding/Onboarding";

function App() {
  return (
    <>
      <Onboarding />
      <MapView />
    </>
  );
}

export default App;
