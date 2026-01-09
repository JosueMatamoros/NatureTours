import React, { useEffect, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const PLACE_ID = "ChIJda3yOwBzoI8RrEXNfW7ydd8";

function stars(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  const full = Math.round(num);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

export default function ReviewsSection() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [placeData, setPlaceData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError("");

        if (!apiKey) throw new Error("Falta VITE_GOOGLE_MAPS_KEY en tu .env");

        // Nuevo loader API: setOptions + importLibrary
        setOptions({
          key: apiKey,
          version: "beta",
        });

        const { Place } = await importLibrary("places");

        const place = new Place({ id: PLACE_ID });

        // Pedimos reviews + photos (y lo básico)
        await place.fetchFields({
          fields: ["displayName", "formattedAddress", "rating", "reviews", "photos"],
        });

        if (cancelled) return;

        setPlaceData({
          displayName: place.displayName ?? "",
          formattedAddress: place.formattedAddress ?? "",
          rating: place.rating ?? null,
          reviews: Array.isArray(place.reviews) ? place.reviews : [],

          // photos: array de Photo objects (hasta 10). getURI() genera URL usable.
          photos: Array.isArray(place.photos) ? place.photos : [],
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Error cargando datos del lugar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (typeof window !== "undefined") run();

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  if (loading) {
    return (
      <section>
        <h2>Reseñas</h2>
        <p>Cargando…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2>Reseñas</h2>
        <p style={{ color: "crimson" }}>{error}</p>
      </section>
    );
  }

  if (!placeData) {
    return (
      <section>
        <h2>Reseñas</h2>
        <p>No se pudo obtener información del lugar.</p>
      </section>
    );
  }

  const { displayName, formattedAddress, rating, reviews, photos } = placeData;

  // Reviews: Places te devuelve hasta 5. Si hay menos, vienen menos. :contentReference[oaicite:2]{index=2}
  const reviewsToShow = reviews.slice(0, 5);

  // Fotos del lugar: Place.photos trae hasta 10; aquí mostramos hasta 5 (ajústalo si quieres). :contentReference[oaicite:3]{index=3}
  const photosToShow = photos.slice(0, 5);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h2 style={{ margin: 0 }}>{displayName || "Lugar"}</h2>
        {formattedAddress ? (
          <div style={{ opacity: 0.85 }}>{formattedAddress}</div>
        ) : null}
        {rating != null ? (
          <div style={{ fontWeight: 600 }}>
            Rating: {rating} {stars(rating)}
          </div>
        ) : null}
      </header>

      {/* FOTOS DEL LUGAR */}
      <div style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Fotos</h3>

        {photosToShow.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            {photosToShow.map((p, idx) => {
              // Doc: getURI({maxHeight/maxWidth}) devuelve URL de la foto. :contentReference[oaicite:4]{index=4}
              const src = p.getURI({ maxHeight: 360, maxWidth: 640 });

              // Attribution: la API requiere mostrar atribución cuando corresponda (p trae authorAttributions).
              const attributions = Array.isArray(p.authorAttributions) ? p.authorAttributions : [];

              return (
                <figure
                  key={idx}
                  style={{
                    margin: 0,
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.02)",
                  }}
                >
                  <img
                    src={src}
                    alt={`${displayName || "Lugar"} foto ${idx + 1}`}
                    style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {attributions.length > 0 ? (
                    <figcaption style={{ padding: 8, fontSize: 12, opacity: 0.85 }}>
                      {attributions.map((a, i) => {
                        const name = a?.displayName ?? "Autor";
                        const uri = a?.uri ?? "";
                        return (
                          <span key={i}>
                            {uri ? (
                              <a href={uri} target="_blank" rel="noreferrer">
                                {name}
                              </a>
                            ) : (
                              name
                            )}
                            {i < attributions.length - 1 ? " · " : ""}
                          </span>
                        );
                      })}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, opacity: 0.85 }}>No hay fotos disponibles para este lugar.</p>
        )}
      </div>

      {/* REVIEWS */}
      <div style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Reseñas ({reviewsToShow.length})</h3>

        {reviewsToShow.length > 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            {reviewsToShow.map((r, idx) => {
              const authorName = r?.authorAttribution?.displayName ?? "Anónimo";
              const authorUri = r?.authorAttribution?.uri ?? "";
              // Foto del autor del review: authorAttribution.photoURI :contentReference[oaicite:5]{index=5}
              const authorPhoto = r?.authorAttribution?.photoURI ?? "";
              const reviewRating = r?.rating ?? null;
              const reviewText = r?.text ?? "";
              const publish = r?.publishTime ? new Date(r.publishTime).toLocaleDateString() : "";

              return (
                <article
                  key={idx}
                  style={{
                    padding: 12,
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 12,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {authorPhoto ? (
                      <img
                        src={authorPhoto}
                        alt={authorName}
                        width={40}
                        height={40}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.08)",
                        }}
                      />
                    )}

                    <div style={{ display: "grid" }}>
                      <div style={{ fontWeight: 700 }}>
                        {authorUri ? (
                          <a href={authorUri} target="_blank" rel="noreferrer">
                            {authorName}
                          </a>
                        ) : (
                          authorName
                        )}
                      </div>

                      <div style={{ opacity: 0.8, fontSize: 13 }}>
                        {reviewRating != null ? `${reviewRating} ★` : ""}
                        {publish ? ` · ${publish}` : ""}
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: 0, lineHeight: 1.4 }}>
                    {reviewText || "(Sin texto. Mucho sentimiento, pocas palabras.)"}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, opacity: 0.85 }}>
            No se encontraron reseñas para {displayName || "este lugar"}.
          </p>
        )}
      </div>
    </section>
  );
}
