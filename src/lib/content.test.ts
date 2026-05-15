import { describe, expect, it } from "vitest";
import { contact, sectors, services, workflow } from "./content";

describe("LSR source content", () => {
  it("uses the PDF-approved contact details", () => {
    expect(contact.email).toBe("LIBYANSAFERESIDENCE@OUTLOOK.COM");
    expect(contact.phones).toContain("+218****3134");
    expect(contact.phones).toContain("+218****0212");
  });

  it("covers the official service and sector structure", () => {
    expect(services).toHaveLength(6);
    expect(sectors).toHaveLength(7);
    expect(workflow[0]).toContain("دراسة احتياجات");
  });
});
