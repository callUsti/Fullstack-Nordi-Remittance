// ============================================================================
// DEBOUNCED / THROTTLED TOUCHABLE
// High-performance touchable component that prevents double-clicking,
// rapid double-submissions, and duplicate router pushes.
// ============================================================================

import React, { forwardRef, useEffect, useMemo, useRef } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { createThrottle } from '@/core/network/lodash-bounce';

export interface DebouncedTouchableProps extends TouchableOpacityProps {
  /**
   * Time in milliseconds to throttle rapid subsequent presses. Defaults to 600ms.
   */
  throttleWait?: number;
  /**
   * Disables throttling to allow instant consecutive fires. Defaults to false.
   */
  disableThrottle?: boolean;
}

export const DebouncedTouchable = forwardRef<View, DebouncedTouchableProps>(
  (
    {
      onPress,
      throttleWait = 600,
      disableThrottle = false,
      activeOpacity = 0.7,
      ...props
    },
    ref,
  ) => {
    const onPressRef = useRef(onPress);
    useEffect(() => {
      onPressRef.current = onPress;
    }, [onPress]);

    const handlePress = useMemo(() => {
      if (!onPress) return undefined;
      if (disableThrottle) {
        return (e: any) => onPressRef.current?.(e);
      }
      return createThrottle(
        (e: any) => {
          onPressRef.current?.(e);
        },
        throttleWait,
        { leading: true, trailing: false },
      );
    }, [onPress ? true : false, throttleWait, disableThrottle]);

    useEffect(() => {
      return () => {
        if (handlePress && 'cancel' in handlePress && typeof handlePress.cancel === 'function') {
          handlePress.cancel();
        }
      };
    }, [handlePress]);

    return (
      <TouchableOpacity
        ref={ref as any}
        activeOpacity={activeOpacity}
        onPress={handlePress}
        {...props}
      />
    );
  },
);

DebouncedTouchable.displayName = 'DebouncedTouchable';

export default DebouncedTouchable;
