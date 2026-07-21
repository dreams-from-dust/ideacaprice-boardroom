# Security

This document describes the security posture of IdeaCaprice Boardroom in full, including issues that were found and corrected during development and gaps that remain open. It is written to be read honestly rather than reassuringly, since an accurate account of a system's security is more valuable, and more credible, than a blanket claim of safety.

## Issues found and corrected

### Client side exposure of a live API key

The original implementation called the language model provider directly from client side code, with a live API key embedded as a fallback constant in that same client code. Because client side JavaScript is compiled directly into the application bundle, that key would have shipped inside the installed Android application and could have been extracted by anyone with access to the compiled package, at which point it could be used to consume the project owner's API quota or be revoked and cause the application to fail entirely.

This was corrected by removing every call to the model provider from client side code entirely and rebuilding the integration so all such calls happen exclusively on the Express server, with the key read only from a server held environment variable that is never sent to, or accessible from, the client in any form. The corresponding key was also treated as compromised and rotated, independent of the code fix, since a key that has ever been present in a shareable file should not be trusted going forward regardless of whether the exposure is later closed.

### Firestore security rules not matching actual data paths

A review of the data layer found that the Firestore security rules referenced a document path structure that did not match the nested path structure the application's own code actually wrote to. In practice, this meant that writes from real, signed in users were likely being silently rejected by Firestore rather than genuinely protected as the rules intended, which is a subtler and more dangerous failure mode than an obviously broken feature, since it can go unnoticed for a long time while quietly failing to do its job.

This was corrected by rewriting the rules to match the application's real, nested per user document structure, with explicit ownership checks confirming that a request is authenticated as the same user whose data is being accessed, and field level validation confirming that a written debate record has the expected shape before it is accepted.

## Current protections

Firestore rules restrict every read, write, and delete of a debate record to the authenticated user who owns that record, with no path allowing one user's session to read or modify another's data. Debate records are treated as immutable once created, with no update operation permitted, only creation and deletion, which limits the ways a record could be tampered with after the fact. Rate limiting is applied to the two debate advancing endpoints on the Express server, scoped per client address, specifically to prevent automated abuse of the underlying model provider's quota. The application enforces a client side password policy requiring a minimum length of eight characters along with at least one numeric and one special character at account creation. Because this system has no SQL database anywhere in its architecture, using Firestore's document based model instead, SQL injection is not a mitigated risk so much as an architecturally absent one, there is no query surface of the kind that vulnerability class depends on.

The backend accepts cross origin requests from any domain, a deliberate tradeoff made specifically because the native Android build runs inside a WebView whose own origin differs from the deployed backend's origin, and without this the mobile app could not reach the server at all. In practice this means any website, not only the application's own frontend, could call the debate endpoints from a browser. The exposure this creates is limited, since those endpoints require no authentication and return no user specific data, the realistic risk is quota consumption rather than data exposure, and that risk is the same one the existing rate limiting was already built to address.

React's default behavior of escaping rendered text protects the live application interface from cross site scripting in the overwhelming majority of cases, since content is never inserted as raw, unescaped HTML anywhere in the interactive application.

## Known gaps

This project does not claim to be complete from a security standpoint, and the following gaps are documented deliberately rather than omitted.

Firebase's own account creation enforces a shorter minimum password length than the application's own client side policy suggests. A request made directly against Firebase's authentication API, bypassing the application's own interface entirely, would only be bound by that weaker underlying default rather than the stricter policy enforced in the user interface.

Email addresses are not verified at the time of account creation. An account can be created and used fully without confirming ownership of the email address provided.

Brute force protection on login attempts relies entirely on Firebase Authentication's own built in abuse detection rather than any additional custom rate limiting implemented specifically for this application's login flow, unlike the debate endpoints, which do have dedicated rate limiting.

The downloadable HTML report generated from a completed debate is built through direct string construction rather than a sanitized templating approach. If a person deliberately entered content designed to execute as script when later opened as a local HTML file, and a persona's response happened to include that content unmodified, it could execute in the context of that downloaded file specifically. This is a narrow, low severity exposure limited to a file a person downloads for themselves rather than a vulnerability reachable by one user against another inside the live application, but it is a real gap worth closing with proper output encoding before the export feature is considered fully hardened.

There is no server side enforcement of the password complexity policy independent of the client interface, meaning the policy as implemented is a user experience guardrail rather than a guaranteed backend constraint.

## Summary

The most significant security work on this project was not adding a new protective feature but finding and correcting two issues that were already present and already exploitable, a leaked API key and a set of security rules that did not match the data they were meant to protect. The system's current protections are real and specific rather than assumed, and its remaining gaps are listed here precisely so they can be addressed deliberately rather than discovered by surprise.