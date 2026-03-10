import { motion } from "framer-motion";

export function AnimatedCheckmark() {
  return (
    <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
      {/* Outer ring pulse */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-accent/30"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.15, opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
      />
      {/* Background circle */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/15 to-accent/5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      />
      {/* Inner filled circle */}
      <motion.div
        className="absolute inset-2 rounded-full bg-accent/10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.35, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
      />
      {/* Check icon */}
      <svg
        className="relative h-9 w-9"
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M5 13l4 4L19 7"
          stroke="hsl(var(--accent))"
          strokeWidth={2.5}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
