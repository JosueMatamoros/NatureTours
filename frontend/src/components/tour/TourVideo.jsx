const TourVideo = () => {
  return (
    <section className="my-6 sm:my-10 flex flex-col items-center px-4">
      {/* Título */}
      <div className="mb-6 text-center">
        <p className="mb-2 text-sm tracking-widest text-gray-500 uppercase">
          Arenal Volcano · Costa Rica
        </p>
        <h1 className="text-center text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
          Horseback Riding in La Fortuna
        </h1>
      </div>

      {/* Frame del video - YouTube Embed */}
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-gray-200 shadow-sm aspect-video">
        <iframe
          src="https://www.youtube.com/embed/lm6uF1j5i-s"
          title="Horseback riding tour in La Fortuna, Costa Rica – Nature Tours"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </section>
  );
};

export default TourVideo;
