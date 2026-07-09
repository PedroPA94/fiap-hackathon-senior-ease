import { describe, expect, it } from "vitest";

import { CreateActivityUseCase } from "../../../src/application";
import { DomainError } from "../../../src/domain";
import { FakeClock } from "../../helpers/fake-clock";
import { InMemoryActivityRepository } from "../../helpers/in-memory-activity-repository";
import { SequentialIdGenerator } from "../../helpers/sequential-id-generator";

function makeUseCase() {
  const repository = new InMemoryActivityRepository();
  const idGenerator = new SequentialIdGenerator();
  const clock = new FakeClock();
  const useCase = new CreateActivityUseCase(repository, idGenerator, clock);

  return { repository, useCase };
}

describe("CreateActivityUseCase", () => {
  it("creates and persists an activity", async () => {
    const { repository, useCase } = makeUseCase();

    const activity = await useCase.execute({
      userId: "user-1",
      title: "Tomar remédio",
      description: "Após o almoço",
      date: "2026-07-09",
      time: "12:30",
      steps: ["Pegar o remédio", "Beber água"],
    });

    await expect(repository.findById(activity.id)).resolves.toBe(activity);
  });

  it("uses the first generated id as activity id", async () => {
    const { useCase } = makeUseCase();

    const activity = await useCase.execute({
      userId: "user-1",
      title: "Tomar remédio",
      date: "2026-07-09",
      steps: ["Pegar o remédio"],
    });

    expect(activity.id).toBe("id-1");
  });

  it("uses the next generated ids as step ids", async () => {
    const { useCase } = makeUseCase();

    const activity = await useCase.execute({
      userId: "user-1",
      title: "Tomar remédio",
      date: "2026-07-09",
      steps: ["Pegar o remédio", "Beber água"],
    });

    expect(activity.steps.map((step) => step.id)).toEqual(["id-2", "id-3"]);
  });

  it("sets createdAt and updatedAt with clock.now()", async () => {
    const { useCase } = makeUseCase();

    const activity = await useCase.execute({
      userId: "user-1",
      title: "Tomar remédio",
      date: "2026-07-09",
      steps: ["Pegar o remédio"],
    });

    expect(activity.createdAt).toBe("2026-07-09T12:00:00.000Z");
    expect(activity.updatedAt).toBe("2026-07-09T12:00:00.000Z");
  });

  it("sets step order from the input array position", async () => {
    const { useCase } = makeUseCase();

    const activity = await useCase.execute({
      userId: "user-1",
      title: "Tomar remédio",
      date: "2026-07-09",
      steps: ["Pegar o remédio", "Beber água"],
    });

    expect(activity.steps.map((step) => step.order)).toEqual([1, 2]);
  });

  it("normalizes title and descriptions through the domain", async () => {
    const { useCase } = makeUseCase();

    const activity = await useCase.execute({
      userId: "user-1",
      title: "  Tomar remédio  ",
      description: "  Após o almoço  ",
      date: "2026-07-09",
      steps: ["  Pegar o remédio  ", "  Beber água  "],
    });

    expect(activity.title).toBe("Tomar remédio");
    expect(activity.description).toBe("Após o almoço");
    expect(activity.steps.map((step) => step.description)).toEqual([
      "Pegar o remédio",
      "Beber água",
    ]);
  });

  it("propagates DomainError for invalid input", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        userId: "user-1",
        title: "   ",
        date: "2026-07-09",
        steps: ["Pegar o remédio"],
      }),
    ).rejects.toThrow(DomainError);
    await expect(
      useCase.execute({
        userId: "user-1",
        title: "   ",
        date: "2026-07-09",
        steps: ["Pegar o remédio"],
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "ACTIVITY_TITLE_REQUIRED" }),
    );
  });
});
