import { test, expect } from "@playwright/test";
import * as T from "three";
import { createOpeningFormation } from "../src/freight/opening-formation";
import { disposeVehicle } from "../src/freight/vehicles";

test("four final destinations are bounded line geometry with no ground or point-cloud objects", () => {
  const box = new T.Box3(new T.Vector3(-7, -1, -2), new T.Vector3(7, 4, 2));
  const names = new Set<string>();
  for (const kind of ["services", "industries", "about", "quote"] as const) {
    const form = createOpeningFormation(kind, box);
    names.add(form.name);
    expect(form.root.children).toHaveLength(3);
    expect(form.root.children.some((child) => child instanceof T.Points)).toBe(
      false,
    );
    form.update(1, 0);
    expect(form.root.visible).toBe(true);
    expect(form.outline.length).toBeLessThan(2000);
    const bounds = new T.Box3().setFromPoints(form.outline);
    for (let i = 0; i < 200; i++) {
      const p = form.sample(i / 200);
      expect(p.toArray().every(Number.isFinite)).toBe(true);
      expect(bounds.clone().expandByScalar(0.001).containsPoint(p)).toBe(true);
    }
    expect(bounds.getSize(new T.Vector3()).length()).toBeLessThan(25);
    form.update(0, 0);
    expect(form.root.visible).toBe(false);
    disposeVehicle(form.root);
  }
  expect(names.size).toBe(4);
});
