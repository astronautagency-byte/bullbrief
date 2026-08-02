export function legacySymbolsMissingFromAccount(
  accountSymbols: string[],
  legacySymbols: string[]
): string[] {
  const account = new Set(accountSymbols.map((symbol) => symbol.trim().toUpperCase()));
  return Array.from(
    new Set(
      legacySymbols
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean)
    )
  ).filter((symbol) => !account.has(symbol));
}
