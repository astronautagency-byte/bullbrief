"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { type ReactNode, useRef } from "react";
import { cn } from "@/lib/cn";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroReveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ProductFloat({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [48, -32]);
  return <motion.div ref={ref} style={{ y }} className={cn("will-change-transform", className)}>{children}</motion.div>;
}

export function MotionLink({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.span whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.975 }} transition={{ duration: 0.16 }} className={cn("inline-flex", className)}>
      {children}
    </motion.span>
  );
}
