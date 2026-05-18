---
name: x-read-posts
description: Read public X/Twitter posts and profiles from x.com or twitter.com URLs using the FxTwitter API. Use when the user shares an X/Twitter post/profile link and asks what it says, wants a summary, or direct fetching returns anti-bot/empty content. Read-only; no API key required.
---

# X/Twitter Read Posts

Use this skill to read public X/Twitter posts or profiles when direct fetching from `x.com` or `twitter.com` is blocked, empty, or likely to return an anti-bot page.

The skill uses the public FxTwitter API:

```text
https://api.fxtwitter.com
```

FxTwitter returns structured JSON for public posts and profiles. It is read-only and does not require authentication.

## Use when

- The user shares a URL matching `x.com/*/status/*` or `twitter.com/*/status/*`.
- The user shares a profile URL like `x.com/username` or `twitter.com/username`.
- The user asks what a tweet/post says, requests a summary, or asks for engagement/media/card details.
- Direct fetch of an X/Twitter URL fails, returns empty content, or returns an anti-bot/challenge page.

## Do not use when

- The user asks to post, like, reply, follow, scrape timelines, or perform any write/interaction.
- The account/post is private, protected, deleted, or unavailable.
- The task requires bulk search, timeline crawling, monitoring, or data collection beyond a small number of explicit URLs.
- The user needs authenticated-only content.

## Fetch a single post

Convert the original URL to the FxTwitter API URL:

```text
Original: https://x.com/elonmusk/status/1234567890
API:      https://api.fxtwitter.com/elonmusk/status/1234567890
```

For `twitter.com`, use the same path:

```text
Original: https://twitter.com/user/status/1234567890
API:      https://api.fxtwitter.com/user/status/1234567890
```

Fetch the API URL as text/JSON using the available web fetch tool.

Example:

```text
https://api.fxtwitter.com/{user}/status/{id}
```

## Fetch a profile

Use:

```text
https://api.fxtwitter.com/{username}
```

This returns public profile data such as name, handle, bio, avatar, follower/following counts, and related metadata when available.

## Translate a post

Append `/translate/{lang}` to the post path:

```text
https://api.fxtwitter.com/{user}/status/{id}/translate/en
https://api.fxtwitter.com/{user}/status/{id}/translate/pt
```

Common language codes include `en`, `pt`, `es`, `fr`, `de`, `ja`, `ko`, and `zh`.

## Important response fields

For posts, present the useful fields instead of dumping raw JSON:

1. **Author**: `tweet.author.name` and `tweet.author.screen_name`
2. **Text**: `tweet.text`
3. **Date**: `tweet.created_at`
4. **Engagement**: `likes`, `retweets`, `replies`, `views`
5. **Media**: photo/video URLs if present
6. **Card/link preview**: title, URL, and description if present
7. **Reply/quote context**: `replying_to` and quoted status when present

## Output style

- If the user asks “what does this say?”, answer concisely in the user’s language.
- Include author, post text/summary, date, and notable media/link context when available.
- Mention if the post is a reply, quote, deleted/unavailable, protected, or if the API returns an error.
- Do not expose raw JSON unless the user asks for it.
- Do not claim access to private/authenticated X content.

## Guardrails

- Always use `api.fxtwitter.com` for the content fetch; do not rely on direct `x.com`/`twitter.com` HTML.
- Treat the result as public web content.
- Do not perform write operations or social interactions.
- Do not batch crawl timelines or search X broadly from this skill.
- If the API fails, report the failure and likely reason instead of inventing content.

## Done

The user receives a concise explanation, summary, translation, or structured extraction of the public X/Twitter URL they provided, with limitations clearly stated when content is unavailable.
