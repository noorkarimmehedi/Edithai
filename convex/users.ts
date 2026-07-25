import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to save a user's phone number and Composio ID
export const saveUser = mutation({
  args: {
    phoneNumber: v.string(),
    composioConnectionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user with this phone number already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();

    if (existingUser) {
      // Update the connection ID if the user already exists
      await ctx.db.patch(existingUser._id, {
        composioConnectionId: args.composioConnectionId,
      });
      return existingUser._id;
    }

    // Insert a new user if they don't exist
    return await ctx.db.insert("users", {
      phoneNumber: args.phoneNumber,
      composioConnectionId: args.composioConnectionId,
    });
  },
});

// Query to look up a connection ID by phone number
export const getConnectionId = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();
    
    return user ? user.composioConnectionId : null;
  },
});

export const addMessage = mutation({
  args: { phoneNumber: v.string(), role: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      phoneNumber: args.phoneNumber,
      role: args.role,
      content: args.content,
    });
  },
});

export const getMessages = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .order("desc")
      .take(10); // Keep last 10 messages for context window
    
    return msgs.reverse(); // Return in chronological order
  },
});
