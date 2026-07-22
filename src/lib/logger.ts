export const logger = {
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[BullBrief]", ...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn("[BullBrief]", ...args);
  },
  error: (...args: any[]) => {
    console.error("[BullBrief]", ...args);
  },
};
