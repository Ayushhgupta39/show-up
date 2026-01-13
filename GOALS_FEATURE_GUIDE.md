# Goals Feature - Complete Guide

The Goals system is now fully implemented! 🎯

## Features Overview

ShowUP now supports two types of goals:

### 1. Short-Term Goals (Checklist-Based)
- Perfect for weekly/monthly objectives
- Checklist of items to complete
- Progress bar shows completion percentage
- Auto-completes when all items are checked

### 2. Long-Term Goals (Calendar/Milestone-Based)
- Multi-month goals with date ranges
- Multiple milestones with specific dates
- Timeline visualization
- Progress tracking across milestones

## How to Test Goals

### Step 1: Start the Server

```bash
npm run dev
```

Navigate to http://localhost:3000

### Step 2: Create a Short-Term Goal

1. Log in to your account
2. Go to any group dashboard
3. Scroll down to the "Goals" section
4. Click "Add Goal"
5. Select the **"Short-Term"** tab
6. Fill in:
   - **Title**: Launch MVP
   - **Description**: Get the product ready for launch
   - **Checklist Items**:
     - Design landing page
     - Build authentication
     - Create database schema
     - Deploy to production
7. Click "Add Item" to add more items if needed
8. Click "Create Goal"

### Step 3: Complete Checklist Items

1. You'll see the goal card with a progress bar
2. Click checkboxes to mark items as complete
3. Watch the progress bar update in real-time
4. When all items are checked, the goal status changes to "Completed" with a green badge 🎉

### Step 4: Create a Long-Term Goal

1. Click "Add Goal" again
2. Select the **"Long-Term"** tab
3. Fill in:
   - **Title**: Master React
   - **Description**: Become proficient in React development
   - **Start Date**: Today
   - **End Date**: 6 months from now
   - **Milestones**:
     - [1 month] Complete React docs
     - [3 months] Build 3 projects
     - [6 months] Contribute to open source
4. Click "Add Milestone" to add more milestones
5. Click "Create Goal"

### Step 5: Track Long-Term Progress

1. View the long-term goal card with date range
2. Check off milestones as you complete them
3. Each milestone shows its target date
4. Progress bar tracks overall completion
5. Goal auto-completes when all milestones are done

### Step 6: Test Multi-User Interaction

1. Goals are visible to all group members
2. Only the goal owner can:
   - Check/uncheck items
   - Mark milestones complete
   - Delete the goal
3. Other members can view progress

## API Endpoints Created

### Goals
- `GET /api/groups/[groupId]/goals` - List all goals in group
- `POST /api/groups/[groupId]/goals` - Create new goal
- `GET /api/goals/[goalId]` - Get specific goal
- `PATCH /api/goals/[goalId]` - Update goal (items, milestones, status)
- `DELETE /api/goals/[goalId]` - Delete goal (owner only)

## Components Created

### UI Components
- **`CreateGoalDialog`** - Modal with tabs for short-term/long-term goals
  - Dynamic form based on goal type
  - Add/remove items or milestones
  - Date pickers for long-term goals

- **`ShortTermGoalCard`** - Checklist UI
  - Interactive checkboxes
  - Progress bar
  - Auto-completion detection
  - Delete button for owner

- **`LongTermGoalCard`** - Timeline UI
  - Date range display
  - Milestone list with dates
  - Progress tracking
  - Checkbox for each milestone

### Features
- ✅ Real-time progress calculation
- ✅ Auto-completion when all items/milestones done
- ✅ Owner-only editing (other members can view)
- ✅ Delete confirmation dialog
- ✅ Responsive mobile design
- ✅ Empty state with CTA

## Database Schema

### Goal Model

```prisma
model Goal {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  groupId     String   @db.ObjectId
  userId      String   @db.ObjectId
  type        String   // "short_term" or "long_term"
  title       String
  description String?

  // For short-term goals (checklist)
  items       Json?    // Array of {id: string, text: string, completed: boolean}

  // For long-term goals (calendar)
  startDate   DateTime?
  endDate     DateTime?
  milestones  Json?    // Array of {date: DateTime, text: string, completed: boolean}

  status      String   @default("active") // "active", "completed", "abandoned"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  group       Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Testing Scenarios

### ✅ Test 1: Create Short-Term Goal
1. Add goal with 5 checklist items
2. Verify progress shows "0/5 items"
3. Check one item → should show "1/5 items"
4. Check all items → goal status changes to "Completed"

### ✅ Test 2: Create Long-Term Goal
1. Add goal with 3 milestones over 3 months
2. Verify date range displays correctly
3. Check first milestone → progress updates
4. Check all milestones → goal completes

### ✅ Test 3: Multi-User Permissions
1. User A creates a goal
2. User B (in same group) can see the goal
3. User B cannot check items (checkboxes disabled)
4. User B cannot delete the goal (no delete button)

### ✅ Test 4: Goal Deletion
1. Create a goal
2. Click delete icon
3. Confirm deletion
4. Goal disappears from list

### ✅ Test 5: Mixed Goal Types
1. Create 2 short-term goals
2. Create 2 long-term goals
3. Both types display correctly in the same view
4. Progress bars work independently

### ✅ Test 6: Empty State
1. Navigate to group with no goals
2. See empty state message
3. Click "Add Goal" CTA
4. Create first goal
5. Empty state disappears

### ✅ Test 7: Validation
1. Try creating goal with empty title → should fail
2. Try creating short-term goal with no items → should fail
3. Try creating long-term goal with invalid date range → should fail

## UI/UX Features

### Visual Indicators
- 🟢 **Green badge** - Completed goals
- 🔵 **Blue badge** - Active goals with progress
- 📊 **Progress bar** - Visual completion tracking
- ✅ **Checkboxes** - Interactive item/milestone completion
- 📅 **Calendar icon** - Long-term goal dates
- 🗑️ **Trash icon** - Delete (owner only)

### Responsive Design
- Works on mobile, tablet, desktop
- Stacks items vertically on small screens
- Touch-friendly checkboxes
- Modal forms adapt to screen size

### Accessibility
- All checkboxes have labels
- Focus states for keyboard navigation
- Color-blind friendly indicators
- Clear error messages

## Integration with Daily Tasks

Goals and daily tasks work together:

- **Daily Tasks**: What you do each day
- **Short-Term Goals**: Weekly/monthly objectives
- **Long-Term Goals**: Multi-month ambitions

Example workflow:
1. Set long-term goal: "Master React in 6 months"
2. Break into short-term goals: "Complete React docs this month"
3. Create daily tasks: "Study React hooks - 1 hour"

## Performance Optimizations

- Goals loaded with group data (single query)
- Progress calculated client-side (no extra API calls)
- Optimistic UI updates (instant feedback)
- Efficient re-rendering (only affected components)

## Future Enhancements (Not Yet Implemented)

Potential additions for later:
- [ ] Recurring goals (weekly, monthly)
- [ ] Goal templates (common goal types)
- [ ] Goal categories/tags
- [ ] Goal reminders/notifications
- [ ] Analytics dashboard (goal completion rates)
- [ ] Goal sharing across groups
- [ ] Comments on goals
- [ ] Attach files to goals

## Troubleshooting

### Goals not showing up?
- Refresh the page
- Check that you're in a group (goals are group-specific)
- Verify you created the goal successfully

### Can't check items?
- You can only edit your own goals
- Other members can view but not edit

### Progress bar not updating?
- Refresh the page
- Check browser console for errors

### Delete button not visible?
- Only the goal owner can delete
- Check if you're logged in as the correct user

## Code Examples

### Creating a Short-Term Goal

```typescript
const payload = {
  title: "Launch MVP",
  description: "Get ready for launch",
  type: "short_term",
  items: [
    { id: "1", text: "Design landing page", completed: false },
    { id: "2", text: "Build auth", completed: false },
    { id: "3", text: "Deploy", completed: false },
  ],
}

const response = await fetch(`/api/groups/${groupId}/goals`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
```

### Creating a Long-Term Goal

```typescript
const payload = {
  title: "Master React",
  description: "Become proficient",
  type: "long_term",
  startDate: "2026-01-01T00:00:00.000Z",
  endDate: "2026-06-30T00:00:00.000Z",
  milestones: [
    { date: "2026-02-01T00:00:00.000Z", text: "Complete docs", completed: false },
    { date: "2026-04-01T00:00:00.000Z", text: "Build 3 projects", completed: false },
    { date: "2026-06-01T00:00:00.000Z", text: "Contribute to OSS", completed: false },
  ],
}
```

### Updating Goal Progress

```typescript
// Toggle item completion
const newItems = items.map((item) =>
  item.id === itemId ? { ...item, completed: !item.completed } : item
)

const response = await fetch(`/api/goals/${goalId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ items: newItems }),
})
```

## Summary

The Goals feature is **complete and fully functional**! 🎉

Key achievements:
- ✅ Two goal types (short-term and long-term)
- ✅ Interactive progress tracking
- ✅ Auto-completion detection
- ✅ Owner-only editing
- ✅ Beautiful, responsive UI
- ✅ Full API implementation
- ✅ Database integration

Test it out now with `npm run dev` and create your first goal!
