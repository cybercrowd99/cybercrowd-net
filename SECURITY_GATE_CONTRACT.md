# CYBERCROWD SECURITY GATE CONTRACT
Version: v1
Status: Step 1 Foundation Lock
Scope: Email-based entry security for CyberCrowd

## 1. PURPOSE

CyberCrowd uses email as the foundational identity key for entry.

The security gate proves that a visitor controls an email address before opening the protected CyberCrowd room.

The protected room is:

nav.html

The gate page is:

page2.html

The entry system must not depend on manual inbox searching, duplicate auth systems, Supabase, page3.html, or Resend webhook delivery confirmation to open the room.

## 2. SECURITY MODEL

Email address = identity

Magic link = proof that the visitor controls the email

cc_access cookie = active access pass

nav.html = protected room

/api/enrollment/session = session verification checkpoint

## 3. CORRECT FLOW

1. Visitor opens page2.html.

2. Visitor enters email address.

3. page2.html sends POST request to:

/api/enrollment/start

4. /api/enrollment/start validates the email.

5. /api/enrollment/start creates a one-time verification token.

6. /api/enrollment/start sends a magic-link email through Resend.

7. Visitor clicks the magic link.

8. Magic link opens:

/api/auth/verify

9. /api/auth/verify validates the token.

10. /api/auth/verify creates the cc_access session cookie.

11. Browser opens:

/nav.html

12. nav.html calls:

/api/enrollment/session

13. /api/enrollment/session checks cc_access.

14. If verified:true, nav.html opens the CyberCrowd NAV Room.

15. If verified:false, nav.html sends visitor back to page2.html.

## 4. LIVE FILES ONLY

The live system uses exactly these files:

index.html

page2.html

nav.html

functions/api/enrollment/start.js

functions/api/auth/verify.js

functions/api/enrollment/session.js

## 5. ROUTE MAP

Landing route:

/

Landing file:

index.html

Gate route:

/page2.html

Gate API route:

/api/enrollment/start

Verification route:

/api/auth/verify

Session check route:

/api/enrollment/session

Protected room route:

/nav.html

## 6. DO NOT CREATE

Do not create page3.html.

Do not create duplicate gate pages.

Do not create duplicate auth systems.

Do not create Supabase login for this gate.

Do not make Resend webhook required for entry.

Do not make delivered email events required for entry.

Do not make inbox search required for entry.

Do not rename nav.html.

Do not replace index.html.

## 7. PAGE LOCKS

Page 1:

index.html

Purpose:

Landing page only.

Allowed behavior:

Send visitor to page2.html.

Page 2:

page2.html

Purpose:

Email entry gate only.

Allowed behavior:

Collect email and start verification.

Page 3:

nav.html

Purpose:

CyberCrowd protected NAV Room.

Important:

Page3 is the concept name. nav.html is the real file name.

## 8. COOKIE REQUIREMENTS

Cookie name:

cc_access

Cookie must be created only after verification succeeds.

Cookie settings:

HttpOnly

Secure

SameSite=Lax

Path=/

Max-Age=604800

Cookie duration:

7 days

## 9. EMAIL REQUIREMENTS

Email provider:

Resend

From address:

CyberCrowd <welcome@cybercrowd.net>

Reply-To:

access@cybercrowd.net

Email must include:

recipient email

subject

plain text body

HTML body

magic link to /api/auth/verify

Email is used to prove control of the address.

Email is not used as a manual inbox search requirement.

## 10. WEBHOOK RULE

Resend webhook is optional for audit and delivery tracking.

Resend webhook is not required to open nav.html.

Resend webhook must not block entry.

Webhook purpose:

record sent

record delivered

record bounced

record failed

record suppressed

record delayed

## 11. PASS CONDITIONS

The security gate passes only when all of these are true:

page2.html loads.

Visitor enters a valid email.

POST /api/enrollment/start returns success:true.

Email is sent through Resend with a magic link.

Magic link opens /api/auth/verify.

verify creates cc_access cookie.

Browser reaches /nav.html.

nav.html calls /api/enrollment/session.

session returns verified:true.

CyberCrowd NAV Room opens.

## 12. FAIL CONDITIONS

The system fails if any of these happen:

nav.html prints raw JavaScript.

nav.html requires Supabase.

nav.html redirects to page2.html after a valid cc_access cookie exists.

page2.html waits for manual inbox searching.

page2.html opens page3.html.

start.js requires webhook delivery before entry.

verify.js does not create cc_access.

session.js does not read cc_access.

Duplicate routes fight over the same job.

## 13. ACCEPTANCE TEST

Test 1:

Open:

/page2.html

Expected:

Security gate loads.

Test 2:

Submit a real email.

Expected:

Gate says magic link sent.

Test 3:

Open the magic link from email.

Expected:

/api/auth/verify creates cc_access and opens /nav.html.

Test 4:

nav.html loads.

Expected:

CyberCrowd NAV Room opens.

Test 5:

Open:

/api/enrollment/session

Expected:

verified:true

Test 6:

Clear cookie or sign out.

Expected:

/api/enrollment/session returns verified:false and nav.html sends visitor back to page2.html.

## 14. FINAL LOCK

CyberCrowd entry security base is:

Email identity

Magic link proof

cc_access session

nav.html protected room

No Supabase

No page3.html

No inbox-search gate

No webhook dependency for access
