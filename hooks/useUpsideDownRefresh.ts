import { useEffect, useRef } from "react";
import * as ScreenOrientation from "expo-screen-orientation";

/**
 * Calls the provided callback when the device is rotated upside down (portrait-down).
 * Only triggers once per upside down event until orientation changes again.
 */
export function useUpsideDownRefresh(onRefresh: () => void) {
  const triggeredRef = useRef(false);

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        if (
          event.orientationInfo.orientation ===
            ScreenOrientation.Orientation.PORTRAIT_DOWN &&
          !triggeredRef.current
        ) {
          triggeredRef.current = true;
          onRefresh();
        }
        if (
          event.orientationInfo.orientation !==
          ScreenOrientation.Orientation.PORTRAIT_DOWN
        ) {
          triggeredRef.current = false;
        }
      }
    );
    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, [onRefresh]);
}
