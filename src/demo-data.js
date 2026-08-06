(function attachTabVerdictDemo(root) {
  "use strict";

  const now = "2026-08-01T10:00:00.000Z";
  const products = [
    {
      id: "demo-nomad-air",
      title: "Nomad Air X",
      site: "Illustrative demo",
      image: "assets/demo/scooter-air.svg",
      brand: "Northstar",
      price: 729,
      currency: "EUR",
      rating: 4.6,
      reviewCount: 318,
      availability: "In stock",
      costs: { shipping: 0, tax: 0, fees: 0, taxMode: "fixed" },
      specs: { Range: "62 km", Weight: "23.8 kg", Power: "700 W", Warranty: "24 months" },
      sources: {
        price: { url: "", method: "demo", label: "Illustrative value" },
        rating: { url: "", method: "demo", label: "Illustrative value" },
        Range: { url: "", method: "demo", label: "Illustrative value" }
      },
      notes: "Balanced commuter with the lightest frame in this illustrative comparison.",
      createdAt: now,
      updatedAt: now,
      demo: true
    },
    {
      id: "demo-atlas-dual",
      title: "Atlas Dual 2",
      site: "Illustrative demo",
      image: "assets/demo/scooter-dual.svg",
      brand: "Kiln",
      price: 879,
      currency: "EUR",
      rating: 4.8,
      reviewCount: 204,
      availability: "In stock",
      costs: { shipping: 24.9, tax: 0, fees: 9.5, taxMode: "fixed" },
      specs: { Range: "78 km", Weight: "31.4 kg", Power: "1,800 W", Warranty: "18 months" },
      sources: {
        price: { url: "", method: "demo", label: "Illustrative value" },
        rating: { url: "", method: "demo", label: "Illustrative value" },
        Range: { url: "", method: "demo", label: "Illustrative value" }
      },
      notes: "Longest range and highest power, with a clear weight and cost penalty.",
      createdAt: now,
      updatedAt: now,
      demo: true
    },
    {
      id: "demo-metro-s",
      title: "Metro S",
      site: "Illustrative demo",
      image: "assets/demo/scooter-metro.svg",
      brand: "Plainworks",
      price: 599,
      currency: "EUR",
      rating: 4.3,
      reviewCount: 681,
      availability: "Ships in 3 days",
      costs: { shipping: 14.95, tax: 0, fees: 0, taxMode: "fixed" },
      specs: { Range: "48 km", Weight: "21.9 kg", Power: "500 W", Warranty: "24 months" },
      sources: {
        price: { url: "", method: "demo", label: "Illustrative value" },
        rating: { url: "", method: "demo", label: "Illustrative value" },
        Range: { url: "", method: "demo", label: "Illustrative value" }
      },
      notes: "Lowest landed cost and easiest to carry, but noticeably less range.",
      createdAt: now,
      updatedAt: now,
      demo: true
    }
  ];

  const criteria = [
    { id: "total-cost", label: "Total cost", field: "totalCost", direction: "min", weight: 25, unit: "currency", values: {} },
    {
      id: "demo-range",
      label: "Real-world range",
      field: "custom",
      direction: "max",
      weight: 45,
      unit: "km",
      values: { "demo-nomad-air": 62, "demo-atlas-dual": 78, "demo-metro-s": 48 }
    },
    {
      id: "demo-weight",
      label: "Carry weight",
      field: "custom",
      direction: "min",
      weight: 15,
      unit: "kg",
      values: { "demo-nomad-air": 23.8, "demo-atlas-dual": 31.4, "demo-metro-s": 21.9 }
    },
    {
      id: "demo-warranty",
      label: "Warranty",
      field: "custom",
      direction: "max",
      weight: 15,
      unit: "months",
      values: { "demo-nomad-air": 24, "demo-atlas-dual": 18, "demo-metro-s": 24 }
    }
  ];

  root.TabVerdictDemo = Object.freeze({ products, criteria });
})(globalThis);
