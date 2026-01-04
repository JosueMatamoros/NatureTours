import { useEffect, useRef } from "react";

let googleMapsLoaderPromise = null;

function loadGoogleMapsOnce(apiKey) {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (googleMapsLoaderPromise) return googleMapsLoaderPromise;

  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps));
      existing.addEventListener("error", () => reject(new Error("Falló la carga de Google Maps")));
      return;
    }

    const script = document.createElement("script");
    script.dataset.googleMaps = "true";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;

    script.onload = () => {
      if (!window.google?.maps?.importLibrary) {
        reject(new Error("Google Maps cargó pero importLibrary no está disponible."));
        return;
      }
      resolve(window.google.maps);
    };

    script.onerror = () => reject(new Error("No se pudo cargar Google Maps JavaScript API"));
    document.head.appendChild(script);
  });

  return googleMapsLoaderPromise;
}

export default function Maps({
  origin,
  destination,
  className = "h-[380px] w-full sm:h-[420px] lg:h-[460px]",
  zoom = 15,
  onRouteInfo, // (info) => void
  onError, // (message) => void
}) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const directionsRendererRef = useRef(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

    if (!apiKey) {
      onError?.("Falta la API key (VITE_GOOGLE_MAPS_KEY).");
      return;
    }

    if (!origin || !destination) {
      onError?.("Falta origin/destination para el mapa.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadGoogleMapsOnce(apiKey);
        if (cancelled || !mapDivRef.current) return;

        const { Map } = await window.google.maps.importLibrary("maps");

        if (!mapRef.current) {
          mapRef.current = new Map(mapDivRef.current, {
            center: destination,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            clickableIcons: false,

            draggable: false,
            scrollwheel: false,
            disableDoubleClickZoom: true,
            keyboardShortcuts: false,
            gestureHandling: "none",

            styles: [
              { featureType: "poi.business", stylers: [{ visibility: "off" }] },
              { featureType: "poi", stylers: [{ visibility: "off" }] },
              { featureType: "transit", stylers: [{ visibility: "off" }] },
              { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
            ],
          });
        }

        const directionsService = new window.google.maps.DirectionsService();

        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            suppressMarkers: false,
            preserveViewport: false,
            polylineOptions: {
              strokeColor: "#2563eb",
              strokeOpacity: 0.95,
              strokeWeight: 6,
            },
          });
          directionsRendererRef.current.setMap(mapRef.current);
        }

        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: false,
          },
          (result, status) => {
            if (cancelled) return;

            if (status !== "OK" || !result) {
              onError?.(
                `No se pudo calcular la ruta (${status}). Verifica Directions API y restricciones de la key.`
              );
              return;
            }

            directionsRendererRef.current.setDirections(result);

            const leg = result.routes?.[0]?.legs?.[0];
            const kmVal = leg?.distance?.value ? leg.distance.value / 1000 : null;

            onRouteInfo?.({
              distanceText: leg?.distance?.text || "",
              distanceKm: kmVal,
            });

            onError?.("");
          }
        );
      } catch (err) {
        console.error("Error cargando Google Maps:", err);
        onError?.("Error cargando Google Maps. Revisa consola y configuración de la key.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [origin, destination, zoom, onRouteInfo, onError]);

  return <div ref={mapDivRef} className={className} />;
}
