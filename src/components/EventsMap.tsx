import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import type { Concert } from "@/data/concerts";

// Leaflet's Icon.Default auto-detects an imagePath and prepends it to
// whatever iconUrl you give it, which doubles up Vite's already-resolved
// bundler URLs into a broken path. Swapping in a plain L.Icon as the
// marker prototype's default sidesteps that prepending entirely.
L.Marker.prototype.options.icon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const youAreHereIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "hue-rotate-[130deg]",
});

const BAY_AREA_CENTER: [number, number] = [37.7749, -122.4194];

export type VenueCoordinate = { name: string; lat: number; lng: number };

export function EventsMap({
  events,
  venueCoords,
  userLocation,
}: {
  events: Concert[];
  venueCoords: VenueCoordinate[];
  userLocation: { lat: number; lng: number } | null;
}) {
  const coordByVenue = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number }>();
    for (const v of venueCoords) m.set(v.name, { lat: v.lat, lng: v.lng });
    return m;
  }, [venueCoords]);

  const grouped = useMemo(() => {
    const m = new Map<string, { coord: { lat: number; lng: number }; events: Concert[] }>();
    for (const e of events) {
      const coord = coordByVenue.get(e.venue);
      if (!coord) continue;
      if (!m.has(e.venue)) m.set(e.venue, { coord, events: [] });
      m.get(e.venue)!.events.push(e);
    }
    return Array.from(m.entries());
  }, [events, coordByVenue]);

  const center = userLocation ? ([userLocation.lat, userLocation.lng] as [number, number]) : BAY_AREA_CENTER;

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-2xl border border-border">
      <MapContainer center={center} zoom={11} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, USGS, NGA, EPA, NPS'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={youAreHereIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {grouped.map(([venue, { coord, events: venueEvents }]) => (
          <Marker key={venue} position={[coord.lat, coord.lng]}>
            <Popup>
              <div className="max-w-[220px]">
                <p className="font-semibold">{venue}</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {venueEvents.slice(0, 5).map((e) => (
                    <li key={e.id}>
                      <a href={e.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {e.artist}
                      </a>{" "}
                      — {e.date}
                    </li>
                  ))}
                  {venueEvents.length > 5 && <li className="text-muted-foreground">+{venueEvents.length - 5} more</li>}
                </ul>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
