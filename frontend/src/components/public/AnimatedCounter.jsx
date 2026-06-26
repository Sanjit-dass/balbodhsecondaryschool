import React, { useMemo } from "react";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaSchool,
  FaTrophy,
  FaAward,
  FaCalendar,
} from "react-icons/fa";

const iconMap = {
  FaUsers,
  FaChalkboardTeacher,
  FaSchool,
  FaTrophy,
  FaAward,
  FaCalendar,
};

const AnimatedCounter = ({ value, suffix, label, icon: iconName, index = 0 }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const Icon = useMemo(() => {
    const icon = iconMap[iconName] || FaUsers;
    return icon?.default || icon;
  }, [iconName]);

  const CountUpComponent = CountUp?.default || CountUp;

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: index * 0.1,
        ease: "easeOut",
      },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.6,
        delay: index * 0.1 + 0.2,
        ease: "backOut",
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={containerVariants}
      whileHover={{ y: -15, transition: { duration: 0.3 } }}
      className="group relative h-full"
    >
      <div className="relative h-full overflow-hidden rounded-2xl md:rounded-3xl backdrop-blur-xl bg-white border-2 border-blue-100 shadow-xl hover:shadow-2xl transition-all duration-500 p-4 md:p-6 lg:p-8 xl:p-10 flex flex-col items-center justify-center group-hover:border-blue-200 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        <div className="absolute top-2 right-2 md:top-4 md:right-4 w-12 h-12 md:w-20 md:h-20 bg-blue-500/10 rounded-full blur-xl md:blur-2xl group-hover:blur-2xl md:group-hover:blur-3xl transition-all duration-500"></div>
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 w-10 h-10 md:w-16 md:h-16 bg-indigo-500/10 rounded-full blur-xl md:blur-2xl group-hover:blur-2xl md:group-hover:blur-3xl transition-all duration-500"></div>

        <motion.div variants={iconVariants} className="relative z-10 mb-4 md:mb-6 lg:mb-8">
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl md:rounded-3xl blur-lg"
            ></motion.div>

            <div className="relative w-16 h-16 md:w-20 md:h-24 lg:w-24 lg:h-28 rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center shadow-xl md:shadow-2xl group-hover:shadow-2xl md:group-hover:shadow-3xl transition-all duration-500">
              <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-20 text-white text-3xl md:text-4xl lg:text-5xl xl:text-6xl group-hover:scale-110 transition-transform duration-500"
              >
                <Icon />
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 mb-2 md:mb-3 text-center">
          <div className="flex items-center justify-center gap-0.5 md:gap-1">
            <motion.div
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl lg:text-7xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-none"
            >
              {inView ? (
                <CountUpComponent
                  start={0}
                  end={Number(value)}
                  duration={2.5}
                  separator=","
                  preserveValue={true}
                />
              ) : (
                "0"
              )}
            </motion.div>
            {suffix && (
              <span className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-600 ml-1 md:ml-2">
                {suffix}
              </span>
            )}
          </div>
        </div>

        <p className="relative z-10 text-center text-xs md:text-sm lg:text-base font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-300 leading-snug px-1">
          {label}
        </p>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
      </div>
    </motion.div>
  );
};

export default React.memo(AnimatedCounter);
