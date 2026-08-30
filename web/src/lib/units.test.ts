import { describe, expect, it } from "vitest";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
  formatSpeed,
  isPaceSport,
  metersToDistance,
  metersToElevation,
} from "./units";

describe("metersToDistance", () => {
  it("converts to km for metric", () => {
    expect(metersToDistance(5000, "metric")).toBeCloseTo(5, 5);
  });

  it("converts to miles for imperial", () => {
    expect(metersToDistance(1609.344, "imperial")).toBeCloseTo(1, 5);
  });
});

describe("metersToElevation", () => {
  it("passes through meters for metric", () => {
    expect(metersToElevation(100, "metric")).toBe(100);
  });

  it("converts to feet for imperial", () => {
    expect(metersToElevation(1, "imperial")).toBeCloseTo(3.28084, 5);
  });
});

describe("formatDistance", () => {
  it("formats with the unit label", () => {
    expect(formatDistance(10_000, "metric")).toBe("10.00 km");
    expect(formatDistance(1609.344, "imperial")).toBe("1.00 mi");
  });
});

describe("formatElevation", () => {
  it("rounds to the nearest whole unit", () => {
    expect(formatElevation(100.6, "metric")).toBe("101 m");
    expect(formatElevation(1, "imperial")).toBe("3 ft");
  });
});

describe("formatDuration", () => {
  it("formats under an hour as m:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(59)).toBe("0:59");
  });

  it("formats an hour or more as h:mm:ss", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("clamps negative durations to zero", () => {
    expect(formatDuration(-5)).toBe("0:00");
  });
});

describe("formatPace", () => {
  it("computes min:sec per km for a 5:00/km pace", () => {
    // 5km in 25 minutes = 5:00/km
    expect(formatPace(5000, 25 * 60, "metric")).toBe("5:00 /km");
  });

  it("returns -- for zero distance", () => {
    expect(formatPace(0, 100, "metric")).toBe("--");
  });
});

describe("formatSpeed", () => {
  it("computes km/h", () => {
    // 10km in 30 minutes = 20 km/h
    expect(formatSpeed(10_000, 30 * 60, "metric")).toBe("20.0 km/h");
  });

  it("returns -- for zero elapsed time", () => {
    expect(formatSpeed(1000, 0, "metric")).toBe("--");
  });
});

describe("isPaceSport", () => {
  it("treats running and hiking as pace sports", () => {
    expect(isPaceSport("run")).toBe(true);
    expect(isPaceSport("hike")).toBe(true);
  });

  it("treats cycling as a speed sport", () => {
    expect(isPaceSport("ride")).toBe(false);
  });
});
