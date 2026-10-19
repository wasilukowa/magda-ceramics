import { describe, expect, it } from "vitest";
import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("keeps the customer's text from becoming code in an e-mail", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')"> & co`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; co"
    );
  });
});
