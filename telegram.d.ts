declare global {
  interface Window {
    Telegram: {
      WebApp: {
        onEvent: (event: string, callback: () => void) => void;
        close: () => void;
        ready: () => void;
        [key: string]: any; // For other untyped properties/methods
      };
    };
  }
}

export {};