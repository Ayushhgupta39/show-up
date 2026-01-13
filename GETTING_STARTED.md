# ShowUP - Getting Started Guide

ShowUP is now fully implemented and ready to test! 🎉

## What's Been Built

### ✅ Complete Features

1. **Authentication System**
   - Signup with email, password, and automatic timezone detection
   - Login with NextAuth.js v5
   - Protected routes

2. **Group Management**
   - Create groups
   - Admin/owner roles
   - Group dashboard with stats

3. **Daily Tasks** (Core Feature)
   - **ONE task per user per group per day** (strictly enforced)
   - Timezone-aware date handling
   - Status tracking: pending, completed, missed
   - Pending day counter
   - Edit restrictions (can't edit after day passes)

4. **Streak System**
   - Automatic calculation
   - Current and best streak tracking
   - Breaks on missed tasks
   - Leaderboard

5. **Dashboards**
   - User dashboard with all groups and stats
   - Group dashboard with tasks, members, and leaderboard

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 2. Test the Complete Flow

#### Step 1: Create Account
1. Go to http://localhost:3000
2. Click "Get Started"
3. Fill in:
   - Name: John Doe
   - Email: john@test.com
   - Password: Test1234
   - Timezone: (auto-detected)
4. Click "Sign up"

#### Step 2: Create a Group
1. You'll be on `/dashboard`
2. Click "Create Group"
3. Enter:
   - Name: Morning Writers
   - Description: Write every day
4. Click "Create Group"

#### Step 3: Add a Daily Task
1. Click on your group card
2. Click "Add Daily Task"
3. Enter:
   - Title: Write 500 words
   - Description: Morning session
   - Date: (today - default)
4. Click "Create Task"

#### Step 4: Test Enforcement ⚠️
1. Try adding another task for TODAY
2. You'll get: "You have already posted a task for this date in this group"
3. ✅ This proves the enforcement works!

#### Step 5: Complete Your Task
1. Click the "Complete" button on your task
2. Watch your streak go from 0 → 1 🔥
3. Check the leaderboard on the right sidebar

#### Step 6: Test Pending Tasks
1. Create a task for yesterday (manually set the date)
2. It will show "Pending for 1 day" in red
3. Complete or mark it as missed

## Key Features to Test

### ✅ One Task Per Day
- Create a task for today
- Try creating another for the same day → Should fail
- The unique database constraint prevents duplicates

### ✅ Streaks
- Complete a task → Streak = 1
- Complete tomorrow's task → Streak = 2
- Mark a task as missed → Streak resets to 0
- Best streak is always preserved

### ✅ Pending Tasks
- Tasks from previous days show "Pending for X days"
- Dashboard shows total pending count
- Red warning badge

### ✅ Timezone Handling
- All dates normalized to your timezone
- Task for "today" depends on your local time
- Works correctly across different timezones

### ✅ Edit Restrictions
- Can't edit task details after day passes
- Can still mark as completed/missed anytime
- Can delete only on the same day

## File Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Signup
│   ├── (dashboard)/         # Dashboard, Group pages
│   └── api/                 # All API routes
├── components/
│   ├── groups/              # Group UI components
│   ├── tasks/               # Task UI components
│   └── dashboard/           # Dashboard components
├── lib/
│   ├── auth/                # NextAuth config
│   ├── services/            # Streak & task services
│   ├── utils/date.ts        # Timezone utilities
│   └── validations/         # Zod schemas
└── prisma/
    └── schema.prisma        # 7 data models
```

## Database Collections

All created in MongoDB Atlas:

1. **users** - With timezone field
2. **groups** - Accountability groups
3. **group_members** - Roles: admin/member
4. **join_requests** - Pending approvals
5. **daily_tasks** - ⚠️ Unique constraint: [groupId, userId, date]
6. **streaks** - Current + best streak
7. **goals** - For future features

## API Endpoints Created

### Groups
- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create group
- `GET /api/groups/[groupId]` - Get group

### Tasks
- `GET /api/groups/[groupId]/tasks` - List tasks
- `POST /api/groups/[groupId]/tasks` - Create (enforces 1/day)
- `PATCH /api/tasks/[taskId]` - Update (updates streaks)

### Members & Join Requests
- `GET /api/groups/[groupId]/members`
- `POST /api/groups/[groupId]/join-requests`
- `PATCH /api/groups/[groupId]/join-requests` - Approve/reject

## Testing Multiple Users

1. Create first account in normal browser
2. Create second account in incognito mode
3. Both users can create groups
4. Both can add tasks independently

## What's Not Included (Future Features)

- Goals UI (API exists, no UI yet)
- Join group by link/code
- Email notifications
- Real-time updates
- Mobile app

## Troubleshooting

### Can't log in
- Check email/password
- Make sure you signed up first

### "Already posted a task"
- This is correct! Only 1 task per day
- Create task for a different date

### Streak not incrementing
- Make sure tasks are on consecutive days
- Check that status is "completed"

### Timezone confusion
- Check: `Intl.DateTimeFormat().resolvedOptions().timeZone` in browser console
- App uses this for all date calculations

## Next Steps

The core platform is complete! You can now:

1. Test all features thoroughly
2. Invite real users to test
3. Add goals UI if needed
4. Implement join group feature
5. Deploy to Vercel

## Architecture Highlights

### Critical Implementation Details

1. **Timezone Normalization**
   ```typescript
   getStartOfDayInTimezone(date, timezone) → UTC Date
   ```
   Ensures "today" is correct for each user

2. **Streak Calculation**
   - On complete: Check if consecutive → increment or reset
   - On missed: Reset to 0
   - Located in `lib/services/streak.service.ts`

3. **Task Enforcement**
   - Prisma unique constraint: `[groupId, userId, date]`
   - API validation before insert
   - Returns 409 error if duplicate

## Ready to Test! 🚀

Start the app with `npm run dev` and follow the test flow above. The platform is fully functional and ready for accountability!
