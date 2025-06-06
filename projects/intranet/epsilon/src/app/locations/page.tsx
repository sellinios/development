"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// CSS import needs to be at the top level with "use client" directive
import "leaflet/dist/leaflet.css";

// Location coordinates for each office
const locations = [
  { id: 'cyprus', name: 'CYPRUS', lat: 34.9293, lng: 33.0631 },
  { id: 'the-philippines', name: 'THE PHILIPPINES', lat: 14.5995, lng: 120.9842 },
  { id: 'ukraine', name: 'UKRAINE', lat: 50.4501, lng: 30.5234 },
  { id: 'greece', name: 'GREECE', lat: 37.9838, lng: 23.7275 },
  { id: 'russia', name: 'RUSSIA', lat: 55.7558, lng: 37.6173 },
  { id: 'romania', name: 'ROMANIA', lat: 44.4268, lng: 26.1025 },
  { id: 'turkey', name: 'TURKEY', lat: 41.0082, lng: 28.9784 },
  { id: 'indonesia', name: 'INDONESIA', lat: -6.2088, lng: 106.8456 },
  { id: 'vietnam', name: 'VIETNAM', lat: 21.0285, lng: 105.8542 },
  { id: 'georgia', name: 'GEORGIA', lat: 41.7151, lng: 44.8271 }
];

// Define location type
interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// Create a loading placeholder for the map
const MapLoadingPlaceholder = () => (
  <div className="h-[650px] w-full flex items-center justify-center">
    Loading map...
  </div>
);

// Create a Map component that will be dynamically loaded
const LeafletMap = ({ locations }: { locations: Location[] }) => {
  // We'll import these modules in useEffect to ensure they only run on client
  const [mapModules, setMapModules] = useState<any>(null);
  const [mapIcon, setMapIcon] = useState<any>(null);

  useEffect(() => {
    // Override parent layout constraints with this specific CSS
    const overrideStyles = document.createElement('style');
    overrideStyles.innerHTML = `
      .map-full-width-override {
        width: 100vw !important;
        position: relative !important;
        left: 50% !important;
        right: 50% !important;
        margin-left: -50vw !important;
        margin-right: -50vw !important;
        padding: 0 !important;
        max-width: none !important;
        overflow: visible !important;
      }
      
      .leaflet-container {
        height: 650px !important;
        width: 100% !important;
      }
      
      /* Remove any parent constraints that may be affecting the map */
      .map-full-width-override * {
        max-width: none !important;
      }
    `;
    document.head.appendChild(overrideStyles);

    // Import the required modules on the client side
    Promise.all([
      import('react-leaflet'),
      import('leaflet')
    ]).then(([reactLeaflet, L]) => {
      const { MapContainer, TileLayer, Marker, Popup } = reactLeaflet;

      // Add custom styling for the map
      const leafletStyles = document.createElement('style');
      leafletStyles.textContent = `
        .leaflet-tile-pane {
          filter: brightness(100%) saturate(80%) sepia(10%);
          opacity: 1;
        }
        
        .leaflet-map-pane {
          background-color: transparent;
        }
        
        .leaflet-control-container, .leaflet-pane, .leaflet-overlay-pane, .leaflet-marker-pane {
          background-color: transparent;
        }
        
        /* Ensure all map elements have proper stacking to make them clickable */
        .leaflet-map-pane { z-index: 10; }
        .leaflet-tile-pane { z-index: 20; }
        .leaflet-overlay-pane { z-index: 30; }
        .leaflet-marker-pane { z-index: 40; }
        .leaflet-popup-pane { z-index: 45; }
        .leaflet-top, .leaflet-bottom { z-index: 49; }
      `;
      document.head.appendChild(leafletStyles);

      try {
        // Create custom icon - avoiding the _getIconUrl issue
        const icon = L.icon({
          iconUrl: "/images/location-pin.svg",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });

        setMapIcon(icon);
        setMapModules({ MapContainer, TileLayer, Marker, Popup, L });
      } catch (error) {
        console.error("Error loading map icon:", error);
        // Fallback to default icon
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'leaflet/dist/images/marker-icon-2x.png',
          iconUrl: 'leaflet/dist/images/marker-icon.png',
          shadowUrl: 'leaflet/dist/images/marker-shadow.png',
        });
        const defaultIcon = new L.Icon.Default();
        setMapIcon(defaultIcon);
        setMapModules({ MapContainer, TileLayer, Marker, Popup, L });
      }

      return () => {
        document.head.removeChild(overrideStyles);
        document.head.removeChild(leafletStyles);
      };
    });
  }, []);

  // Return loading state until modules are loaded
  if (!mapModules || !mapIcon) return <MapLoadingPlaceholder />;

  // Destructure the modules
  const { MapContainer, TileLayer, Marker, Popup } = mapModules;

  return (
    <MapContainer
      center={[30, 30]}
      zoom={2.5}
      style={{ height: "650px", width: "100%" }}
      attributionControl={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      boxZoom={false}
      keyboard={false}
      zoomControl={false}
      minZoom={2.5}
      maxZoom={2.5}
      maxBounds={[[-90, -180], [90, 180]]}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
        noWrap={true}
      />
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.lat, location.lng]}
          icon={mapIcon}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-bold text-blue-900">{location.name}</h3>
              <Link href={`/locations/${location.id}`} className="text-blue-600 hover:underline">
                {location.name}
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

// Dynamically import the LeafletMap component to prevent SSR issues
const DynamicMap = dynamic(() => Promise.resolve(LeafletMap), {
  ssr: false,
  loading: () => <MapLoadingPlaceholder />
});

export default function LocationsPage() {
  // This useEffect is needed to apply the full-width override to the map container
  // after the component mounts
  useEffect(() => {
    // Make sure the map container spans the full width by breaking out of any parent constraints
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      mapContainer.classList.add('map-full-width-override');
    }
  }, []);

  return (
    <>
      {/* Map Container - Full browser width, outside the normal layout */}
      <div id="map-container" className="relative">
        <DynamicMap locations={locations} />
      </div>

      {/* Content that comes after the map - Back to normal layout */}
      <div className="relative bg-white z-20">
        <main>
          {/* Intro Text */}
          <section className="py-12 px-8 max-w-4xl mx-auto text-center content-container">
            <p className="text-gray-700 mb-4 text-lg">
              We are present in locations whose seafaring heritage, maritime education and human skills can support our common objective for a customized service provision.
            </p>
            <p className="text-gray-700 mb-4 text-lg">
              Based on our long background in the crewing field, we have built a solid presence in the leading countries that produce outstanding seafaring talent. Yet, we are continuously looking for new challenges by opening up new and promising markets thus, offering more options for our principals.
            </p>
          </section>

          {/* Title for Locations Section */}
          <section className="py-6 px-8 max-w-4xl mx-auto text-center content-container">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">
              TODAY, WE DEPLOY OUR OPERATIONS FROM THE FOLLOWING FULLY-CONTROLLED EPSILON OFFICES:
            </h2>
          </section>

          {/* Location Grid - Improved Tabs - "View Details" text removed */}
          <section className="py-8 px-6 max-w-6xl mx-auto mb-10 content-container">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
              {locations.map((location) => (
                <Link
                  href={`/locations/${location.id}`}
                  key={location.id}
                  className="group flex flex-col items-center justify-center p-5 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 h-32"
                >
                  <div className="w-10 h-10 flex items-center justify-center mb-3 bg-blue-100 group-hover:bg-blue-200 rounded-full transition-colors duration-300">
                    <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-blue-900 group-hover:text-blue-700 transition-colors duration-300">{location.name}</h3>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}