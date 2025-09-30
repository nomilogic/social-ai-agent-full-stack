# Database Migrations

This directory contains SQL migration files for updating the database schema.

## How to Apply Migrations

### 1. Add Post Reads Tracking (add-post-reads-tracking.sql)

This migration adds proper read status tracking for posts to enable accurate unread counters.

**To apply this migration:**

1. Connect to your Supabase/PostgreSQL database
2. Run the SQL commands from `add-post-reads-tracking.sql`

**Using Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add-post-reads-tracking.sql`
4. Click "Run" to execute the migration

**Using psql command line:**
```bash
psql -d your_database_url -f migrations/add-post-reads-tracking.sql
```

**What this migration does:**
- Creates a `user_post_reads` table to track which posts each user has read
- Adds proper indexes for performance
- Includes unique constraints to prevent duplicate reads
- Adds helpful comments for documentation

### 2. OAuth Fields Migration (add-oauth-fields.sql)

This migration was already created earlier and adds OAuth support to the users table.

## Migration Order

Apply migrations in this order:
1. `add-oauth-fields.sql` (if not already applied)
2. `add-post-reads-tracking.sql` (new)

## Verification

After applying the post reads tracking migration, verify it worked:

```sql
-- Check that the table was created
\d user_post_reads

-- Check that indexes exist
\di user_post_reads*

-- Test inserting a read status (replace with real user_id and post_id)
INSERT INTO user_post_reads (user_id, post_id, platform) 
VALUES (1, 'test-post-123', 'linkedin')
ON CONFLICT (user_id, post_id, platform) DO NOTHING;
```

## Features Enabled

With the post reads tracking migration applied:

✅ **Real unread post counting** - The unread counter will show actual unread posts instead of time-based approximation

✅ **Per-user read tracking** - Each user's read status is tracked independently  

✅ **Platform-specific reads** - The same post can be marked as read separately for each platform (LinkedIn, Facebook, etc.)

✅ **Instant UI updates** - When users mark posts as read, the unread counter updates immediately

✅ **Mark all as read functionality** - Users can mark all posts as read with one click

## Rollback

If you need to rollback this migration:

```sql
-- WARNING: This will delete all read status data
DROP TABLE IF EXISTS user_post_reads CASCADE;
```
