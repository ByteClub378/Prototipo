export type TopicId =
  | "fauna"
  | "flora"
  | "biomas"
  | "clima"
  | "estados-capitais"
  | "cultura"
  | "culinaria"
  | "festas-populares"
  | "historia"
  | "turismo";

export interface TopicResult {
  topicId: TopicId;
  correctAnswers: number;
  incorrectAnswers: number;
}

export function createTopicTracker() {
  const results = new Map<TopicId, TopicResult>();

  function record(topicId: TopicId, correct: boolean) {
    const current = results.get(topicId) ?? {
      topicId,
      correctAnswers: 0,
      incorrectAnswers: 0,
    };

    if (correct) current.correctAnswers += 1;
    else current.incorrectAnswers += 1;

    results.set(topicId, current);
  }

  return {
    record,
    reset() {
      results.clear();
    },
    toPayload(): TopicResult[] {
      return Array.from(results.values(), (result) => ({ ...result }));
    },
  };
}