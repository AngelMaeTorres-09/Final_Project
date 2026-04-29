# Supabase Setup Guide for Publish & Notification System

## Required Tables

Your Supabase project needs the following tables for the publish and notification system to work:

### 1. **articles** (Main Articles Table)
```sql
CREATE TABLE articles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  likes_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. **notifications** (Global Notifications/Announcements)
```sql
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('post', 'announcement', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add an index for faster queries
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 3. **article_comments** (Comments on Articles)
```sql
CREATE TABLE article_comments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  article_id BIGINT REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  parent_id BIGINT REFERENCES article_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX idx_article_comments_user_id ON article_comments(user_id);
```

### 4. **profiles** (User Profiles)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## RLS (Row-Level Security) Policies

For the notifications table to work properly, allow anyone to read but only authenticated users to insert:

```sql
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Allow read notifications" ON notifications
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## How It Works Now

### Publishing Flow:
1. **Admin Publish Page** (`/admin/publish`):
   - Admin fills in title and content
   - Click "Post to Library"
   - Article is inserted to `articles` table
   - A notification is created in `notifications` table
   - Admin is redirected to `/articles`

2. **Dashboard Publish** (Admin modal in dashboard):
   - Admin fills in title and content
   - Click "Upload Article"
   - Article is inserted to `articles` table
   - A notification is created in `notifications` table
   - Modal closes and feed updates in real-time

### Notification Flow:
1. When an article is published, a notification is created in the `notifications` table
2. The real-time listener (`supabase.channel()`) detects the new notification
3. The notification toast appears at the top right
4. The notification is added to the notification history
5. If it's an "announcement" type, the announcement bar updates

### Announcement Bar:
- Shows the latest system message or announcement
- Located at the top of the dashboard
- Only visible in dashboard view mode

### Notification History:
- Accessible via the Bell icon → "View Full History"
- Shows up to 50 most recent notifications
- Displays timestamp and notification type
- Updates in real-time when new notifications arrive

## Testing the System

1. **Check Tables Exist**:
   - Go to Supabase → SQL Editor
   - Run: `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`
   - Verify you have: `articles`, `notifications`, `article_comments`, `profiles`

2. **Test Publishing**:
   - Login as admin user
   - Go to `/admin/publish` or use dashboard publish modal
   - Enter title and content
   - Click publish
   - Check that:
     - Article appears in articles feed
     - Notification toast appears
     - Notification appears in history

3. **Test Real-time**:
   - Open dashboard in two browser tabs
   - Publish article in one tab
   - Other tab should update in real-time (feed refreshes automatically)
   - Notification should appear on both tabs

4. **Test Admin Broadcast**:
   - In dashboard menu → Admin Tools section
   - Enter a system message
   - Click "Send Notice"
   - Check that:
     - Notification toast appears
     - Message appears in announcement bar
     - Message is saved in history

## Troubleshooting

### Articles not appearing:
- Check if `articles` table exists and has data
- Check browser console for errors
- Verify RLS policies allow your user to read

### Notifications not showing:
- Check if `notifications` table exists
- Check Supabase realtime is enabled in settings
- Check browser console for WebSocket errors
- Try refreshing the page

### Announcement bar not showing:
- Make sure you're in "dashboard" view mode (not articles or notifications)
- Check if broadcast was saved (check notifications table in Supabase)
- Try publishing an article to trigger a notification

## Environment Variables

Make sure you have these in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
