# Project Overview

## What this project is

IdeaCaprice Boardroom is a full stack web and mobile application that puts a business idea in front of an AI powered advisory board and asks the founder to defend it, rather than simply generating a report and stopping there. It is built with a React and TypeScript frontend, an Express backend that mediates every call to a large language model through Groq, Firebase for authentication and data persistence, and a native Android build produced with Capacitor.

The live application can be tried directly at https://ideacaprice-boardroom.vercel.app.

## The problem it responds to

Automated business idea validation is not a new category. Several existing products already occupy it, some with real user bases and, in certain cases, live market data grounding this project intentionally does not attempt to compete with. The honest starting position for this project was that building another version of the same one shot report generator would add nothing meaningful to that space. The actual opportunity was in the interaction model itself: almost every existing tool in this category produces a static, one shot output. None of the ones reviewed during this project's planning offered a genuinely interactive, multi turn argument the user could steer in real time.

## What is different about this project

The core mechanic is a session based debate rather than a single generated report. Two personas, tailored to the specific industry of the submitted idea rather than generic startup archetypes, open with opposing positions. From there, the founder can redirect a specific question to either persona, summon an independent third party witness from a defined set of archetypes such as an investor, a regulator, an industry veteran, or a skeptical customer, or step in directly and defend the idea against a raised objection. A final synthesis step produces a structured score and report only once the founder chooses to end the session, and that score explicitly reflects how well objections were addressed during the conversation rather than treating the debate as separate from the final evaluation.

This required a specific architectural decision: moving from one large, single shot prompt call to a three phase system where every subsequent turn is generated with the full prior transcript as context. That decision is what makes the redirect, witness, and defense features possible at all, and it is the single most significant technical choice in the project.

## What is genuinely good about it

The interaction model is a real differentiator, not a cosmetic one. A person using this product is not reading a report, they are arguing with it, and the final score is demonstrably responsive to how well that argument went, which is verifiable directly in the code rather than a marketing claim about the product's behavior.

The project also has a real, specific security story rather than a vague claim of being secure. A live API key that was originally exposed in client side code, and would have shipped inside the compiled mobile application, was identified and removed, with the entire model integration rebuilt to run server side only. Separately, a mismatch between the application's actual Firestore data paths and its own security rules was found and corrected, a bug that would have silently weakened data protection for real, signed in users without being obviously visible from the outside. Both of these are concrete, describable technical findings, which carries more weight in a technical conversation than an unspecific assurance that a project is safe.

The visual design is clean, internally consistent, and built on a token based color system that allows the entire look of the application to be changed from a small, central set of values rather than requiring changes throughout the component tree, which reflects a deliberate architectural choice rather than an afterthought.

## What is honestly not there yet

This project does not perform live web search or external data retrieval of any kind. Every figure, regulation, or market claim a persona produces comes from the underlying language model's own training knowledge, not a verified, real time source, and that distinction should be stated plainly rather than implied away in how the project is described. The system also does not accept a document, image, or other file as evidence during a debate, only typed text. Email verification is not enforced at account creation, and the server does not independently enforce the password complexity policy that the client interface presents, meaning that policy is currently a user experience guardrail rather than a guaranteed backend constraint.

None of these gaps undermine what the project does accomplish. They define the honest edge of its current scope, and describing that edge accurately is part of what makes the rest of the project's claims credible.

## Who this is built for

The product is best positioned for a specific audience: first time founders, students, and people preparing for a pitch competition, an accelerator interview, or an internal pitch to a small team, who want to rehearse defending an idea under pressure before doing so in a setting with real consequences. It is not positioned to compete with funded, data grounded market validation platforms on the depth or verifiability of their market analysis, and describing it that way would overstate what it currently does.

## Why this project is a meaningful portfolio piece

It demonstrates a full stack build across a real frontend framework, a backend service layer, a managed authentication and database platform, a third party AI provider integration, and a native mobile packaging step, rather than a single layer demo. It demonstrates a specific, non trivial architectural decision, the move to a session based, multi turn conversational architecture, made deliberately to support a product goal rather than adopted by default. And it demonstrates real security judgment: not a claim that the system is secure, but a specific, correctable account of what was found broken, what was fixed, and what remains open, which is a far more convincing signal of engineering maturity than a project with no history of anything having gone wrong in it at all.
