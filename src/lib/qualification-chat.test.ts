import { describe, expect, it } from "vitest";
import { initialChatAnswers, getVisibleChatSteps, nextIncompleteStepIndex, type ChatStepId } from "./qualification-chat";

describe("qualification chat flow", () => {
  it("skips sponsor clearance questions when there is no previous sponsor", () => {
    const answers = { ...initialChatAnswers, hasPreviousSponsor: "no" as const };
    const steps = getVisibleChatSteps(answers).map((step) => step.id);

    expect(steps).not.toContain("hasSponsorClearance");
    expect(steps).not.toContain("canObtainSponsorClearance");
    expect(steps).toContain("passportValid");
  });

  it("asks if clearance can be obtained only after user says clearance is missing", () => {
    const before = getVisibleChatSteps({ ...initialChatAnswers, hasPreviousSponsor: "yes" }).map((step) => step.id);
    const after = getVisibleChatSteps({
      ...initialChatAnswers,
      hasPreviousSponsor: "yes",
      hasSponsorClearance: "no",
    }).map((step) => step.id);

    expect(before).toContain("hasSponsorClearance");
    expect(before).not.toContain("canObtainSponsorClearance");
    expect(after).toContain("canObtainSponsorClearance");
  });

  it("finds the first incomplete visible question", () => {
    const answers = { ...initialChatAnswers, name: "محمد", phone: "+218910000000" };
    const steps = getVisibleChatSteps(answers);
    const index = nextIncompleteStepIndex(answers, steps);

    expect(steps[index]?.id satisfies ChatStepId | undefined).toBe("city");
  });
});
