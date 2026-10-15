import { test, expect } from "@playwright/test";
import * as T from "three";
import { createOpeningFormation } from "../src/freight/opening-formation";
import { disposeVehicle } from "../src/freight/vehicles";
test("geographic destinations remain bounded and transport markers follow routes", () => {
  const bounds = new T.Box3(new T.Vector3(-7, -1, -2), new T.Vector3(7, 4, 2));
  for (const kind of ["services", "industries", "about", "quote"] as const) {
    const form = createOpeningFormation(kind, bounds, new T.Texture());
    form.update(1, 0);
    let dots = 0;
    form.root.traverse((o) => {
      if (o instanceof T.Points) {
        dots++;
        expect(o.geometry.getAttribute("aEarthUV").count).toBe(16000);
      }
    });
    expect(dots).toBe(1);
    const box = new T.Box3().setFromPoints(form.outline);
    for (let i = 0; i < 100; i++) {
      const point = form.sample(i / 100);
      expect(point.toArray().every(Number.isFinite)).toBe(true);
      expect(box.containsPoint(point)).toBe(true);
    }
    const before = form.root.children[0].children
      .filter((o) => o instanceof T.Group)
      .map((o) => o.position.clone());
    form.update(1, 3);
    const after = form.root.children[0].children.filter(
      (o) => o instanceof T.Group,
    );
    expect(after.length).toBeGreaterThan(0);
    after.forEach((o, i) =>
      expect(o.position.distanceTo(before[i])).toBeGreaterThan(0.01),
    );
    form.update(0, 3);
    expect(form.root.visible).toBe(false);
    disposeVehicle(form.root);
  }
});
