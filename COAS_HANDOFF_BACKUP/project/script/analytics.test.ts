import { test } from "node:test";
import assert from "node:assert/strict";
import { trackEvent } from "../client/src/lib/analytics";

test("analytics is safe and forwards only the supplied event data", async () => {
  const originalWindow = globalThis.window;
  try {
    Reflect.deleteProperty(globalThis, "window");
    assert.doesNotThrow(() => trackEvent("search_submitted"));

    globalThis.window = {} as Window & typeof globalThis;
    assert.doesNotThrow(() => trackEvent("search_submitted"));

    const calls: unknown[][] = [];
    window.umami = {
      track: (...args) => { calls.push(args); },
    };
    const data = { product_id: "dp-60-wide", location: "new_products" };
    trackEvent("product_selected", data);
    assert.deepEqual(calls, [["product_selected", data]]);

    window.umami.track = () => { throw new Error("Tracker unavailable"); };
    assert.doesNotThrow(() => trackEvent("contact_clicked", { method: "phone" }));

    window.umami.track = () => Promise.reject(new Error("Request failed"));
    assert.doesNotThrow(() => trackEvent("search_completed", { result_count: 0 }));
    // An unhandled rejection would fail the test.
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    if (originalWindow === undefined) Reflect.deleteProperty(globalThis, "window");
    else globalThis.window = originalWindow;
  }
});