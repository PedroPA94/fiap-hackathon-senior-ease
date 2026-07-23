import type { DateOnlyString, ISODateTimeString } from "../../domain/index.js";

export interface Clock {
  now(): ISODateTimeString;
  today(): DateOnlyString;
}
