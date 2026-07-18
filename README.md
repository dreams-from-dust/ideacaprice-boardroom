# IdeaCaprice Boardroom

An AI powered boardroom that debates your business idea instead of just scoring it. Submit an idea, watch two domain specific personas argue for and against it, then redirect questions, call an outside witness, or defend your reasoning before a final verdict is generated.

## Features

* Domain specific personas generated per idea, not fixed generic characters
* Multi round, session based debate you can steer in real time
* Redirect a question to a specific board member
* Call a witness such as an investor, a regulator, or a skeptical customer
* Defend your idea after the verdict and watch the score update
* Firebase authentication with email and password sign in, password reset, and guest mode
* Debate history saved per account in Firestore
* Packaged as a native Android app using Capacitor

## Tech stack

Frontend: React 19, TypeScript, Vite, Tailwind CSS, Motion, Lucide, Recharts
Backend: Express, TypeScript, tsx, esbuild
AI: Groq
Auth and database: Firebase Authentication, Firestore
Mobile: Capacitor

## Getting started

Clone the repository and install dependencies.

```
git clone https://github.com/YOUR_USERNAME/ideacaprice-boardroom.git
cd ideacaprice-boardroom
npm install
```

Copy the environment example file and add your own Groq API key.

```
cp .env.example .env
```

Run the app locally.

```
npm run dev
```

The app runs at `http://localhost:3000`.

## Documentation

The `docs` folder contains a more detailed breakdown of the project, including its software development lifecycle, UI and UX decisions, technical architecture, security considerations, and an honest account of what the project does and does not do.

## License

This project is licensed under the MIT License. See the LICENSE file for details.