# @vedify/db-adapters

Database abstraction layer for Vedify with support for multiple providers (Supabase, Mock) and comprehensive interaction tracking for static sites.

## Features

- **Multiple Providers**: Supabase for production, MockDB for development
- **Interaction State Controls**: Enable/disable/auth-only controls for comments, interactions, and highlights per post
- **Actor Types**: Support for both authenticated users and anonymous visitors
- **Engagement Tracking**: Ratings, claps, likes, bookmarks, read tracking
- **Comments**: Threaded comments with edit-once semantics
- **Highlights**: Text highlighting with notes (Kindle/Medium-style)
- **Build Lifecycle**: Post creation, updates, renames, and soft-deletion during static site builds
- **Type Safety**: Full TypeScript support with strict validation
- **Security**: Row-level security (RLS) policies, atomic operations, and input validation

## Installation

```bash
pnpm add @vedify/db-adapters
```

## Usage

### Basic Setup

```typescript
import { getDB } from '@vedify/db-adapters';

// Auto-selects Supabase if configured, otherwise uses MockDB
const db = getDB(accessToken);

// Or explicitly choose a provider
import { getDbAdapter } from '@vedify/db-adapters';
const db = getDbAdapter('supabase', accessToken);
```

### Environment Variables

For Supabase:

```bash
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

### Interaction State Controls

Each post has three independent controls:

- **comments_state**: Control comment permissions
- **interactions_state**: Control likes, claps, bookmarks, ratings, read tracking
- **highlights_notes**: Control text highlighting and notes

Values:

- `enabled`: Anyone can use this feature
- `disabled`: Feature is completely disabled
- `auth_only`: Only authenticated users can use this feature

```typescript
// Check post metadata to see interaction states
const metadata = await db.getPostMetadata('my-post-slug');
console.log(metadata.commentsState); // 'enabled' | 'disabled' | 'auth_only'
```

### Comments

```typescript
// Get comments for a post
const comments = await db.getComments('post-slug');

// Post a comment (authenticated)
const comment = await db.postComment(
  'post-slug',
  {
    userName: 'John Doe',
    commentText: 'Great article!',
    parentId: null, // or parent comment ID for replies
  },
  userId, // authenticated user ID
);

// Post a comment (anonymous)
const anonComment = await db.postComment(
  'post-slug',
  {
    userName: 'Anonymous',
    commentText: 'Interesting perspective',
  },
  // no userId = anonymous
);
```

### Interactions

```typescript
// Save a rating (1-5)
await db.saveRating('post-slug', 5, anonId, userId);

// Submit claps (total count, not increment)
await db.submitClap('post-slug', 10, anonId, userId);

// Toggle like
const result = await db.toggleLike('post-slug', anonId, userId);
console.log(result.isLiked); // true or false

// Toggle bookmark
const bookmark = await db.toggleBookmark('post-slug', anonId, userId);
console.log(bookmark.isBookmarked);

// Mark as read
await db.markAsRead('post-slug', anonId, userId);

// Get post stats (aggregated)
const stats = await db.getPostStats('post-slug');
console.log(stats); // { totalLikes, totalClaps, avgRating, ratingCount }
```

### Highlights

```typescript
// Save a highlight with note
const result = await db.saveHighlight({
  postId: 'post-slug',
  highlightedText: 'Selected text',
  note: 'My thoughts on this',
  startOffset: 100,
  endOffset: 150,
  selectorPrefix: 'preceding text',
  selectorSuffix: 'following text',
  color: 'yellow',
  userId: 'user-id', // or anonId for anonymous
});

// Get all highlights for a post (filtered by actor)
const highlights = await db.getHighlights('post-slug', anonId, userId);
```

### Build-Time Sync

For static site builds, use `BuildTimeSyncService` to sync post lifecycle:

```typescript
import { BuildTimeSyncService } from '@vedify/db-adapters';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const syncService = new BuildTimeSyncService(supabase);

// Register a new build
const build = await syncService.registerBuild('commit-sha', '1.0.0');

// Sync posts for this build
await syncService.syncPostLifecycle({
  currentBuildId: build.id,
  contentPosts: [
    {
      slug: 'my-post',
      title: 'My Post Title',
      comments_state: 'enabled',
      interactions_state: 'enabled',
      highlights_notes: 'auth_only',
    },
  ],
  renames: [
    { from: 'old-slug', to: 'new-slug' }, // Preserves interactions
  ],
});

// Posts not in contentPosts are automatically marked as deleted
```

### UUID Generation

Deterministic UUIDs for posts based on slugs:

```typescript
import { uuid5, DNS_NAMESPACE } from '@vedify/db-adapters';

const postId = uuid5(DNS_NAMESPACE, 'my-post-slug');
// Always generates the same UUID for the same slug
```

## Validation

All operations include automatic validation:

- **Ratings**: Must be integers 1-5
- **Claps**: Must be 0-50 (per actor)
- **Comments**: Max 3000 characters, cannot be empty
- **Highlights**: Max 3000 characters for text and notes
- **Offsets**: endOffset must be greater than startOffset

Validation errors are returned in the result:

```typescript
const result = await db.saveRating('post-slug', 6, anonId);
console.log(result); // { success: false, error: 'Rating must be between 1 and 5' }
```

## Database Schema

The package includes comprehensive migrations for Supabase:

1. **01_base_tables.sql** - builds, posts with post_id UUID
2. **02_user_tables.sql** - user_preferences
3. **03_interaction_tables.sql** - user_post_interactions
4. **04_comment_tables.sql** - post_comments with threading
5. **05_highlight_tables.sql** - post_highlights
6. **06_indexes_and_triggers.sql** - performance indexes, lifecycle triggers
7. **07_rls.sql** - row level security policies
8. **08_views.sql** - public views (comments, stats)
9. **09_atomic_toggle_functions.sql** - race-condition-free toggles
10. **10_performance_indexes.sql** - additional optimization indexes
11. **11_validation_constraints.sql** - data integrity constraints

## Security

### Row Level Security (RLS)

- **Posts**: Publicly readable (non-deleted only)
- **Interactions**: Publicly readable, write restricted to owner
- **Comments**: Approved comments publicly readable, users can edit/delete their own
- **Highlights**: Private to the owning actor (logged-in or anonymous)
- **User Preferences**: Strictly private to owner

### Atomic Operations

Toggle operations (like, bookmark) use database functions to prevent race conditions:

```sql
-- Atomic toggle - no read-then-write race condition
SELECT toggle_like(post_id, user_id, anon_id);
```

### Anonymous User Security

⚠️ **Important**: Anonymous highlights using `localStorage` anon_id are NOT secure. Any client can read/write ANY anonymous highlight by spoofing the anon_id.

**Recommendation**: Use Supabase Anonymous Sign-ins (`supabase.auth.signInAnonymously()`) instead, which gives anonymous sessions a real `auth.uid()` and proper RLS protection.

## Performance

### Incremental Sync

Use the `sinceBuildId` parameter to fetch only new data since a specific build:

```typescript
const comments = await db.getComments('post-slug', sinceBuildId);
const ratings = await db.getRatings('post-slug', sinceBuildId);
```

### Optimized Indexes

The schema includes composite indexes for:

- Incremental sync queries (`post_id + updated_at/created_at`)
- Actor-specific lookups (`actor_id + post_id`)
- Stats aggregation (covering index)
- Comment threading
- Build lifecycle queries

## Development

```bash
# Type checking
pnpm check-types

# Linting
pnpm lint

# Fix linting issues
pnpm lint --fix
```

## Migration Guide

### From Old Schema

The package now uses immutable `post_id` (UUID) as the primary key with mutable `slug`. This allows safe post renames without losing interactions.

**Before:**

- Primary key: `slug` (mutable)
- Interactions FK to `slug`
- Renaming a post loses all interactions

**After:**

- Primary key: `slug` (mutable, for URLs)
- Unique key: `post_id` (immutable, UUID v5)
- Interactions FK to `post_id`
- Renaming preserves all interactions

Use `BuildTimeSyncService` with the `renames` array to handle slug changes.

## Type Definitions

```typescript
interface PostMetadata {
  postId: string;
  slug: string;
  title: string;
  commentsState: InteractionState;
  interactionsState: InteractionState;
  highlightsNotes: InteractionState;
  isDeleted: boolean;
}

type InteractionState = 'enabled' | 'disabled' | 'auth_only';

interface SaveResult {
  success: boolean;
  error?: string;
}
```
