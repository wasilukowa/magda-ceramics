import { NbpRate, RawNbpRates } from "@/contracts/server/exchangeRate";
import { isCorrectNumber, isString } from "@/utility";

// NBP oddaje kursy z zakresu dni od najstarszego — liczy się ostatni.
export function prepareLastNbpRate(raw: RawNbpRates): NbpRate | null {
  const last = raw.rates?.at(-1);
  if (!last || !isCorrectNumber(last.mid) || last.mid <= 0) return null;
  if (!isString(last.effectiveDate) || !isString(last.no)) return null;
  return { mid: last.mid, effectiveDate: last.effectiveDate, table: last.no };
}
