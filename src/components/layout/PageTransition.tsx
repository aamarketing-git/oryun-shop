"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * 페이지 전환 부드럽게 (애플 스타일).
 * - 페이지 진입 시 살짝 아래에서 위로 + 페이드 인
 * - 레이아웃은 그대로 유지 (Header/Footer 고정)
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
