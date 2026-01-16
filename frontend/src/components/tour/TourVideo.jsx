const TourVideo = () => {
  return (
    <section className="my-10 flex flex-col items-center px-4">
      {/* Título */}
      <div className="mb-6 text-center">
        <p className="mb-2 text-sm tracking-widest text-gray-500 uppercase">
          Costa Rica Experience
        </p>
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
          Horseback Riding Tour
        </h2>
      </div>

      {/* Frame del video */}
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-gray-200 shadow-sm aspect-video">
        <video
          src="/videos/horseback.mp4"
          controls
          className="w-full h-full object-cover"
        />
      </div>
    </section>
  );
};

export default TourVideo;
