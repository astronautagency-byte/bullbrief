export interface PriceAlert {
  id: string;
  symbol: string;
  companyName: string;
  type: "above" | "below";
  targetPrice: number;
  currentPrice: number;
  triggered: boolean;
  createdAt: string;
}

const alerts = new Map<string, PriceAlert>();

export function getAlerts(): PriceAlert[] {
  return Array.from(alerts.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getAlertsForSymbol(symbol: string): PriceAlert[] {
  return getAlerts().filter((a) => a.symbol === symbol);
}

export function addAlert(
  symbol: string,
  companyName: string,
  type: "above" | "below",
  targetPrice: number,
  currentPrice: number
): PriceAlert {
  const id = `${symbol}-${type}-${targetPrice}-${Date.now()}`;
  const alert: PriceAlert = {
    id,
    symbol: symbol.toUpperCase(),
    companyName,
    type,
    targetPrice,
    currentPrice,
    triggered: false,
    createdAt: new Date().toISOString(),
  };
  alerts.set(id, alert);
  return alert;
}

export function removeAlert(id: string): boolean {
  return alerts.delete(id);
}

export function checkAlerts(
  symbol: string,
  currentPrice: number
): PriceAlert[] {
  const triggered: PriceAlert[] = [];
  for (const alert of alerts.values()) {
    if (alert.symbol !== symbol || alert.triggered) continue;
    const isTriggered =
      (alert.type === "above" && currentPrice >= alert.targetPrice) ||
      (alert.type === "below" && currentPrice <= alert.targetPrice);
    if (isTriggered) {
      alert.triggered = true;
      alert.currentPrice = currentPrice;
      triggered.push(alert);
    }
  }
  return triggered;
}
