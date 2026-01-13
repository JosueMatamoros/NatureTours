import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMap, FiMapPin, FiStar, FiFeather } from "react-icons/fi";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="relative h-dvh overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0d1f35] to-[#081018]">
      {/* Moon */}
      <motion.div
        className="pointer-events-none absolute right-16 top-16 md:right-24 md:top-24"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.3 }}
      >
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-100 via-amber-50 to-amber-200/80 md:h-28 md:w-28" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-amber-900/20" />
          <div className="absolute -inset-4 rounded-full bg-amber-100/10 blur-2xl" />
        </div>
      </motion.div>

      {/* Background layers */}
      <StarrySky />
      <Fireflies />
      <FloatingLeaves />
      <MountainSilhouette />

      {/* Aurora */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-96 overflow-hidden">
        <motion.div
          className="absolute left-1/4 top-0 h-full w-1/2 opacity-20"
          style={{
            background:
              "linear-gradient(180deg, rgba(100,200,150,0.3) 0%, rgba(80,150,200,0.2) 50%, transparent 100%)",
            filter: "blur(60px)",
          }}
          animate={{ x: [-100, 100, -100], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-dvh flex-col items-center justify-center px-6 py-12">
        <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
          <AnimatedCompass />

          <GlowingText />

          {/* Message */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <h1 className="text-2xl font-semibold text-white md:text-4xl">
              Looks like you got lost in the forest
            </h1>
            <p className="mx-auto max-w-md text-lg text-white/65 md:text-xl">
              This trail doesn’t lead anywhere we know. Don’t worry, even the
              best explorers take wrong turns sometimes. Let’s get you back on
              track.
            </p>
          </motion.div>

          {/* Decorative icons */}
          <div className="flex items-center gap-6 text-emerald-300/70">
            <BouncyIcon delay={0}>
              <FiFeather className="h-7 w-7" />
            </BouncyIcon>
            <BouncyIcon delay={0.35}>
              <FiMapPin className="h-6 w-6" />
            </BouncyIcon>
            <BouncyIcon delay={0.7}>
              <FiStar className="h-7 w-7" />
            </BouncyIcon>
          </div>

          {/* Actions */}
          <motion.div
            className="mt-2 flex flex-col gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <FiArrowLeft className="h-5 w-5" />
              Back to home
            </button>

            <button
              type="button"
              onClick={() => navigate("/tours")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-white/5 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <FiMap className="h-5 w-5" />
              Explore tours
            </button>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#081018] to-transparent" />
    </main>
  );
}

/* -------------------- Compass -------------------- */

function AnimatedCompass() {
  return (
    <motion.div
      className="relative h-32 w-32 md:h-40 md:w-40"
      initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Middle ring glow */}
      <div className="absolute inset-2 rounded-full border border-amber-300/30 shadow-[0_0_30px_rgba(255,200,100,0.18)]" />

      {/* Inner circle */}
      <div className="absolute inset-4 rounded-full bg-white/5 backdrop-blur-sm" />

      {/* Needle */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: [0, 10, -10, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 100 100" className="h-20 w-20 md:h-24 md:w-24">
          <motion.polygon
            points="50,15 45,50 55,50"
            className="fill-emerald-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          />
          <motion.polygon
            points="50,85 45,50 55,50"
            className="fill-white/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          />
          <circle cx="50" cy="50" r="4" className="fill-amber-300" />
        </svg>
      </motion.div>

      {/* Cardinal directions */}
      <motion.span
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 text-xs font-bold text-emerald-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        N
      </motion.span>
      <motion.span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-xs font-medium text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        S
      </motion.span>
      <motion.span
        className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 text-xs font-medium text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        W
      </motion.span>
      <motion.span
        className="absolute right-0 top-1/2 translate-x-1 -translate-y-1/2 text-xs font-medium text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
      >
        E
      </motion.span>
    </motion.div>
  );
}

/* -------------------- Glowing 404 -------------------- */

function GlowingText() {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <motion.h1
        className="select-none text-[120px] font-bold leading-none tracking-tighter md:text-[180px] lg:text-[220px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(120,200,150,1) 0%, rgba(80,160,120,0.8) 50%, rgba(40,80,60,0.4) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 80px rgba(120,200,150,0.3)",
        }}
        animate={{
          textShadow: [
            "0 0 80px rgba(120,200,150,0.3)",
            "0 0 120px rgba(120,200,150,0.5)",
            "0 0 80px rgba(120,200,150,0.3)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        404
      </motion.h1>

      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(120,200,150,0.4) 0%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}

/* -------------------- Fireflies -------------------- */

function Fireflies() {
  const [fireflies, setFireflies] = useState([]);

  useEffect(() => {
    const flies = [];
    for (let i = 0; i < 25; i++) {
      flies.push({
        id: i,
        initialX: Math.random() * 100,
        initialY: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 5,
      });
    }
    setFireflies(flies);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {fireflies.map((f) => (
        <motion.div
          key={f.id}
          className="absolute rounded-full"
          style={{
            left: `${f.initialX}%`,
            top: `${f.initialY}%`,
            width: f.size,
            height: f.size,
            background:
              "radial-gradient(circle, rgba(255,230,150,1) 0%, rgba(255,200,100,0.8) 40%, rgba(255,180,50,0) 100%)",
            boxShadow: `0 0 ${f.size * 3}px ${f.size}px rgba(255,220,100,0.6)`,
          }}
          animate={{
            x: [0, 30, -20, 40, -30, 0],
            y: [0, -40, 20, -30, 40, 0],
            opacity: [0, 1, 0.6, 1, 0.4, 0],
            scale: [0.8, 1.2, 0.9, 1.1, 1, 0.8],
          }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* -------------------- Floating Leaves -------------------- */

function FloatingLeaves() {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const newLeaves = [];
    for (let i = 0; i < 12; i++) {
      newLeaves.push({
        id: i,
        initialX: Math.random() * 100,
        size: Math.random() * 20 + 15,
        duration: Math.random() * 10 + 15,
        delay: Math.random() * 10,
        rotation: Math.random() * 360,
      });
    }
    setLeaves(newLeaves);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute text-emerald-300/40"
          style={{
            left: `${leaf.initialX}%`,
            top: -50,
            width: leaf.size,
            height: leaf.size,
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, 50, -30, 60, -40, 20],
            rotate: [leaf.rotation, leaf.rotation + 720],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
            <path
              d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3 8.5 7 10 0-2.5 1-5 3-7 2 2 3 4.5 3 7 4-1.5 7-5.5 7-10 0-5.5-4.5-10-10-10z"
              fill="currentColor"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/* -------------------- Mountains -------------------- */

function MountainSilhouette() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0">
      {/* distant */}
      <svg
        viewBox="0 0 1440 320"
        className="absolute bottom-24 h-48 w-full md:h-64"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,320 L0,200 Q120,100 240,180 Q360,80 480,160 Q600,60 720,140 Q840,40 960,120 Q1080,50 1200,130 Q1320,70 1440,150 L1440,320 Z"
          fill="rgba(20, 30, 50, 0.6)"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
      </svg>

      {/* mid */}
      <svg
        viewBox="0 0 1440 320"
        className="absolute bottom-12 h-40 w-full md:h-56"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,320 L0,220 Q100,140 200,200 Q300,100 400,180 Q500,80 600,170 Q700,90 800,160 Q900,70 1000,150 Q1100,90 1200,170 Q1300,110 1440,180 L1440,320 Z"
          fill="rgba(15, 25, 40, 0.8)"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 0.3 }}
        />
      </svg>

      {/* front forest */}
      <svg
        viewBox="0 0 1440 200"
        className="absolute bottom-0 h-32 w-full md:h-44"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,200 L0,120
             L30,120 L45,60 L60,120
             L90,120 L110,40 L130,120
             L160,120 L175,80 L190,120
             L220,120 L245,30 L270,120
             L300,120 L320,70 L340,120
             L370,120 L395,45 L420,120
             L450,120 L470,85 L490,120
             L520,120 L545,35 L570,120
             L600,120 L625,65 L650,120
             L680,120 L705,50 L730,120
             L760,120 L785,75 L810,120
             L840,120 L865,40 L890,120
             L920,120 L945,60 L970,120
             L1000,120 L1025,45 L1050,120
             L1080,120 L1105,70 L1130,120
             L1160,120 L1185,55 L1210,120
             L1240,120 L1265,80 L1290,120
             L1320,120 L1345,50 L1370,120
             L1400,120 L1420,65 L1440,120
             L1440,200 Z"
          fill="rgba(10, 18, 30, 1)"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
        />
      </svg>
    </div>
  );
}

/* -------------------- Starry sky canvas -------------------- */

function StarrySky() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const stars = [];
    const starCount = 200;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    const shootingStars = [];
    const maxShootingStars = 3;

    const createShootingStar = () => {
      if (shootingStars.filter((s) => s.active).length >= maxShootingStars) return;
      shootingStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height * 0.3),
        length: Math.random() * 80 + 40,
        speed: Math.random() * 8 + 4,
        opacity: 1,
        angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
        active: true,
      });
    };

    let time = 0;
    let raf = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((s) => {
        const twinkle =
          Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255, ${s.opacity * twinkle})`;
        ctx.fill();

        if (s.size > 1.5) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2);
          g.addColorStop(0, `rgba(255,255,255, ${s.opacity * twinkle * 0.3})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.fill();
        }
      });

      shootingStars.forEach((st) => {
        if (!st.active) return;

        const endX = st.x + Math.cos(st.angle) * st.length;
        const endY = st.y + Math.sin(st.angle) * st.length;

        const g = ctx.createLinearGradient(st.x, st.y, endX, endY);
        g.addColorStop(0, `rgba(255,255,255, ${st.opacity})`);
        g.addColorStop(1, `rgba(255,255,255, 0)`);

        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.stroke();

        st.x += Math.cos(st.angle) * st.speed;
        st.y += Math.sin(st.angle) * st.speed;
        st.opacity -= 0.01;

        if (st.x > canvas.width || st.y > canvas.height || st.opacity <= 0) {
          st.active = false;
        }
      });

      if (Math.random() < 0.005) createShootingStar();

      time++;
      raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />;
}

/* -------------------- Small bounce wrapper -------------------- */

function BouncyIcon({ children, delay = 0 }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}
