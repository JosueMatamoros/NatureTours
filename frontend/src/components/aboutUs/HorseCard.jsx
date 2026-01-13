export default function HorseCard({ horse }) {
  const ROTATIONS = [
    "-rotate-2",
    "rotate-1",
    "-rotate-1",
    "rotate-2",
    "-rotate-3",
    "rotate-3",
    "-rotate-1",
    "rotate-1",
    "-rotate-2",
    "rotate-2",
    "-rotate-1",
    "rotate-1",
    "-rotate-3",
    "rotate-3",
  ];

  const rot = ROTATIONS[(horse.id - 1) % ROTATIONS.length];

  return (
    <div className="group relative">
      {/* Bubble outside */}
      <div
        className="
          pointer-events-none
          absolute -top-12 left-6 z-30
          opacity-0 translate-y-2
          transition-all duration-300 ease-out
          group-hover:opacity-100 group-hover:translate-y-0
        "
      >
        <div
          className="
            relative
            rounded-full bg-[#2E2A2A] px-6 py-3
            text-base font-semibold text-white
            shadow-[0_18px_40px_rgba(0,0,0,0.25)]
            whitespace-nowrap
          "
        >
          {horse.greeting}
          <span
            className="
              absolute left-10 top-full
              h-0 w-0
              border-l-[10px] border-r-[10px] border-t-[12px]
              border-l-transparent border-r-transparent border-t-[#2E2A2A]
            "
          />
        </div>
      </div>

      {/* Polaroid */}
      <div
        className={[
          "relative overflow-hidden rounded-[26px]",
          "bg-white ring-1 ring-black/5",
          "p-4 pb-1",
          "shadow-[0_18px_45px_rgba(0,0,0,0.12)]",
          "transition-transform duration-500 ease-out",
          "will-change-transform",
          rot,
          "group-hover:-translate-y-2 group-hover:scale-[1.02] group-hover:rotate-0",
        ].join(" ")}
      >
        {/* Image */}
        <div className="overflow-hidden rounded-[18px] bg-slate-100">
          <img
            src={horse.image}
            alt={horse.name}
            className="
    h-[260px] w-full object-cover
    transition-transform duration-700 ease-out
    will-change-transform
    group-hover:scale-[1.06]
    sm:h-[290px] md:h-[320px]
  "
            style={{
              objectPosition: `${horse.centerX ?? 50}% center`,
            }}
            loading="lazy"
          />
        </div>

        {/* Name centered */}
        <div className="mt-1 flex justify-center font-caveat ">
          <div className="text-center text-[28px] font-semibold tracking-tight text-slate-900">
            {horse.name}
          </div>
        </div>
      </div>
    </div>
  );
}
