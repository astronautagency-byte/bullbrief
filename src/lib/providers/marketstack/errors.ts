export class MarketstackError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "MarketstackError";
  }
}

export function handleMarketstackError(error: unknown): never {
  if (error instanceof MarketstackError) {
    throw error;
  }
  if (error instanceof Error) {
    throw new MarketstackError(`Marketstack request failed: ${error.message}`);
  }
  throw new MarketstackError("Unknown Marketstack error");
}
