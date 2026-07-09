import type { DateOnlyString, ISODateTimeString } from "../../domain";

export interface Clock {
  now(): ISODateTimeString;
  today(): DateOnlyString;
}
