import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    phoneNumber: v.string(), // E.g., "+8801967803596"
    composioConnectionId: v.string(), // E.g., "ac_xyz123"
  }).index("by_phoneNumber", ["phoneNumber"]),

  messages: defineTable({
    phoneNumber: v.string(),
    role: v.string(), // "user" or "assistant"
    content: v.string(),
  }).index("by_phoneNumber", ["phoneNumber"]),
});
