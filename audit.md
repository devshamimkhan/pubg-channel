# Next.js Security, Auth, Caching, and Revalidation Audit

## Summary
This codebase has several security and data exposure issues. The most important problems are:

- **High-risk authorization gaps** in admin pages and server actions
- **Sensitive data exposure** from raw Mongoose documents sent to the client
- **Unsafe upload proxy behavior** with a hard-coded fallback secret
- **Account enumeration** through overly specific authentication errors
- **Overly broad cache invalidation** that can cause stale or inconsistent behavior

---

## High Severity Findings

### 1. Missing server-side authorization for admin functionality
**Affected files**
- `app/(admin)/admin/users/page.js`
- `app/(admin)/admin/account/page.js`
- `app/(admin)/admin/settings/page.js`
- `src/actions/settings.js`
- `src/actions/channels.js`
- `src/actions/posts.js`
- `src/actions/reactions.js`
- `src/actions/reviews.js`

**Error**
Admin access is not enforced on the server. The app relies too much on the UI layout and client behavior.

**Vulnerability**
A non-admin user may still reach sensitive admin pages or invoke privileged server actions if the server does not explicitly verify the session and role.

**Risk**
- Unauthorized data access
- Unauthorized content edits
- Unauthorized moderation actions
- Potential privilege escalation

**Fix**
- Check session and role in every admin page loader.
- Check session and role inside every mutating server action.
- Never trust client-supplied `userId`, `author`, or `createdBy` values for privileged operations.

---

### 2. Sensitive data is being serialized to the browser
**Affected files**
- `app/(admin)/admin/users/page.js`
- `src/actions/settings.js` (`getAdminDashboardData`)
- `app/(admin)/admin/account/page.js`

**Error**
Full Mongoose documents are returned and passed into client components.

**Vulnerability**
This can expose:
- password hashes
- internal moderation fields
- hidden account metadata
- other data that should remain server-only

**Risk**
Any browser user with access to the page can inspect the payload and recover sensitive account data.

**Fix**
- Use `.select()` to return only safe fields.
- Create explicit client DTOs.
- Never send raw user records to the client.

---

### 3. Upload proxy is fail-open and lacks file validation
**Affected file**
- `app/api/proxy-upload/route.js`

**Error**
The route uses a hard-coded fallback API key when `MEDIA_API_KEY` is missing.

**Vulnerability**
This is a secret-management failure and a security issue. The endpoint also accepts arbitrary files without validating type, size, or count.

**Risk**
- Unauthorized uploads
- Abuse of the media server
- Large-file or malicious-file upload attacks
- Secret leakage through source code

**Fix**
- Remove the fallback secret.
- Fail closed if required env vars are missing.
- Validate file type, size, and number of files before proxying.
- Add timeout and strict error handling for the upstream request.

---

### 4. Authentication errors enable account enumeration
**Affected files**
- `src/lib/auth/auth-options.js`
- `app/api/auth/register/route.js`

**Error**
The app returns different messages for:
- unknown user
- invalid password
- duplicate registration

**Vulnerability**
Attackers can use these differences to determine whether a WhatsApp number is registered.

**Risk**
- Account enumeration
- Targeted brute force attacks
- Reduced auth privacy

**Fix**
- Return generic login failure messages.
- Consider throttling or rate limiting auth attempts.
- Avoid revealing whether a specific account exists.

---

## Medium Severity Findings

### 5. Server actions trust client-supplied identity values
**Affected files**
- `src/actions/channels.js`
- `src/actions/posts.js`
- `src/actions/reactions.js`
- `src/actions/reviews.js`
- `src/actions/settings.js`

**Error**
Multiple actions accept `userId`, `author`, and similar values directly from the client.

**Vulnerability**
A malicious client can spoof another user's identity or modify state that should be owned by someone else.

**Risk**
- Unauthorized follows, reactions, reviews, and presence updates
- Abuse of moderation and profile actions

**Fix**
- Derive the active user from the session inside the action.
- Validate ownership before updates.
- Validate all ObjectId values before database access.

---

### 6. Cache invalidation is too broad and partly incorrect
**Affected files**
- `src/actions/settings.js`
- `src/actions/channels.js`
- `src/actions/posts.js`
- `src/actions/reactions.js`

**Error**
The app frequently invalidates broad paths like `/`, `/admin`, and even `/admin/channels` which does not appear to be a real route.

**Vulnerability**
This can lead to unnecessary rebuilds, extra database load, and stale/inconsistent UI behavior.

**Risk**
- Cache churn
- Performance degradation
- Unexpected stale pages

**Fix**
- Revalidate only the exact paths that change.
- Prefer tag-based invalidation where multiple routes share data.
- Remove invalid or nonexistent revalidation paths.

---

## Low Severity Findings

### 7. Admin layout is presentation only
**Affected file**
- `app/(admin)/layout.js`

**Error**
The layout looks like an admin gate, but it does not enforce security.

**Vulnerability**
It may give a false sense of protection if developers assume the UI shell is sufficient.

**Fix**
Treat it as UI only. Keep all real checks in server pages and server actions.

---

## Caching / Rendering Notes
- The app intentionally uses dynamic rendering for live content, which is acceptable.
- The main problem is not static vs dynamic mode.
- The main problem is missing authorization and over-broad cache invalidation.

---

## Recommended Priority
1. Add server-side authorization everywhere it is missing.
2. Stop sending raw Mongoose documents to the browser.
3. Remove the hard-coded upload secret and validate uploads.
4. Replace specific auth errors with generic ones.
5. Narrow cache invalidation to exact affected routes.

---

## Verification Checklist
- Test `/admin/*` with non-admin and admin sessions
- Inspect client payloads for sensitive fields
- Test upload proxy with missing env vars and invalid files
- Test login/register failure messages for enumeration risk
- Run `next build`
- Verify invalidation only refreshes the intended pages
