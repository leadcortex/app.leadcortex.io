// frontend/components/landing/lead-cortex-tablet.tsx

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";
import { ArrowRight } from "./landing-icons";

const CAPABILITIES = [
  {
    id: "01",
    title: "Assistants IA",
    desc: "Claude, ChatGPT et Gemini inclus.",
    img: "/images/site/capabilities/ai-models.png",
  },
  {
    id: "02",
    title: "Gmail et Outlook",
    desc: "Vos emails partent de votre propre boîte.",
    img: "/images/site/capabilities/gmail-outlook.png",
  },
  {
    id: "03",
    title: "WhatsApp et LinkedIn",
    desc: "Écrivez à vos prospects là où ils répondent.",
    img: "/images/site/capabilities/whatsapp-linkedin.png",
  },
  {
    id: "04",
    title: "Vos clés API",
    desc: "En option, sans marge de notre part.",
    img: "/images/site/capabilities/api-keys.png",
  },
];

const FeatureCard = ({ 
  item, 
  index, 
  total,
  progress 
}: { 
  item: typeof CAPABILITIES[0]; 
  index: number; 
  total: number;
  progress: MotionValue<number> 
}) => {
  const step = 1 / (total - 0.5);
  const start = index * step;
  const mid = start + step * 0.6;
  const end = start + step * 1.2;

  const y = useTransform(progress, [start, mid], ["100%", "0%"]);
  const rotateX = useTransform(progress, [start, mid], [25, 0]);
  const opacity = useTransform(progress, [start, start + 0.05], [0, 1]);

  const isLast = index === total - 1;
  
  const targetScale = isLast ? 1 : 0.85;
  const targetY = isLast ? "0%" : "-8%";
  const targetX = isLast ? "0%" : (index % 2 === 0 ? "-8%" : "8%");
  const targetRotate = isLast ? 0 : (index % 2 === 0 ? -6 : 6);

  const scale = useTransform(progress, [mid, end], [1, targetScale]);
  const yExit = useTransform(progress, [mid, end], ["0%", targetY]);
  const xExit = useTransform(progress, [mid, end], ["0%", targetX]);
  const rotateZ = useTransform(progress, [mid, end], [0, targetRotate]);

  const yCombined = useTransform(
    [y, yExit],
    ([latestY, latestYExit]) => `calc(${latestY} + ${latestYExit})`
  );

  return (
    <motion.div
      style={{
        y: yCombined,
        x: xExit,
        scale,
        rotateX,
        rotateZ,
        opacity,
        zIndex: index,
        transformStyle: "preserve-3d",
      }}
      className="absolute inset-0 w-full max-w-[900px] mx-auto px-4 md:px-0 flex items-center justify-center"
    >
      <div className="w-full bg-[#0b0b12] rounded-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
        
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="relative w-full md:w-1/2 bg-[#141414] p-8 flex items-center justify-center overflow-hidden">
          <img 
            src={item.img} 
            alt={item.title} 
            className="relative z-10 w-full h-auto max-h-[300px] object-contain drop-shadow-2xl rounded-2xl"
          />

          <div className="absolute top-6 left-6 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <span className="font-mono text-sm font-bold text-white">
              {item.id}
            </span>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-[#0b0b12]">
          <h3 className="text-2xl md:text-4xl font-display text-white mb-6 leading-tight">
            {item.title}
          </h3>
          
          <p className="text-white/60 text-sm md:text-base leading-relaxed mb-8">
            {item.desc}
          </p>
          
          <a href="/product" className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors gap-2 mt-auto">
            En savoir plus
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export function LeadCortexTablet() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    mass: 0.5,
    restDelta: 0.001,
  });

  const monitorRotateX = useTransform(smoothProgress, [0, 0.2], [12, 0]);
  const monitorRotateY = useTransform(smoothProgress, [0, 0.2], [-8, 0]);
  const monitorZ = useTransform(smoothProgress, [0, 0.2], [0, 2500]);
  const monitorScale = useTransform(smoothProgress, [0, 0.2], [1, 4]);
  const monitorOpacity = useTransform(smoothProgress, [0.15, 0.22], [1, 0]);
  const screenContentOpacity = useTransform(smoothProgress, [0.02, 0.1, 0.16], [0, 1, 0]);
  const screenContentScale = useTransform(smoothProgress, [0.02, 0.16], [0.92, 1]);

  const sideTextX = useTransform(smoothProgress, [0, 0.15], [0, 200]);
  const sideTextOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);

  const cardsProgress = useTransform(smoothProgress, [0.2, 0.9], [0, 1]);
  const innerOpacity = useTransform(smoothProgress, [0.18, 0.28], [0, 1]);

  const bgOpacity = useTransform(smoothProgress, [0.9, 1], [1, 0]);
  const contentFade = useTransform(smoothProgress, [0.85, 0.95], [1, 0]);

  return (
    <div ref={containerRef} className="relative h-[450vh] bg-transparent">
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ perspective: "1200px" }}
      >
        <motion.div
          style={{
            rotateX: monitorRotateX,
            rotateY: monitorRotateY,
            z: monitorZ,
            scale: monitorScale,
            opacity: monitorOpacity,
            transformOrigin: "50% 40%", 
            transformStyle: "preserve-3d",
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        >
          <div
            className="relative aspect-square -translate-x-[5%]"
            style={{ width: "min(90vw, 85vh, 1000px)" }}
          >
            <img
              src="/images/site/capabilities/monitor.svg" 
              alt="Écran d'ordinateur LeadCortex"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
            <motion.div
              aria-hidden="true"
              style={{
                opacity: screenContentOpacity,
                scale: screenContentScale,
              }}
              className="absolute left-[3%] top-[14%] grid h-[54%] w-[94%] grid-cols-2 grid-rows-2 gap-[2%] rounded-[2%] bg-[#0b0b12]/95 p-[3%]"
            >
              {CAPABILITIES.map((item) => (
                <img
                  key={item.id}
                  src={item.img}
                  alt=""
                  loading="eager"
                  className="h-full w-full object-contain"
                />
              ))}
            </motion.div>
          </div>

          <motion.div
            style={{ x: sideTextX, opacity: sideTextOpacity }}
            className="absolute right-[5%] top-1/2 -translate-y-1/2 max-w-[420px]"
          >
          </motion.div>
        </motion.div>

        <motion.div
          style={{ opacity: innerOpacity }}
          className="absolute inset-0 z-30"
        >
          <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 bg-[#0b0b12]" />

          <motion.div
            style={{ opacity: contentFade }}
            className="relative z-10 w-full h-full"
          >
            <div className="absolute top-[8vh] left-0 w-full text-center px-6 pointer-events-none z-50">
              <h2 className="text-3xl md:text-5xl font-display text-white">
                LeadCortex s'adapte à votre <em>workflow</em>.
              </h2>
            </div>

            <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1500px" }}>
              <div className="relative w-full max-w-[900px] h-[500px] md:h-[450px]">
                {CAPABILITIES.map((item, i) => (
                  <FeatureCard 
                    key={item.id} 
                    item={item} 
                    index={i} 
                    total={CAPABILITIES.length}
                    progress={cardsProgress} 
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
