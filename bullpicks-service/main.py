import datetime
import time
import os
from typing import Optional
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import mstarpy as ms

app = FastAPI(title="Bull Picks API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache: { key: (timestamp, data) }
CACHE: dict[str, tuple[float, dict | list]] = {}
CACHE_TTL = 3600  # 1 hour

# Global session - initialized on first request
_session: Optional[ms.MorningstarSession] = None


def get_session() -> ms.MorningstarSession:
    global _session
    if _session is None:
        _session = ms.MorningstarSession()
    return _session


def cache_get(key: str) -> Optional[dict | list]:
    if key in CACHE:
        ts, data = CACHE[key]
        if time.time() - ts < CACHE_TTL:
            return data
        del CACHE[key]
    return None


def cache_set(key: str, data: dict | list):
    CACHE[key] = (time.time(), data)


@app.get("/api/stock/{symbol}")
async def get_stock(symbol: str):
    """Get stock fundamentals, valuation, and star rating."""
    cache_key = f"stock:{symbol}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    try:
        session = get_session()
        stock = ms.Stock(symbol, session=session)

        # Get historical price for current data
        end_date = datetime.datetime.today()
        start_date = end_date - datetime.timedelta(days=5)
        historical = stock.historical(start_date, end_date)

        current_price = None
        if historical:
            current_price = historical[-1].get("close")

        # Get key stats / valuation
        result = {
            "symbol": symbol.upper(),
            "price": current_price,
            "historical": historical[-30:] if historical else [],
        }

        cache_set(cache_key, result)
        return result

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch stock data: {str(e)}")


@app.get("/api/stock/{symbol}/financials")
async def get_stock_financials(symbol: str):
    """Get income statement, balance sheet, cash flow."""
    cache_key = f"financials:{symbol}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    try:
        session = get_session()
        stock = ms.Stock(symbol, session=session)

        income = None
        balance = None
        cashflow = None

        try:
            income = stock.incomeStatement()
        except Exception:
            pass

        try:
            balance = stock.balanceSheet()
        except Exception:
            pass

        try:
            cashflow = stock.cashFlow()
        except Exception:
            pass

        result = {
            "symbol": symbol.upper(),
            "incomeStatement": income,
            "balanceSheet": balance,
            "cashFlow": cashflow,
        }

        cache_set(cache_key, result)
        return result

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch financials: {str(e)}")


@app.get("/api/compare")
async def compare_stocks(symbols: str = Query(..., description="Comma-separated symbols")):
    """Compare multiple stocks side by side."""
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        raise HTTPException(status_code=400, detail="No symbols provided")
    if len(symbol_list) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 symbols for comparison")

    cache_key = f"compare:{','.join(symbol_list)}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    session = get_session()
    end_date = datetime.datetime.today()
    start_date = end_date - datetime.timedelta(days=30)

    results = []
    for sym in symbol_list:
        try:
            stock = ms.Stock(sym, session=session)
            historical = stock.historical(start_date, end_date)
            current_price = historical[-1].get("close") if historical else None
            prev_close = historical[-2].get("close") if historical and len(historical) > 1 else None

            change = None
            change_pct = None
            if current_price and prev_close:
                change = current_price - prev_close
                change_pct = (change / prev_close) * 100

            results.append({
                "symbol": sym,
                "price": current_price,
                "change": round(change, 2) if change else None,
                "changePercent": round(change_pct, 2) if change_pct else None,
                "recentPrices": [h.get("close") for h in (historical[-20:] if historical else [])],
            })
        except Exception as e:
            results.append({
                "symbol": sym,
                "error": str(e),
            })

    cache_set(cache_key, results)
    return results


@app.get("/api/screener")
async def screen_stocks(
    query: str = Query("", description="Search by name or ticker"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    pe_max: Optional[float] = Query(None, alias="peMax", description="Max P/E ratio"),
    pe_min: Optional[float] = Query(None, alias="peMin", description="Min P/E ratio"),
    market_cap_min: Optional[str] = Query(None, alias="marketCapMin", description="Min market cap"),
    star_min: Optional[int] = Query(None, alias="starMin", description="Min Morningstar rating (1-5)"),
    investment_type: str = Query("EQ", alias="investmentType", description="EQ for stocks"),
):
    """Screen stocks using Morningstar's screener."""
    cache_key = f"screener:{query}:{sector}:{pe_max}:{pe_min}:{market_cap_min}:{star_min}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    try:
        session = get_session()

        filters = {"investmentType": investment_type}
        if sector:
            filters["sector"] = sector
        if pe_max is not None:
            filters["priceToEarnings[trailing]"] = ("<", pe_max)
        if pe_min is not None:
            filters["priceToEarnings[trailing]"] = (">", pe_min)

        fields = ["name", "isin", "priceToEarnings", "sector", "marketCap", "morningstarOverallRating"]

        results = session.screener_universe(
            query or "a",
            language="en",
            field=fields,
            filters=filters,
        )

        # Filter by star rating if specified
        if star_min is not None and results:
            results = [
                r for r in results
                if r.get("fields", {}).get("morningstarOverallRating", {}).get("value", 0) >= star_min
            ]

        cache_set(cache_key, results)
        return results

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Screener failed: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok", "cache_size": len(CACHE)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
