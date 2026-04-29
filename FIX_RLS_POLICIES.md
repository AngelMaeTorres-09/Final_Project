# Fix RLS (Row-Level Security) Policies

## The Problem

You're getting: `new row violates row-level security policy for table "articles"`

This means the `articles` and `notifications` tables have RLS enabled but don't have the proper policies allowing authenticated users to INSERT.

## The Solution

Go to your Supabase Dashboard and run these SQL commands:

### Step 1: Enable RLS on Required Tables

```sql
-- Enable RLS on articles table
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on article_comments table
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Policies for ARTICLES Table

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view articles" ON articles;
DROP POLICY IF EXISTS "Authenticated users can create articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles;

-- Allow anyone to READ articles
CREATE POLICY "Anyone can view articles"
  ON articles
  FOR SELECT
  USING (true);

-- Allow authenticated users to CREATE articles
CREATE POLICY "Authenticated users can create articles"
  ON articles
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to UPDATE their own articles
CREATE POLICY "Users can update own articles"
  ON articles
  FOR UPDATE
  USING (auth.uid() = author_id OR auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.uid() = author_id OR auth.jwt()->>'role' = 'admin');

-- Allow users to DELETE their own articles
CREATE POLICY "Users can delete own articles"
  ON articles
  FOR DELETE
  USING (auth.uid() = author_id OR auth.jwt()->>'role' = 'admin');
```

### Step 3: Create Policies for NOTIFICATIONS Table

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- Allow anyone to READ notifications
CREATE POLICY "Anyone can view notifications"
  ON notifications
  FOR SELECT
  USING (true);

-- Allow authenticated users to CREATE notifications (for admin broadcasts)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

> If you are still getting the RLS error on `notifications`, make sure you ran this exact block for the `notifications` table and that RLS is enabled there.
> 
> You can verify with:
> ```sql
> SELECT relname, relrowsecurity
> FROM pg_class
> WHERE relname = 'notifications';
> ```

### Step 4: Create Policies for ARTICLE_COMMENTS Table

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view comments" ON article_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON article_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON article_comments;

-- Allow anyone to READ comments
CREATE POLICY "Anyone can view comments"
  ON article_comments
  FOR SELECT
  USING (true);

-- Allow authenticated users to CREATE comments
CREATE POLICY "Authenticated users can create comments"
  ON article_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Allow users to DELETE their own comments
CREATE POLICY "Users can delete own comments"
  ON article_comments
  FOR DELETE
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');
```

### Step 5: Create Policies for PROFILES Table

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

-- Allow anyone to READ profiles
CREATE POLICY "Anyone can view profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- Allow users to UPDATE/INSERT their own profile
CREATE POLICY "Users can manage own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

## How to Apply These Policies

### Option 1: Use Supabase Web Interface (Easiest)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** on the left sidebar
4. Click **New Query**
5. Copy and paste the SQL from Step 2 above (for articles table)
6. Click **Run**
7. Repeat for Steps 3, 4, and 5

### Option 2: Use Supabase CLI

If you have the CLI installed:

```bash
# Create a migration file
supabase migration new fix_rls_policies

# Copy the SQL into the migration file and run:
supabase db push
```

## Verify It Works

After applying the policies, test by:

1. In your app, login as an authenticated user
2. Try to publish an article
3. You should see: ✅ **"Article published! Users have been notified."**
4. The article should appear in the feed
5. Admin broadcasts should also work

## Why This Happened

By default, when you enable RLS on a table, it blocks all operations unless you explicitly allow them with policies. The policies define who can do what on each table.

The policies above allow:
- **Everyone** to read articles and comments
- **Authenticated users** to create articles, comments, and notifications
- **Users** to edit/delete only their own content
- **Admins** to edit/delete any content

## Still Having Issues?

If it still doesn't work after applying policies:

1. **Check RLS is enabled:**
   ```sql
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE tablename IN ('articles', 'notifications', 'article_comments', 'profiles');
   ```
   All should show `t` (true) for rowsecurity

2. **Check policies exist:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'articles';
   ```

3. **Check your user is authenticated:**
   - In your app, make sure you're logged in
   - Check browser console for auth errors

4. **Temporarily disable RLS (for testing only):**
   ```sql
   ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
   ```
   Then test. If it works, the issue is definitely RLS policies.
   Then re-enable RLS and apply the correct policies above.
