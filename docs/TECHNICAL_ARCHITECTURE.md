# Technical Architecture

This document describes the full technology stack behind IdeaCaprice Boardroom, how its layers communicate, and the specific architectural decisions that shape how the system behaves.

## System overview

The application is a full stack, three tier system. A React client renders the interface and manages local application state. An Express server, written in TypeScript, mediates every call to the underlying language model and exposes a small set of purpose built endpoints. Firebase provides authentication and persistent data storage, accessed directly from the client under the protection of server side security rules rather than through the Express server. The same client codebase is packaged as a native Android application using Capacitor, which wraps the compiled web build in a native shell and exposes a small number of native device capabilities where the web platform alone is insufficient.

## Frontend

The client is built with React nineteen and TypeScript, using function components and hooks throughout, with no class based components anywhere in the codebase. Vite handles both the development server and the production build, chosen for its fast cold start and its native support for the tooling this project depends on. Styling is implemented with Tailwind CSS version four, using its newer CSS variable based theming system rather than a traditional configuration file, which allows the entire color palette to be defined in a single stylesheet as a set of named variables consumed throughout the component tree. Motion, the modern successor to Framer Motion, handles animated transitions for debate turns and interface state changes. Lucide provides the icon set, and Recharts renders the score breakdown visualization on the final report screen.

Application state is managed entirely with React's built in state and effect hooks. There is no external state management library, which is an appropriate choice given the application's actual complexity: a small number of top level views, a growing transcript array, and a handful of modal and drawer states, none of which benefit meaningfully from a heavier state management solution.

## Backend

The server is an Express application written in TypeScript, run directly against source files during development using tsx, and bundled into a single CommonJS file with esbuild for production, which is then served with Node's standard runtime rather than through a full framework specific deployment tool. This keeps the deployment surface small and portable across most common Node hosting environments.

The backend exposes three endpoints specific to the debate engine, corresponding to the three phases of a debate session: starting a session with opening statements from two personas, advancing a session by one additional turn in response to a redirect, a defense, or a witness call, and finalizing a session into a structured verdict once the founder is ready. Each endpoint constructs its own carefully structured prompt, tailored to that phase's specific purpose, and each includes its own deterministic, non model based fallback response in case the underlying model provider is unavailable, so a temporary outage degrades the experience rather than breaking it outright.

A fourth endpoint handles generating a downloadable HTML report from a completed debate, used specifically on the web platform, since the native Android build uses a device level filesystem call instead for the equivalent action.

Every request to the two debate advancing endpoints passes through a rate limiting middleware, scoped per client address, specifically to prevent the underlying language model quota from being exhausted by repeated automated requests against a publicly reachable endpoint.

## Language model integration

The debate engine is powered by a large language model accessed through Groq's API, chosen specifically for its low latency inference, which matters directly to a product built around a live, turn based conversation rather than a single background report generation task. The model is called exclusively from the Express server using a server held API key read from an environment variable at runtime. The client has no access to this key in any form, and no call to the model provider originates from client side code anywhere in the codebase.

Each of the three debate phases uses its own dedicated prompt construction function rather than a single shared template. The opening phase prompt is built once per session and produces two initial statements. The round phase prompt is rebuilt on every call and always includes the complete prior transcript as context, so a persona responding to a redirected question or a witness responding to a summons is aware of everything said earlier in that same session. The verdict phase prompt is built once, at the founder's request, and is the only phase that produces the final structured score and report, explicitly instructed to weigh how well the founder's defenses held up during the session rather than simply detecting that a defense occurred.

## Data layer

Firebase Authentication handles account creation and sign in using email and password credentials, along with a password reset flow triggered through Firebase's own email delivery. Firestore serves as the persistence layer for completed debate sessions, with each user's data stored under a document path scoped to that user's own authentication identifier. Firestore security rules enforce that a user can only read, create, or delete records under their own path, and validate the shape of a debate record on write, rather than trusting the client to send well formed data.

A visitor without a registered account can still use the complete debate experience in a temporary guest mode. Guest session data does not persist to Firestore, since there is no stable, authenticated identity to attach it to, and is instead limited to the current browser session only.

## Mobile packaging

Capacitor wraps the compiled web build inside a native Android WebView shell, allowing the same React codebase to run as an installable application without a separate native code base. Two native capabilities are used beyond the base WebView: filesystem access, used to save an exported report directly to the device's storage, and the native application lifecycle plugin, used to bridge the hardware and gesture based back button into the application's own internal view state, so that pressing back steps through the application's screens the way a native Android application is expected to behave, rather than exiting the application unexpectedly.

Because a compiled mobile application has no relative address to resolve an API path against, the client includes an environment driven base URL mechanism specifically for the mobile build, which must be pointed at a deployed instance of the backend before that build is produced. This does not apply to normal web usage, where a relative path resolves correctly against the page's own origin.

## Deployment model

The frontend and backend are designed to be deployed together as a single Node process, with the Express server serving the compiled static frontend bundle directly in production rather than requiring a separate static hosting layer. This keeps the deployment footprint to a single service, suitable for a free or low cost hosting tier appropriate to a project at this stage.
