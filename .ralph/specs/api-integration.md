# API Integration Reference

## Base Configuration
- **API Base URL**: Set via `VITE_API_URL` environment variable
- **Authentication**: Bearer token in `Authorization` header
- **Content-Type**: `application/json`
- **Timeout**: 30s (non-AI), 60s (AI endpoints)

## Authentication Endpoints

### POST `/api/auth/signup`
Create new user account.
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```
**Response**:
```json
{
  "user": { "id": "uuid", "email": "...", "name": "..." },
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

### POST `/api/auth/login`
Email/password login.
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```
**Response**: Same as signup

### POST `/api/auth/refresh`
Refresh access token.
```json
{
  "refresh_token": "eyJhbGc..."
}
```
**Response**:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

### POST `/api/auth/logout`
Invalidate current session.
**Headers**: `Authorization: Bearer {token}`
**Response**: `{ "success": true }`

## Restaurant Endpoints

### GET `/api/restaurants`
Get user's saved restaurants.
**Headers**: `Authorization: Bearer {token}`
**Response**:
```json
[
  {
    "id": "uuid",
    "place_id": "ChIJ...",
    "name": "Restaurant Name",
    "address": "123 Main St, City",
    "is_manual": false,
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

### POST `/api/restaurants`
Create new restaurant.
```json
{
  "place_id": "ChIJ...",
  "name": "Restaurant Name",
  "address": "123 Main St",
  "is_manual": false
}
```
**Response**: Created restaurant object

### DELETE `/api/restaurants/:id`
Delete restaurant by ID.
**Response**: `{ "success": true }`

## Content Generation Endpoints

### POST `/api/gemini/generate-image`
Generate AI image using Google Gemini.
```json
{
  "prompt": "A delicious burger on a wooden table",
  "style": "cleanStrict",
  "restaurant_id": "uuid"
}
```
**Response**:
```json
{
  "image_url": "https://storage.googleapis.com/...",
  "generation_id": "uuid",
  "credits_used": 1
}
```

### POST `/api/veo/generate-video`
Generate AI video using Google Veo.
```json
{
  "prompt": "Chef preparing pasta",
  "duration": 4,
  "restaurant_id": "uuid"
}
```
**Response**:
```json
{
  "video_url": "https://storage.googleapis.com/...",
  "generation_id": "uuid",
  "credits_used": 5,
  "status": "processing"
}
```

### GET `/api/veo/status/:generation_id`
Check video generation status.
**Response**:
```json
{
  "status": "completed",
  "video_url": "https://...",
  "progress": 100
}
```

## Favorites Endpoints

### GET `/api/favorites`
Get user's saved favorite posts.
**Response**: Array of favorite post objects

### POST `/api/favorites`
Save a post as favorite.
```json
{
  "content": "Post caption text",
  "media_urls": ["https://..."],
  "media_type": "image",
  "style": "cleanStrict"
}
```

### DELETE `/api/favorites/:id`
Delete favorite post.

## Scheduling Endpoints

### GET `/api/scheduler?start_date=2024-01-01&end_date=2024-01-31`
Get scheduled posts for date range.
**Response**:
```json
[
  {
    "id": "uuid",
    "favorite_post_id": "uuid",
    "scheduled_date": "2024-01-15",
    "scheduled_time": "12:00:00",
    "platforms": ["facebook", "instagram"],
    "status": "scheduled",
    "timezone": "America/New_York"
  }
]
```

### POST `/api/scheduler`
Schedule a post.
```json
{
  "favorite_post_id": "uuid",
  "scheduled_date": "2024-01-15",
  "scheduled_time": "12:00:00",
  "platforms": ["facebook", "instagram"],
  "timezone": "America/New_York"
}
```

### PUT `/api/scheduler/:id`
Update scheduled post.

### DELETE `/api/scheduler/:id`
Cancel scheduled post.

### POST `/api/scheduler/publish-now`
Publish immediately (bypass scheduling).
```json
{
  "favorite_post_id": "uuid",
  "platforms": ["facebook", "instagram"]
}
```

## Platform-Specific Endpoints

### Facebook

#### POST `/api/facebook/oauth/url`
Get OAuth authorization URL.
**Response**: `{ "url": "https://facebook.com/oauth/..." }`

#### POST `/api/facebook/oauth/callback`
Complete OAuth flow.
```json
{
  "code": "oauth_code_from_redirect"
}
```
**Response**: Connected account details

#### POST `/api/facebook/publish`
Publish post to Facebook.
```json
{
  "content": "Post caption",
  "media_urls": ["https://..."],
  "page_id": "facebook_page_id"
}
```

#### GET `/api/facebook/pages`
Get user's Facebook pages.

### Instagram

#### POST `/api/instagram/oauth/url`
Get OAuth authorization URL (via Facebook).

#### POST `/api/instagram/oauth/callback`
Complete OAuth flow.

#### POST `/api/instagram/publish`
Publish post to Instagram.
```json
{
  "content": "Post caption",
  "media_urls": ["https://..."],
  "account_id": "instagram_account_id"
}
```

### TikTok

#### POST `/api/tiktok/oauth/url`
Get OAuth authorization URL.

#### POST `/api/tiktok/oauth/callback`
Complete OAuth flow.

#### POST `/api/tiktok/publish`
Publish video to TikTok.
```json
{
  "content": "Video description",
  "video_url": "https://...",
  "privacy_level": "PUBLIC_TO_EVERYONE"
}
```

### Twitter/X

#### POST `/api/twitter/oauth/url`
Get OAuth authorization URL.

#### POST `/api/twitter/oauth/callback`
Complete OAuth flow.

#### POST `/api/twitter/publish`
Publish tweet.
```json
{
  "content": "Tweet text (max 280 chars)",
  "media_urls": ["https://..."]
}
```

### LinkedIn

#### POST `/api/linkedin/oauth/url`
Get OAuth authorization URL.

#### POST `/api/linkedin/oauth/callback`
Complete OAuth flow.

#### POST `/api/linkedin/publish`
Publish post to LinkedIn.
```json
{
  "content": "Post text",
  "media_urls": ["https://..."]
}
```

## Analytics Endpoints

### GET `/api/analytics/engagement?start_date=2024-01-01&end_date=2024-01-31`
Get engagement metrics.
**Response**:
```json
{
  "total_posts": 45,
  "total_likes": 1234,
  "total_comments": 567,
  "total_shares": 89,
  "by_platform": {
    "facebook": { "posts": 15, "likes": 400, ... },
    "instagram": { "posts": 20, "likes": 600, ... }
  }
}
```

### GET `/api/analytics/posts/:post_id`
Get detailed metrics for specific post.

## Billing Endpoints

### GET `/api/subscriptions/current`
Get user's subscription status.
**Response**:
```json
{
  "plan": "pro",
  "status": "active",
  "billing_cycle": "monthly",
  "next_billing_date": "2024-02-15",
  "credits_remaining": 50
}
```

### POST `/api/subscriptions/checkout`
Create Stripe checkout session.
```json
{
  "plan": "pro",
  "billing_cycle": "monthly"
}
```
**Response**: `{ "checkout_url": "https://checkout.stripe.com/..." }`

### GET `/api/subscriptions/portal`
Get Stripe customer portal URL.
**Response**: `{ "portal_url": "https://billing.stripe.com/..." }`

### POST `/api/credits/purchase`
Purchase additional credits.
```json
{
  "credits": 100
}
```

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED` (401): Invalid or expired token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource doesn't exist
- `VALIDATION_ERROR` (422): Invalid request data
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error
- `INSUFFICIENT_CREDITS` (402): Not enough credits

## Rate Limits
- **Standard Endpoints**: 100 requests/minute
- **AI Generation**: 10 requests/minute
- **OAuth Callbacks**: 20 requests/minute
