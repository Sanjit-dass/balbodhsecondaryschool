import { motion } from "framer-motion";
import { useTranslate } from '../../hooks/useTranslate';
import AnimatedCounter from "./AnimatedCounter";



export default function StatisticsCounter({ statistics }) {
  const { t } = useTranslate();

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="relative py-32 md:py-40 overflow-hidden bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      {/* Premium Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-indigo-50"></div>
        
        {/* Subtle Animated Background Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"
        ></motion.div>
        
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.02, 0.04, 0.02],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full blur-3xl"
        ></motion.div>

        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.02, 0.03, 0.02],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
        ></motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Heading */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="text-center mb-20 md:mb-24"
        >
          <motion.span
            variants={titleVariants}
            className="inline-block px-6 py-3 rounded-full bg-blue-50 backdrop-blur-xl border border-blue-200 text-blue-700 font-bold text-xs md:text-sm uppercase tracking-widest mb-6"
          >
            {t('✨ School Excellence Metrics')}
          </motion.span>

          <motion.h2
            variants={titleVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('By The Numbers')}
            </span>
          </motion.h2>

          <motion.p
            variants={titleVariants}
            className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
          >
            {t('Excellence reflected through our achievements, dedicated faculty, and successful students worldwide')}
          </motion.p>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 md:gap-8"
        >
          {statistics?.map((stat, index) => (
            <AnimatedCounter
              key={index}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              icon={stat.icon}
              index={index}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}