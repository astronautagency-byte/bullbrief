import { NextResponse } from "next/server";
import { getAlerts, addAlert, checkAlerts } from "@/lib/alerts-store";
import { getLatestPrices } from "@/lib/providers/marketstack/client";

export async function GET() {
  const alerts = getAlerts();

  try {
    const symbols = [...new Set(alerts.map((a) => a.symbol))];
    if (symbols.length > 0) {
      const quotes = await getLatestPrices(symbols);
      const priceMap = new Map(quotes.map((q) => [q.symbol, q.price ?? 0]));

      for (const alert of alerts) {
        const price = priceMap.get(alert.symbol);
        if (price) {
          alert.currentPrice = price;
          const triggered = checkAlerts(alert.symbol, price);
          if (triggered.length > 0) {
            alert.triggered = true;
          }
        }
      }
    }
  } catch {}

  return NextResponse.json({ data: alerts });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { symbol, companyName, type, targetPrice } = body;

  if (!symbol || !type || targetPrice == null) {
    return NextResponse.json(
      { error: "Missing symbol, type, or targetPrice" },
      { status: 400 }
    );
  }

  if (type !== "above" && type !== "below") {
    return NextResponse.json(
      { error: "type must be 'above' or 'below'" },
      { status: 400 }
    );
  }

  let currentPrice = 0;
  try {
    const quotes = await getLatestPrices([symbol]);
    if (quotes.length > 0) currentPrice = quotes[0].price ?? 0;
  } catch {}

  const alert = addAlert(
    symbol.toUpperCase(),
    companyName || symbol,
    type,
    Number(targetPrice),
    currentPrice
  );

  return NextResponse.json({ data: alert });
}
