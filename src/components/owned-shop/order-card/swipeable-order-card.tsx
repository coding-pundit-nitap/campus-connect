"use client";

import { useDrag } from "@use-gesture/react";
import { motion, useAnimation } from "framer-motion";
import { Check, X } from "lucide-react";
import React, { useRef, useState } from "react";

interface SwipeableOrderCardProps {
  children: React.ReactNode;
  onAccept?: () => void;
  onReject?: () => void;
  acceptColor?: string;
  rejectColor?: string;
}

const SWIPE_THRESHOLD = 100;

export function SwipeableOrderCard({
  children,
  onAccept,
  onReject,
  acceptColor = "bg-green-500",
  rejectColor = "bg-red-500",
}: SwipeableOrderCardProps) {
  const controls = useAnimation();
  const [exitX, setExitX] = useState<number | string>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useDrag(
    async ({ active, movement: [mx], cancel }) => {
      if (active && Math.abs(mx) > SWIPE_THRESHOLD) {
        if (mx > 0 && onAccept) {
          setExitX("100%");
          await controls.start({ x: "100%", opacity: 0 });
          onAccept();
          cancel();
        } else if (mx < 0 && onReject) {
          setExitX("-100%");
          await controls.start({ x: "-100%", opacity: 0 });
          onReject();
          cancel();
        }
      } else if (!active) {
        controls.start({ x: 0, opacity: 1 });
      } else {
        controls.start({ x: mx });
      }
    },
    {
      target: cardRef,
      axis: "x",
      filterTaps: true,
      eventOptions: { passive: false },
    }
  );

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden w-full rounded-xl mb-4 shadow-sm border bg-card touch-pan-y"
    >
      <div className="absolute inset-0 flex justify-between items-center px-6">
        <div
          className={`flex items-center justify-start w-1/2 h-full text-white ${acceptColor}`}
        >
          <Check className="h-8 w-8 ml-4" />
          <span className="ml-2 font-semibold">Accept</span>
        </div>
        <div
          className={`flex items-center justify-end w-1/2 h-full text-white ${rejectColor}`}
        >
          <span className="mr-2 font-semibold">Reject</span>
          <X className="h-8 w-8 mr-4" />
        </div>
      </div>

      <motion.div
        ref={cardRef}
        animate={controls}
        initial={{ x: 0, opacity: 1 }}
        exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
        className="relative z-10 w-full bg-card rounded-xl shadow-md border-b-2 h-full cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}
