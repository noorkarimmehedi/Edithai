# Edith Task Automation — Design Document

**Date:** 2026-08-06
**Status:** Approved
**Skill:** office-hours → grill-with-docs

---

## Core Concept

**Ambient task execution** — talk to Edith, tasks get done. Not a reminder app. A general-purpose assistant that executes across your tools.

## Problem Statement

Individual professionals waste time context-switching between email, calendar, and project tools. Existing voice assistants (Siri, Alexa, ChatGPT) are free but lack deep integrations and cross-app orchestration.

## Solution

Edith is a voice-first AI assistant that:
1. Understands natural language commands
2. Routes to the right Composio integrations
3. Executes tasks across multiple apps
4. Provides real-time status and confirmation
5. Learns from user behavior to suggest automations

---

## Architecture Decisions

### Task Types
- **Scope:** Any Composio integration — not just reminders
- **Examples:** "Send email to John about the proposal," "Create Linear ticket for bug report," "Summarize today's Slack messages"
- **Rationale:** Differentiates from free assistants that only handle basic tasks

### Task Creation
- **Channels:** Voice (WebRTC) + iMessage
- **Rationale:** Voice for hands-free, iMessage for accessibility (no app install)

### Task Storage
- **Database:** Convex (extend existing schema)
- **Rationale:** Already using Convex for users/messages — consistency

### Confirmation Flow
- **Pattern:** Confirmation + options
- **Example:** "Got it. Want me to also prep John's contact info before the call?"
- **Rationale:** Builds trust while suggesting value-add actions

### Integrations (Launch)
1. **Gmail** — email read/send/search
2. **Google Calendar** — scheduling/events
3. **Slack** — team communication
4. **Notion** — knowledge management
5. **Linear** — project management
- **Rationale:** Top integrations for individual professionals based on Composio research

### AI Routing
- **Mode:** Full autonomy
- **Behavior:** Edith decides which tools to use based on intent
- **Example:** "Prepare for my meeting" → pulls emails, calendar, contacts
- **Rationale:** Differentiates from explicit-command-only assistants

### Execution Model
- **Max time:** 30 seconds
- **Feedback:** Real-time status updates
- **Rationale:** Fast enough for conversational UX, long enough for multi-step

### Error Handling
- **Pattern:** Error + suggestion
- **Example:** "Gmail auth expired. Reconnect here: [link]"
- **Rationale:** Helpful, not just apologetic

### Transparency
- **Mode:** Real-time status
- **Example:** "Sending email to John... done."
- **Rationale:** User stays informed without being overwhelmed

### Safety Layer
- **Rule:** Always ask before high-risk actions
- **Examples:** Send email, delete item, modify calendar
- **Rationale:** Builds trust, prevents mistakes

### Customization
- **Level:** Advanced config
- **Features:** Custom commands, workflows, integration settings
- **Rationale:** Power users want control

### Learning
- **Mode:** Full AI adaptation
- **Behaviors:** Learns常用 contacts, times, patterns; suggests automations
- **Rationale:** Gets smarter over time, increases stickiness

---

## Pricing Structure

| Tier | Price | Includes |
|------|-------|----------|
| **Basic** | TBD | All integrations, 100 tasks/month |
| **Pro** | TBD | Unlimited tasks, priority execution, advanced config |
| **Enterprise** | TBD | SSO, admin dashboard, custom integrations, white-label |

**Model:** Tiered unlimited (not per-task)
**Rationale:** Predictable for users, simple to understand

---

## Key Differentiators

1. **Voice-first design** — feels like talking to a person, not typing to a bot
2. **iMessage integration** — works on any phone, no app install required
3. **Full orchestration** — multi-app workflows (not just single-app tasks)
4. **AI adaptation** — learns patterns, suggests automations
5. **Safe autonomy** — full power with confirmation gates for trust

---

## Competitive Landscape

| Competitor | Weakness | Edith's Advantage |
|------------|----------|-------------------|
| Siri/Alexa | Poor cross-app integration | Deep Composio integrations |
| ChatGPT | No real-time execution | Actually does the task, not just describes it |
| Zapier | Human-configured, not AI-routed | Natural language, AI decides tools |
| Superhuman | Email only | Email + Calendar + Tasks + Projects |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Composio dependency | High | Abstract Composio layer, monitor alternatives |
| 30s timeout too short | Medium | Configurable per task type |
| Full autonomy scares users | Medium | Conservative defaults, easy to adjust |
| Learning feels creepy | Low | Transparent about what's learned, easy to reset |

---

## Next Steps

1. Validate demand: Would 1-5 users pay $20/month for task automation alone?
2. Build MVP: Gmail + Calendar + basic task creation
3. Test with existing users
4. Add Slack + Notion + Linear based on feedback
5. Launch pricing tiers

---

## Decisions Made

- Task types: Any Composio integration
- Creation: Voice + iMessage
- Storage: Convex
- Confirmation: Confirmation + options
- Integrations: Gmail, Calendar, Slack, Notion, Linear
- Routing: Full autonomy
- Execution: <30s
- Errors: Error + suggestion
- Transparency: Real-time status
- Safety: Always ask for high-risk
- Customization: Advanced config
- Learning: Full AI adaptation
- Pricing: Tiered unlimited
