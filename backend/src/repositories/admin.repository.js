import { AggregateField } from "firebase-admin/firestore";
import { db } from "../database/firebase.js";
import { LEVELS, levelId } from "../database/catalog.js";

const value = (data, field) => data[field] ?? 0;

export class AdminRepository {
  async getOverview() {
    const [playersSnapshot, playersWhoPlayedSnapshot, attemptsSnapshot, passedSnapshot] = await Promise.all([
      db.collection("players").count().get(),
      db.collection("players").where("hasPlayed", "==", true).count().get(),
      db.collection("attempts").aggregate({
        total: AggregateField.count(),
        averageDurationSeconds: AggregateField.average("durationSeconds"),
        totalCorrectAnswers: AggregateField.sum("correctAnswers"),
        totalIncorrectAnswers: AggregateField.sum("incorrectAnswers"),
      }).get(),
      db.collection("attempts").where("passed", "==", true).count().get(),
    ]);

    const attempts = attemptsSnapshot.data();
    return {
      totalPlayers: playersSnapshot.data().count,
      playersWhoPlayed: playersWhoPlayedSnapshot.data().count,
      totalAttempts: value(attempts, "total"),
      passedAttempts: passedSnapshot.data().count,
      averageDurationSeconds: value(attempts, "averageDurationSeconds"),
      totalCorrectAnswers: value(attempts, "totalCorrectAnswers"),
      totalIncorrectAnswers: value(attempts, "totalIncorrectAnswers"),
    };
  }

  async getLevels() {
    return Promise.all(LEVELS.map(async (level) => {
      const query = db.collection("attempts").where("levelId", "==", levelId(level.regionId, level.levelNumber));
      const [allSnapshot, passedSnapshot] = await Promise.all([
        query.aggregate({
          total: AggregateField.count(),
          averageScore: AggregateField.average("score"),
          averageDurationSeconds: AggregateField.average("durationSeconds"),
          totalCorrectAnswers: AggregateField.sum("correctAnswers"),
          totalIncorrectAnswers: AggregateField.sum("incorrectAnswers"),
        }).get(),
        query.where("passed", "==", true).count().get(),
      ]);
      const data = allSnapshot.data();
      return {
        ...level,
        totalAttempts: value(data, "total"),
        passedAttempts: passedSnapshot.data().count,
        averageScore: value(data, "averageScore"),
        averageDurationSeconds: value(data, "averageDurationSeconds"),
        totalCorrectAnswers: value(data, "totalCorrectAnswers"),
        totalIncorrectAnswers: value(data, "totalIncorrectAnswers"),
      };
    }));
  }
}
