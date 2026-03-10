import { motion } from "framer-motion";

export function AnimatedCheckmark() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
      <svg
        className="h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M5 13l4 4L19 7"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
