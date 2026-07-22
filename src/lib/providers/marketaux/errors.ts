export class MarketauxError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "MarketauxError";
  }
}

export function handleMarketauxError(error: unknown): never {
  if (error instanceof MarketauxError) {
    throw error;
  }
  if (error instanceof Error) {
    throw new MarketauxError(`Marketaux request failed: ${error.message}`);
  }
  throw new MarketauxError("Unknown Marketaux error");
}
