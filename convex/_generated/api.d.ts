/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as centerSettings from "../centerSettings.js";
import type * as grades from "../grades.js";
import type * as notifications from "../notifications.js";
import type * as operatingDays from "../operatingDays.js";
import type * as overrides from "../overrides.js";
import type * as rooms from "../rooms.js";
import type * as schedule from "../schedule.js";
import type * as subjects from "../subjects.js";
import type * as teachers from "../teachers.js";
import type * as timeSlots from "../timeSlots.js";
import type * as timetable from "../timetable.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  centerSettings: typeof centerSettings;
  grades: typeof grades;
  notifications: typeof notifications;
  operatingDays: typeof operatingDays;
  overrides: typeof overrides;
  rooms: typeof rooms;
  schedule: typeof schedule;
  subjects: typeof subjects;
  teachers: typeof teachers;
  timeSlots: typeof timeSlots;
  timetable: typeof timetable;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
