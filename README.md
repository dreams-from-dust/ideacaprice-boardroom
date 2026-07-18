# IdeaCaprice Boardroom

IdeaCaprice Boardroom is a full stack web and mobile application that puts your business idea in front of an AI powered advisory board and makes you defend it. Instead of generating a single static report, the platform runs a live, multi round debate between domain specific personas who argue for and against your idea, respond to direct questions, and update their final verdict based on how well you defend your reasoning.

The project was built to explore a simple idea. Most AI validation tools hand you a report and consider the job done. This one is designed to feel like an actual boardroom conversation, one you can steer, interrupt, and win or lose based on the strength of your answers.

## What it does

A founder submits a business idea and selects an advisory board style suited to their industry. Two personas open the session immediately. The Fan is an enthusiastic, domain specific advocate who argues the idea has real commercial merit, citing concrete figures and a plausible customer segment. The Hater is an equally specific skeptic who challenges the idea on regulatory, financial, or operational grounds, citing real constraints rather than generic pessimism.

From there, the founder controls the pace of the debate. A question can be redirected to either persona for a direct, in character answer. A witness can be summoned mid debate, chosen from a set of archetypes such as a seed stage investor, an industry regulator, a twenty year industry veteran, or a skeptical target customer, each with a distinct voice and set of priorities. The founder can also step in directly and defend the idea against a specific objection, and the opposing persona will respond by acknowledging what was resolved and quantifying what still remains at risk.

When the founder is ready, a final synthesis persona, the Boss, reviews the entire transcript and produces a structured verdict. This includes an overall viability score, a breakdown across market moat, execution ease, adoption feasibility, and financial viability, a set of strengths, risks, and mitigations grounded in the specific idea discussed, a phased execution plan, and a full financial model covering pricing, cost structure, and realistic customer volume for a bootstrapped founder. The scoring explicitly accounts for how the debate went, so an idea that was successfully defended scores differently than the same idea left unchallenged.

Every completed session is saved and can be revisited later from an archive view, complete with the full transcript and the final report.

## The technology behind it

### Frontend

The client is built with React 19 and TypeScript, bundled with Vite for fast local development and optimized production builds. Styling is handled with Tailwind CSS, using a design token system defined entirely through CSS variables, which allows the entire visual theme to be swapped by changing a small set of values rather than touching individual components. Animation is handled with Motion for smooth transitions between debate turns and interface states. Icons are provided by Lucide, and data visualization for the score breakdown uses Recharts.

### Backend

The server is an Express application written in TypeScript and run with tsx during development, then bundled with esbuild for production. All calls to the underlying language model happen exclusively on the server. The client never holds an API key or communicates with the model provider directly. This is a deliberate security boundary, not an implementation detail, and it is discussed further below.

The debate itself is powered by a large language model accessed through Groq, chosen for its inference speed, which matters directly to the feel of a live, turn based conversation. The prompting system is structured in three distinct phases rather than a single monolithic call. An opening phase generates the initial Fan and Hater statements. A round phase handles every subsequent redirect, defense, or witness call, and is built to receive the full prior transcript so each persona responds with awareness of everything said before it. A verdict phase runs once, at the founder's request, and synthesizes the complete transcript into the final structured report, explicitly weighing how well objections were addressed rather than simply whether a defense was attempted.

If the language model is temporarily unavailable, the backend falls back to a deterministic, rule based response generator so the application degrades gracefully rather than failing outright. This fallback is intentionally distinct from a genuine model response and is worth being transparent about when discussing the project.

### Data and authentication

User accounts and debate history are handled through Firebase, using Firebase Authentication for email and password based sign in and Firestore as the persistence layer. Every debate a signed in user completes is stored under that user's own document path in Firestore, governed by security rules that check for an authenticated match between the requesting user and the data being accessed, alongside schema validation on write. A visitor without an account can still use the full experience in a temporary guest mode, with history kept only for that session.

### Mobile packaging

The same codebase is packaged into a native Android application using Capacitor, which wraps the compiled web build in a native WebView shell and exposes native device capabilities where needed, such as the filesystem access used for saving an exported report directly to the device. The hardware back button on Android is bridged into the application's own internal navigation state, so it steps back through the app's screens the way a native app is expected to behave, rather than exiting unexpectedly.

## Security considerations

A meaningful part of this project's development involved identifying and correcting real security issues rather than assuming a generated codebase was safe by default. The original implementation called the language model provider directly from client side code with an API key embedded in the compiled JavaScript bundle, meaning that key would have shipped inside the installed Android application and could have been extracted by anyone. That logic was removed entirely and rebuilt so all model calls happen server side, with the key read only from a server environment variable and never exposed to the client in any form.

Firestore security rules were also found to reference document paths that did not match the paths the application actually wrote to, which meant writes from signed in users were likely being silently rejected rather than actually enforced as intended. The rules were rewritten to match the application's real data structure, with explicit ownership checks and field level validation on every write.

The application enforces a client side password policy requiring a minimum length along with both a numeric and a special character, includes rate limiting on the conversational API endpoints to prevent abuse of the underlying model quota, and keeps every debate record scoped to its owning user through Firestore rules rather than relying on the client to behave correctly.

It is worth being direct about what is not yet in place. Firebase's own account creation enforces a weaker minimum password length than the client side policy suggests, so a request made directly against Firebase's API rather than through the application's interface would only be bound by that weaker default. Email addresses are not currently verified at sign up. The application does not perform any live web search or external data retrieval during a debate, meaning every figure or claim produced by a persona comes from the language model's own training knowledge rather than a verified, real time source. These are documented here deliberately, because an honest account of a project's limitations is more useful, and more credible, than a claim of completeness that would not survive scrutiny.

## Running the project locally

Clone the repository and install dependencies with a standard package manager command. Copy the provided environment example file to a real environment file and provide a valid Groq API key, which is required for the debate engine to produce genuine model responses rather than falling back to the deterministic mode. Firebase configuration is provided separately and does not require additional environment variables for basic operation. Once dependencies are installed and the environment file is in place, the development server can be started with the project's standard development command, which runs the Express server directly against the source files.

Building the Android application requires adding the Capacitor Android platform to the project, generating the application icon and splash screen assets from the source files included in the repository, building the web bundle, syncing it into the native project, and then building the APK through Android Studio. Because the compiled mobile application cannot reach a relative API path the way a browser can, a deployed backend URL must be set through the appropriate environment variable before that final build step.

## Honest scope of the project

This project was built as a portfolio piece and a genuine attempt at a differentiated product idea, not as a claim to compete with funded, data grounded market validation platforms. It does not perform live market research, does not verify financial claims against real world data sources, and does not accept file or document based evidence during a debate. What it does do is provide a genuinely interactive, multi turn adversarial reasoning experience that most tools in this space do not attempt, built on a foundation where the security and data handling decisions were made deliberately rather than left as an afterthought.
