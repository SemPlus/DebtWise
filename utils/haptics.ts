
export const hapticFeedback = {
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]); // Short double pulse
    }
  },
  action: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15); // Single crisp pulse
    }
  },
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]); // Warning pulses
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100); // Single long pulse
    }
  }
};
