# Software Development Lifecycle

This document describes how IdeaCaprice Boardroom was planned, built, secured, and iterated on, from initial concept through to a release ready state. It is written as an honest account of the actual process, including the mistakes that were found and corrected along the way, rather than an idealized retelling.

## 1. Concept and initial build

The project began as an AI Studio generated starting point: a React frontend calling a language model directly from the browser to generate a single, static business idea report. This is a common pattern for quick prototypes and it is also a common source of two serious problems, both of which were present in the initial version and both of which were identified and fixed during this project rather than discovered later by an attacker or a user.

## 2. Requirements definition

Once the initial prototype existed, the real requirements were defined in two passes.

The first pass was a security and correctness audit, treating the existing code as an unverified starting point rather than a finished product. This surfaced two critical issues. A live third party API key was hardcoded directly in client side code, meaning it would ship inside the compiled JavaScript bundle and be extractable from the installed mobile application by anyone. Separately, the Firestore security rules referenced document paths that did not match the paths the application actually wrote to, meaning writes from real, signed in users were likely being silently rejected rather than genuinely protected as intended.

The second pass was a product differentiation exercise. The starting concept, an AI that scores your business idea, is not novel. Several funded, live products already occupy that space with real user bases and, in some cases, live market data grounding that this project does not have. Rather than compete head on with tools that have resources this project does not, the requirement became to build a genuinely different interaction model: an adversarial, multi turn debate the founder can steer, rather than a one shot report.

## 3. Design phase

The interaction model was designed around a single architectural decision: move from one large prompt call that generates an entire debate transcript at once, to a session based model where the debate progresses one turn at a time and every subsequent call receives the full prior transcript as context. This single change unlocked every feature that followed. Redirecting a question to a specific persona, calling an outside witness, and defending the idea after objections were raised are all variations on the same underlying mechanism: one more turn, added to a growing transcript, with a persona responding in character to what has already been said.

The visual design phase was scoped deliberately narrowly, at the person's explicit direction, to color and typography only. Layout, component structure, and interaction patterns already in place were treated as fixed, and the design work focused on defining a coherent color system as CSS variables so an entire visual theme could be changed by editing a small number of values rather than touching individual components.

## 4. Implementation phase

Implementation proceeded in clearly separated batches rather than one continuous change, both for the initial security remediation and for every subsequent feature or bug fixing pass. Each batch was scoped to a small, related set of changes, followed by a structural and type level verification pass before moving to the next batch. This discipline mattered specifically because a single large, unverified change across a codebase this size makes it very easy to introduce a regression that goes unnoticed until a user finds it.

Backend work included restructuring the debate endpoint from a single monolithic call into three distinct phases, an opening phase, a per turn round phase, and a final verdict phase, each with its own prompt design and its own deterministic fallback in case the underlying model provider is temporarily unavailable. Frontend work included rebuilding the debate interface to support a live, growing transcript with founder controls for redirecting, defending, and calling a witness, alongside a full pass on responsive typography, since the original interface used font sizes far too small to be usable comfortably on a phone.

## 5. Testing and verification

Given the nature of this project, testing was conducted primarily through structural verification rather than an automated test suite. Every change was checked for brace and parenthesis balance across every modified file, followed by a full TypeScript compilation check across the entire source tree using an isolated environment with all real dependencies installed, so that type errors introduced by a change would surface immediately rather than at build time on the person's own machine. Where a genuine bug was found during this process, such as a malformed JSX fragment introduced while building the password reset flow, it was corrected and reverified before being considered complete.

Manual verification of actual runtime behavior, including live calls to the language model provider, was the responsibility of the person building the mobile application locally, since that verification requires a real API key and a real device or emulator that this development process did not have direct access to.

## 6. Iteration based on real usage

Several rounds of revision followed the initial build, each grounded in direct feedback after the person actually ran the application. This included discovering that the compiled mobile application would fail silently because it called a relative API path that has no meaning inside a native WebView with no server at that origin, discovering that the Android hardware back button exited the application entirely rather than navigating within it, and discovering that font sizing which looked acceptable on a desktop browser was too small to comfortably read on an actual phone screen. Each of these was only found because the project was tested in its real, intended environment rather than assumed correct from the source code alone, which is the central lesson of this phase of the work.

## 7. Documentation and release preparation

The final phase of the lifecycle covers what this set of documents represents: a comprehensive, honest account of the system's architecture, its user experience decisions, its technology choices, and its security posture, written specifically to support the project being shared publicly, whether through a source code repository, a packaged mobile application, or a public description of the work to an audience such as recruiters or other developers.
