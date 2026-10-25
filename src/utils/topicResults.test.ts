import { describe, expect, it } from "vitest";
import { createTopicTracker } from "./topicResults";

describe("createTopicTracker", () => {
  it("aggregates correct and incorrect answers by topic", () => {
    const tracker = createTopicTracker();

    tracker.record("fauna", true);
    tracker.record("fauna", false);
    tracker.record("flora", true);
    const payload = tracker.toPayload();
    tracker.record("fauna", true);

    expect(payload).toEqual([
      { topicId: "fauna", correctAnswers: 1, incorrectAnswers: 1 },
      { topicId: "flora", correctAnswers: 1, incorrectAnswers: 0 },
    ]);
    expect(tracker.toPayload()[0].correctAnswers).toBe(2);
  });

  it("clears results when reset", () => {
    const tracker = createTopicTracker();
    tracker.record("clima", false);

    tracker.reset();

    expect(tracker.toPayload()).toEqual([]);
  });
});