import { describe, it, expect } from "vitest";
import { parseCSV, toKind, toNumber, splitLine } from "./importCsv";

describe("splitLine", () => {
  it("splits on commas and trims", () => {
    expect(splitLine("a, b ,c")).toEqual(["a", "b", "c"]);
  });
  it("respects quoted fields containing commas", () => {
    expect(splitLine('"Smith, John",1000')).toEqual(["Smith, John", "1000"]);
  });
});

describe("toNumber", () => {
  it("strips currency symbols and thousands separators", () => {
    expect(toNumber("AED 5,200")).toBe(5200);
    expect(toNumber("$1,234.50")).toBe(1234.5);
  });
  it("returns null for empty / non-numeric", () => {
    expect(toNumber("")).toBeNull();
    expect(toNumber("abc")).toBeNull();
  });
  it("rejects malformed numbers instead of reading a prefix", () => {
    // parseFloat("40-5") is 40; the forms rely on this returning null.
    expect(toNumber("40-5")).toBeNull();
    expect(toNumber("1.2.3")).toBeNull();
  });
});

describe("toKind", () => {
  it("matches exact values and labels", () => {
    expect(toKind("credit_card")).toBe("credit_card");
    expect(toKind("Credit card")).toBe("credit_card");
  });
  it("fuzzy-maps common terms", () => {
    expect(toKind("Visa")).toBe("credit_card");
    expect(toKind("car finance")).toBe("auto_loan");
    expect(toKind("Tabby")).toBe("bnpl");
    expect(toKind("home loan")).toBe("mortgage");
    expect(toKind("personal")).toBe("personal_loan");
  });
  it("falls back to other", () => {
    expect(toKind("whatever")).toBe("other");
  });
});

describe("parseCSV", () => {
  it("parses a header CSV and maps columns by alias (any order)", () => {
    const rows = parseCSV(
      "issuer,balance,apr,name,min payment\nChase,5200,22.9,Sapphire,140",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].error).toBeUndefined();
    expect(rows[0].input).toMatchObject({
      name: "Sapphire",
      issuer: "Chase",
      balance: 5200,
      apr: 22.9,
      minPayment: 140,
    });
  });

  it("falls back to default column order without a header", () => {
    const rows = parseCSV("Sapphire,5200,22.9,140,credit card,Chase,8000,15");
    expect(rows[0].error).toBeUndefined();
    expect(rows[0].input).toMatchObject({
      name: "Sapphire",
      balance: 5200,
      apr: 22.9,
      minPayment: 140,
      kind: "credit_card",
      issuer: "Chase",
      creditLimit: 8000,
      dueDay: 15,
    });
  });

  it("flags rows missing a name or with a non-positive balance", () => {
    const rows = parseCSV("name,balance\n,1000\nCard,0\nGood,500");
    expect(rows[0].error).toBe("Missing name");
    expect(rows[1].error).toBe("Invalid balance");
    expect(rows[2].error).toBeUndefined();
  });

  it("ignores an out-of-range due day and negative rates", () => {
    const rows = parseCSV("name,balance,apr,due day\nX,1000,-5,45");
    expect(rows[0].input.dueDay).toBeNull();
    expect(rows[0].input.apr).toBe(0);
  });

  it("handles currency-formatted numbers", () => {
    const rows = parseCSV("name,balance\nX,\"AED 12,500\"");
    expect(rows[0].input.balance).toBe(12500);
  });
});
