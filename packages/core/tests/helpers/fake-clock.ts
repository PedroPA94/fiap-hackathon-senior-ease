import type { Clock } from "../../src/application";
import type { DateOnlyString, ISODateTimeString } from "../../src/domain";

export class FakeClock implements Clock {
  constructor(
    private readonly currentDateTime: ISODateTimeString = "2026-07-09T12:00:00.000Z",
    private readonly currentDate: DateOnlyString = "2026-07-09",
  ) {}

  now(): ISODateTimeString {
    return this.currentDateTime;
  }

  today(): DateOnlyString {
    return this.currentDate;
  }
}
