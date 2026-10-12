//frontend\lib\__tests__\pinned-messages-store.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPins,
  isPinned,
  loadPins,
  togglePin,
} from "@/lib/pinned-messages-store";

const KEY = "lc.assistant.pins.v1";

describe("pinned-messages-store", () => {
  beforeEach(() => {
    window.localStorage.removeItem(KEY);
  });

  it("renvoie un tableau vide pour une conversation inconnue", () => {
    expect(loadPins("conv-x")).toEqual([]);
  });

  it("épingle un message (LIFO : le plus récent en tête)", () => {
    togglePin("conv-1", "m1");
    togglePin("conv-1", "m2");
    expect(loadPins("conv-1")).toEqual(["m2", "m1"]);
  });

  it("désépingle un message déjà épinglé", () => {
    togglePin("conv-1", "m1");
    togglePin("conv-1", "m2");
    togglePin("conv-1", "m1");
    expect(loadPins("conv-1")).toEqual(["m2"]);
  });

  it("isole les pins par conversation", () => {
    togglePin("conv-a", "mA");
    togglePin("conv-b", "mB");
    expect(loadPins("conv-a")).toEqual(["mA"]);
    expect(loadPins("conv-b")).toEqual(["mB"]);
  });

  it("isPinned renvoie vrai uniquement si le message est épinglé", () => {
    togglePin("conv-1", "m1");
    expect(isPinned("conv-1", "m1")).toBe(true);
    expect(isPinned("conv-1", "m2")).toBe(false);
  });

  it("clearPins vide une conversation sans toucher les autres", () => {
    togglePin("conv-1", "m1");
    togglePin("conv-2", "m2");
    clearPins("conv-1");
    expect(loadPins("conv-1")).toEqual([]);
    expect(loadPins("conv-2")).toEqual(["m2"]);
  });

  it("limite à 20 épingles par conversation", () => {
    for (let i = 0; i < 25; i++) togglePin("conv-1", `m${i}`);
    expect(loadPins("conv-1")).toHaveLength(20);
  });
});