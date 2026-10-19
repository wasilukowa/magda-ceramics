import { describe, expect, it } from "vitest";
import { parseStoredIds } from "./wishlist";

describe("parseStoredIds", () => {
  it("keeps whole positive numbers, each once", () => {
    expect(parseStoredIds(JSON.stringify([3, "4", 3, -1, 0, 2.5, null, 7]))).toEqual([3, 7]);
  });

  it("treats anything other than a list as no favourites", () => {
    expect(parseStoredIds(JSON.stringify({ 3: true }))).toEqual([]);
  });
});
