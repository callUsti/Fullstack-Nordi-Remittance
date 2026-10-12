import type { ReactNode } from 'react';

declare module 'framer-motion' {
  export interface MotionProps {
    children?: ReactNode;
    className?: string;
    onClick?: (...args: any[]) => any;
    href?: string;
  }
}
