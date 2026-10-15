// hooks/use-tilt.ts
import {
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SPRING = { damping: 22, stiffness: 140, mass: 0.6 };

/**
 * Device-tilt input for parallax, normalised to -1…1 on each axis.
 *
 * Reads the rotation sensor through Reanimated (no extra package) and measures
 * tilt *relative to how the phone is being held*: the baseline slowly follows
 * the device, so any resting pose settles back to centre. On simulators or
 * devices without a sensor both axes stay at 0 and the UI simply sits still.
 *
 * If the parallax feels inverted on your device, flip the sign where you use it.
 */
export function useTilt(range = 0.3) {
  const sensor = useAnimatedSensor(SensorType.ROTATION, { interval: 'auto' });

  const primed = useSharedValue(false);
  const basePitch = useSharedValue(0);
  const baseRoll = useSharedValue(0);
  const rawX = useSharedValue(0);
  const rawY = useSharedValue(0);

  useAnimatedReaction(
    () => ({
      pitch: sensor.sensor?.value?.pitch ?? 0,
      roll: sensor.sensor?.value?.roll ?? 0,
    }),
    (cur) => {
      if (!primed.value) {
        basePitch.value = cur.pitch;
        baseRoll.value = cur.roll;
        primed.value = true;
        return;
      }
      basePitch.value += (cur.pitch - basePitch.value) * 0.005;
      baseRoll.value += (cur.roll - baseRoll.value) * 0.005;

      const x = (cur.roll - baseRoll.value) / range;
      const y = (cur.pitch - basePitch.value) / range;
      rawX.value = Math.max(-1, Math.min(1, x));
      rawY.value = Math.max(-1, Math.min(1, y));
    },
  );

  const x = useDerivedValue(() => withSpring(rawX.value, SPRING));
  const y = useDerivedValue(() => withSpring(rawY.value, SPRING));

  return { x, y };
}

export type Tilt = ReturnType<typeof useTilt>;