# Human Gate Token Rule

## Purpose

This file defines the token rule for the CyberCrowd Human/Session Gate.

The Human Gate token is not a login password.

It is not a full identity credential.

It is not a payment token.

It is not a permanent access pass.

It is a short-lived session proof used before a sensitive action continues.

## Core Rule

A Human Gate token must be:

- short-lived
- single-use
- session-bound
- purpose-bound
- rejected if missing
- rejected if expired
- rejected if reused
- rejected if mismatched
- rejected if invalid

## Token Purpose

A Human Gate token may be used to protect sensitive flows such as:

- login
- register
- verify
- vault
- profile
- CyberCrowdJobs
- paid access
- future protected actions

The token only proves that the current session passed the Human Gate checkpoint.

It does not replace authentication.

It does not replace identity verification.

It does not replace device trust.

It does not replace payment authorization.

## Token Lifecycle

1. A protected flow requests a Human Gate token.
2. The backend creates a token record.
3. The token is bound to a session ID.
4. The token is bound to a purpose.
5. The token receives a short expiration window.
6. The frontend submits the token for verification.
7. The backend checks the token.
8. If valid, the protected action may continue.
9. If invalid, the protected action remains blocked.
10. Once used, the token cannot be reused.

## Failure Conditions

The Human Gate must fail closed when:

- no token is present
- no session ID is present
- the token is expired
- the token was already used
- the token does not match the session
- the token does not match the stored hash
- the token purpose does not match the protected action
- the token store is unavailable
- the request body is malformed

Fail closed means the sensitive action does not continue.

## Allowed Outcome

A valid Human Gate token may release the session to the next approved page or action.

Examples:

- verify.html
- login.html
- register.html
- profile.html
- vault-room.html
- cybercrowdjobs.html

The release path must be local and approved.

External redirects should not be allowed.

## Boundary Rule

The Human Gate protects the doorway.

It does not become the whole house.

The Human Gate should not be expanded into the full auth system, full identity engine, full payment rail, or full trust spine.

It only answers one question:

Did this current session pass the CyberCrowd-owned human/session checkpoint?

## Disconnect Rule

The Human Gate must be removable without breaking the entire platform.

If the gate fails during testing, CyberCrowd should be able to disconnect the gate route and return login, register, verify, vault, profile, or CyberCrowdJobs to the previous working path.

## Final Rule

Gate passes → continue.

Gate fails → stop.

Gate expires → retry.
