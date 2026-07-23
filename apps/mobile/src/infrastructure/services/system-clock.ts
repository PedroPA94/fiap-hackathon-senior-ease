import type {
  Clock,
  DateOnlyString,
  ISODateTimeString,
} from "@senior-ease/core";

export class SystemClock implements Clock {
  now(): ISODateTimeString {
    return new Date().toISOString();
  }

  today(): DateOnlyString {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}
