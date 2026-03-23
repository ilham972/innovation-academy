import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  grades: defineTable({
    name: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
  }),

  subjects: defineTable({
    name: v.string(),
    color: v.string(),
    isActive: v.boolean(),
  }),

  teachers: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    subjects: v.array(v.id("subjects")),
    canViewFullTimetable: v.boolean(),
    isActive: v.boolean(),
    clerkUserId: v.optional(v.string()),
  }),

  rooms: defineTable({
    name: v.string(),
    capacity: v.optional(v.number()),
    isActive: v.boolean(),
  }),

  timeSlots: defineTable({
    dayOfWeek: v.number(),
    slotIndex: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    label: v.optional(v.string()),
  }).index("by_day", ["dayOfWeek"]),

  operatingDays: defineTable({
    dayOfWeek: v.number(),
    isActive: v.boolean(),
  }),

  timetableEntries: defineTable({
    dayOfWeek: v.number(),
    timeSlotId: v.id("timeSlots"),
    gradeId: v.id("grades"),
    subjectId: v.id("subjects"),
    teacherId: v.id("teachers"),
    roomId: v.id("rooms"),
    notes: v.optional(v.string()),
  })
    .index("by_day", ["dayOfWeek"])
    .index("by_teacher", ["teacherId"])
    .index("by_room", ["roomId"])
    .index("by_grade", ["gradeId"]),

  scheduleOverrides: defineTable({
    timetableEntryId: v.id("timetableEntries"),
    date: v.string(),
    type: v.string(),
    substituteTeacherId: v.optional(v.id("teachers")),
    reason: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_entry", ["timetableEntryId"]),

  notifications: defineTable({
    recipientTeacherId: v.id("teachers"),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    isRead: v.boolean(),
    relatedDate: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_teacher", ["recipientTeacherId"])
    .index("by_teacher_unread", ["recipientTeacherId", "isRead"]),

  users: defineTable({
    clerkUserId: v.string(),
    username: v.optional(v.string()),
    role: v.optional(v.string()),
    teacherId: v.optional(v.id("teachers")),
    isApproved: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_approved", ["isApproved"]),

  centerSettings: defineTable({
    centerName: v.string(),
    defaultSlotDuration: v.number(),
  }),
});
