import express from 'express';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── SECRET HANDLING ──────────────────────────────────────────────────────────
// GROQ_API_KEY must come from the environment ONLY. No hardcoded fallback.
// This key never reaches the client bundle because this file (server.ts) never
// ships to the browser/APK — only the compiled frontend in dist/ does.
function getGroqApiKey(): string {
  const envKey = process.env.GROQ_API_KEY;
  if (!envKey || envKey.trim().length === 0) {
    throw new Error(
      'GROQ_API_KEY is not set. Add it to your server .env file (never commit it, never prefix it with VITE_).'
    );
  }
  return envKey;
}

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
// Protects the Groq quota from being drained by anyone who finds the endpoint.
const debateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requests per IP per window — higher because a single multi-round
  // debate session now makes several small calls (opening, each round, verdict)
  // instead of one big call.
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many boardroom requests from this device. Please wait a few minutes and try again.' },
});

// Low-overhead standard query call to Groq.
async function queryGroq(systemInstruction: string, prompt: string, temperature: number, isJson: boolean = false): Promise<string> {
  const apiKey = getGroqApiKey();
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const model = 'llama-3.3-70b-versatile';

  const payload: any = {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ],
    temperature,
    max_tokens: 4096
  };

  if (isJson) {
    payload.response_format = { type: 'json_object' };
  }

  const maxRetries = 4;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('retry-after');
        let sleepMs = (attempt + 1) * 3000;
        if (retryAfterHeader) {
          const parsedSec = parseFloat(retryAfterHeader);
          if (!isNaN(parsedSec)) {
            sleepMs = (parsedSec * 1000) + 750;
          }
        }

        if (sleepMs > 6000) {
          throw new Error(`Groq API rate limit is too high (${sleepMs}ms wait required). Activating instant high-fidelity fallback.`);
        }

        attempt++;
        if (attempt >= maxRetries) {
          const errorText = await response.text();
          throw new Error(`Groq API returned status 429: ${errorText}`);
        }

        console.warn(`[Groq Rate Limit - Attempt ${attempt}/${maxRetries}] Limit hit. Pausing for ${sleepMs}ms before retrying request...`);
        await new Promise((resolve) => setTimeout(resolve, sleepMs));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return content;
    } catch (err: any) {
      if (attempt >= maxRetries - 1) {
        throw err;
      }
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }

  throw new Error('Groq query failed after max retries.');
}

// Recursive String Sanitizer to remove all user-visible hyphens, slashes, and parentheses
function cleanUserStringForApp(str: any): any {
  if (typeof str !== 'string') {
    if (Array.isArray(str)) {
      return str.map(item => cleanUserStringForApp(item));
    } else if (typeof str === 'object' && str !== null) {
      const cleanedObj: any = {};
      for (const key in str) {
        cleanedObj[key] = cleanUserStringForApp(str[key]);
      }
      return cleanedObj;
    }
    return str;
  }
  return str
    .replace(/\//g, ' or ')
    .replace(/\(/g, ' ')
    .replace(/\)/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateDeterministicDebate(idea: string, boardConfig: string, userDefense?: string) {
  const lowerIdea = idea.toLowerCase();
  
  // Custom, intelligent defaults for unit economics matching simple keywords
  let priceEst = 49;
  let costEst = 12;
  let volumeEst = 350;

  if (lowerIdea.includes('drone') || lowerIdea.includes('sensor') || lowerIdea.includes('device') || lowerIdea.includes('hardware')) {
    priceEst = 199;
    costEst = 75;
    volumeEst = 150;
  } else if (lowerIdea.includes('app') || lowerIdea.includes('software') || lowerIdea.includes('website') || lowerIdea.includes('platform')) {
    priceEst = 29;
    costEst = 4;
    volumeEst = 600;
  } else if (lowerIdea.includes('service') || lowerIdea.includes('rent') || lowerIdea.includes('consult')) {
    priceEst = 95;
    costEst = 20;
    volumeEst = 120;
  }

  // Choose names based on boardConfig
  let fanName = "The Fan Innovator";
  let haterName = "The Hater Skeptic";
  
  if (boardConfig === 'silicon') {
    fanName = "Hacker Pioneer";
    haterName = "Strict PM Realist";
  } else if (boardConfig === 'edtech') {
    fanName = "Gamified Learning Designer";
    haterName = "Academic Inspector";
  } else if (boardConfig === 'eco') {
    fanName = "Green Futurist";
    haterName = "Operations Cost Analyst";
  } else if (boardConfig === 'consumer') {
    fanName = "Social Brand Architect";
    haterName = "Logistics Veteran";
  } else if (boardConfig === 'enterprise') {
    fanName = "Enterprise Sales Director";
    haterName = "Corporate Security Hawk";
  } else if (boardConfig === 'ai_automation') {
    fanName = "AI Systems Director";
    haterName = "Human Operations Director";
  } else if (boardConfig === 'it_security') {
    fanName = "Ethical White Hat Scout";
    haterName = "Systems Audit Chief";
  } else if (boardConfig === 'health_wellness') {
    fanName = "Wellness Trends Cultivator";
    haterName = "FDA Compliance Officer";
  } else if (boardConfig === 'creator_media') {
    fanName = "Digital Virality Agent";
    haterName = "Intellectual Property Lawyer";
  }

  // Elegant keyword-based category matching
  let resolvedReport = {
    strengths: [
      `Directly addresses core needs inside this industry sector`,
      "Outstanding potential for customer loyalty and brand lock in",
      "Low initial complexity for pilot tests and closed feedback groups"
    ],
    risks: [
      "High customer acquisition expenses and early marketing resistance",
      "Operational scaling complexity and supply chain issues",
      "Possible replication by fast following competitors with larger capital"
    ],
    mitigations: [
      "Secure early pilot customers using direct outreach to test satisfaction",
      "Use regional partnerships or low cost digital channels for organic growth",
      "Postpone expensive custom developments and use standard open software"
    ],
    executionPlan: [
      "Build a simple mockup and test with five ideal customers within one week",
      "Launch a clean website to collect email waiting list inquiries",
      "Execute a closed test with ten users to confirm delivery costs",
      "Scale marketing channels step by step using early profit cash flow"
    ],
    verdict: `A highly promising business proposal regarding this concepts core feature. While user adoption barriers and customer acquisition expenses require continuous auditing, the strategic advantages warrant a prompt pilot launch.`,
    marketOpportunity: `A robust addressable target market featuring active pain points and healthy demand corridors. Long term growth is highly attainable by keeping early capital requirements lean.`
  };

  let fanSpeech = `This proposition is highly remarkable. By focusing on the core utility here, we can lock in active user interest and command high customer lifetime value. There is massive unserved demand in this segment, and launching early will let us establish high brand authority and capture regional distribution moats before traditional alternatives react. This is a clear opportunity to scale and build a sustainable brand space.`;

  let haterSpeech = `I must strongly disagree with this optimistic outlook. The underlying logistics and customer acquisition friction represent profound challenges. Founders typically underestimate customer retention cliffs and high initial operational overhead. Without a massive marketing budget, scaling this service will lead to quick cash burn. We must scrutinize the unit economics and user onboarding complexity before spending capital.`;

  let defenseImpactText = "";

  // 1. DOMAIN: Assistive Tech / Seniors / Eldercare
  if (lowerIdea.includes('senior') || lowerIdea.includes('older') || lowerIdea.includes('grandkid') || lowerIdea.includes('tablet') || lowerIdea.includes('aging')) {
    fanSpeech = `This is a beautiful and highly necessary venture. By creating a single tap intuitive portal for older adults, we tap into a massive, under served demographic that possesses high purchasing power. The social and digital isolation of seniors is a severe, growing paint point. Designing hardware and software directly around their visual and motor needs is a major competitive moat that traditional, cluttered digital platforms cannot replicate.`;
    
    haterSpeech = `Let us look at the hard truth. Even if older adults want this product, the physical device distribution and onboarding are major bottlenecks. Senior tech products require extensive, high friction customer service and troubleshooting. In addition, your sales cycle usually relies on their adult children purchasing this as a gift, which doubles your customer acquisition costs (CAC) because you have to convince two distinct user segments.`;

    resolvedReport = {
      strengths: [
        "Directly addresses severe social isolation for aging seniors with single touch interfaces",
        "Taps into a massive demographic with high purchasing power and long term brand loyalty",
        "Highly specialized accessible interface creates a strong moat against generic platforms"
      ],
      risks: [
        "Exceptionally high customer support overhead to assist non technical older users",
        "Complex sales cycle relying on adult children to purchase and preconfigure the device",
        "Slow organic adoption and offline resistance compared to standard consumer web apps"
      ],
      mitigations: [
        "Partner directly with senior living communities and eldercare networks for bulk distribution",
        "Direct your primary marketing to adult children showcasing emotional closeness and peace of mind",
        "Provide preconfigured plug and play hardware that works immediately out of the box"
      ],
      executionPlan: [
        "Test a physical cardboard or simple tablet prototype with five seniors in one week",
        "Set up a beautiful landing page with video testimonials targeting worried adult children",
        "Establish bulk pilot trials in two local retirement complexes with minimal support overhead",
        "Form partnerships with regional eldercare agencies to certify safety standards"
      ],
      verdict: `This assistive eldercare concept is deeply practical. By preconfiguring standard hardware and marketing the product as a thoughtful emotional gift to grand children or parents, you bypass high learning curves and secure stable margins. The courtroom warrants an immediate local pilot program.`,
      marketOpportunity: `An expanding silver economy market driven by rising age populations and grand family connections. Because this demographic values reliability above all else margins can remain high without heavy feature bloat.`
    };

    if (userDefense && userDefense.trim().length > 0) {
      defenseImpactText = `The founder rightly addresses senior support concerns. Transitioning to pre configured tablets coordinates with eldercare networks to keep customer acquisition costs lean. If they execute this regional trial with local centers, they can bypass single user onboarding drag. Only hardware distribution logistics require continued tracking.`;
    }
  }
  // 2. DOMAIN: Kids / Education / Learning
  else if (lowerIdea.includes('kid') || lowerIdea.includes('learning') || lowerIdea.includes('math') || lowerIdea.includes('school') || lowerIdea.includes('education') || lowerIdea.includes('child')) {
    fanSpeech = `Education demands immediate digital modernization. By building dynamic, interactive elements for young learners, you convert dry coursework into exciting games. Parents are eagerly seeking educational tools that are productive rather than purely passive screens. There is high organic growth in this sector because parent networks share successful learning apps rapidly.`;
    
    haterSpeech = `The education market is notoriously difficult. School boards have multi year sales cycles and rigid curricula, while individual parents have low attention spans and high attrition rates. Furthermore, kid friendly software faces extreme regulatory guidelines on safety and screen time limits. If you cannot keep a child engaged after the first week, your active users collapse.`;

    resolvedReport = {
      strengths: [
        "Converts educational material into high engagement games that children love",
        "Strong market demand from proactive parents seeking productive screen time tools",
        "Virality is naturally boosted as parent networks actively share teaching resources"
      ],
      risks: [
        "Very fast kid interest drop off and immediate app attrition after several days",
        "Highly strict regulatory requirements regarding children tracking and screen safety",
        "Difficult sales cycles with schools and low direct digital conversion for busy parents"
      ],
      mitigations: [
        "Build recurring short reward seasons to keep curriculum modules fresh and engaging",
        "Enforce strict kid privacy guidelines and obtain trustworthy parent comfort certifications",
        "Establish direct consumer partnerships with home tutor associations and home schooling groups"
      ],
      executionPlan: [
        "Test a simple prototype game module with six school children within one week",
        "Engage with ten parent bloggers to gather initial feedback on screen schedules",
        "Launch an interactive test version on public web portals to track drop off rates",
        "Form pilot partnerships with local tutoring circles to validate learning gains"
      ],
      verdict: `A highly engaging EdTech venture. By bypassing school systems and targeting proactive parents with certified safe, short gamified sessions, you secure immediate recurring premium subscriptions. We back a controlled release.`,
      marketOpportunity: `An expanding global market for digital homeschool aids and gamified curriculum tools. Ensuring data protection and visible kid progress reports are key selling points.`
    };

    if (userDefense && userDefense.trim().length > 0) {
      defenseImpactText = `The founders explanation points out that targeting home school networks avoids long institutional sales cycles. If the interactive rewards keep child motivation steady without safety concerns, this can achieve high retention.`;
    }
  }
  // 3. DOMAIN: Green Tech / Eco / Sustainability
  else if (lowerIdea.includes('green') || lowerIdea.includes('eco') || lowerIdea.includes('solar') || lowerIdea.includes('sustainable') || lowerIdea.includes('energy') || lowerIdea.includes('recycle')) {
    fanSpeech = `This is a vital green venture. Sustainability is no longer a corporate buzzword; it is a critical global priority that consumers actively choose with their wallets. By simplifying things like solar, recycling, or green sourcing, you benefit the environment while establishing a highly premium, eco friendly brand that commands excellent loyalty.`;
    
    haterSpeech = `The main risk with green ventures is the green premium. Consumers support sustainability in surveys, but when choosing products they almost always buy the cheapest traditional options. High hardware costs and complex sourcing logistics make scaling this option difficult unless you have major capital subsidies.`;

    resolvedReport = {
      strengths: [
        "High affinity brand positioning leveraging major global eco friendly priorities",
        "Enables users to directly measure and proudly share their active ecological benefits",
        "Strong potential for regional municipal partnerships and green tax credits"
      ],
      risks: [
        "Heavy initial hardware capital requirements and complex eco sourcing chains",
        "Consumer hesitation to pay a high premium over cheap non sustainable alternatives",
        "Friction in changing long established user habits regarding energy or waste"
      ],
      mitigations: [
        "Focus on cost parity by showing long term energy savings or zero cost materials",
        "Establish community micro networks to gamify green results and local pride",
        "Build partnership ties with local green business councils for early sponsorship"
      ],
      executionPlan: [
        "Interview twelve local homeowners or businesses about green premium thresholds",
        "Build a simple landing page displaying real energy savings and brand values",
        "Execute a safe pilot with five local micro clients using open recycling bins",
        "Expand regional marketing utilizing local carbon offset tracking points"
      ],
      verdict: `A strong sustainable strategy. By keeping physical production light and highlighting fast economic payback rather than just environmental sentiment, you attract practical buyers. We support a strategic pilot rollout.`,
      marketOpportunity: `A rapidly expanding green consumer base seeking practical low carbon alternatives. Commercial models that align environmental benefits with visible household savings win this space.`
    };

    if (userDefense && userDefense.trim().length > 0) {
      defenseImpactText = `The founder makes a realistic point regarding green savings. By integrating cost savings directly into the user value, they minimize customer acquisition friction. Keeping development low cost will solidify early margins.`;
    }
  }
  // 4. DOMAIN: Health / Wellness / Fitness
  else if (lowerIdea.includes('health') || lowerIdea.includes('wellness') || lowerIdea.includes('vitamin') || lowerIdea.includes('diet') || lowerIdea.includes('sleep') || lowerIdea.includes('mindful')) {
    fanSpeech = `Self care and health are massive consumer priorities. By introducing a streamlined tool for wellness, posture, or physical habits, we allow users to regain control over their daily wellbeing. This app addresses core lifestyle friction with micro habits, creating an active daily utility that users check frequently, securing strong retention.`;
    
    haterSpeech = `The wellness and wellness tech space is extremely cluttered. The moment you launch, a hundred fast following app developers copy your features. If you make medical claims, you face extreme regulatory compliance audits and high liability insurance fees. Consumers often abandon fitness habits after several weeks of initial hype.`;

    resolvedReport = {
      strengths: [
        "Taps into deep consumer urges for physical health wellness and preventative habits",
        "Exceptional daily usage frequency resulting in strong app retention and utility",
        "Elegantly styled aesthetic interfaces trigger excellent word of mouth virality"
      ],
      risks: [
        "Extremely high competition and low barriers to entry from generic alternatives",
        "Friction in motivating users to maintain healthy daily habits over long periods",
        "Risk of regulatory safety audits if marketing borders on medical diagnostics"
      ],
      mitigations: [
        "Focus on preventative wellness and mental clarity rather than complex medical advice",
        "Use gamified streaks and social groups to keep daily wellness motivation high",
        "Partner directly with local corporate wellness benefit programs for bulk sales"
      ],
      executionPlan: [
        "Build a simple prototype and test daily habit check ins with eight users in one week",
        "Launch a beautiful landing page containing clear health and posture checklists",
        "Run a corporate pilot with twenty office workers to confirm productivity gains",
        "Roll out targeted digital optimization focused on sustainable long term stress reduction"
      ],
      verdict: `A highly promising wellness solution. By maintaining a clean focus on stress reduction and workplace posture rather than medical advice, you avoid regulatory delays and achieve rapid customer traction. Approved for pilot.`,
      marketOpportunity: `An elite high margin health sector driven by busy professionals seeking stress relief. Minimalist designs paired with gentle habit reminders command high subscription values.`
    };

    if (userDefense && userDefense.trim().length > 0) {
      defenseImpactText = `The safety compliance point raised by the founder is well taken. Shifting from clinical medical models to general corporate wellness eliminates regulatory friction. Keeping user interface loops simple will protect early operating capital.`;
    }
  }
  // 5. DOMAIN: Food / Kitchen / Drone
  else if (lowerIdea.includes('food') || lowerIdea.includes('piz') || lowerIdea.includes('coffe') || lowerIdea.includes('kit') || lowerIdea.includes('fridge') || lowerIdea.includes('lunch')) {
    fanSpeech = `Food and dining are evergreen markets. By introducing convenient, localized food prep or smart recipe matching, we solve the recurring daily stress of 'what to cook'. Users spend a significant portion of their disposable income on food, meaning even slight convenience gains unlock highly profitable consumer cohorts and frequent purchase cycles.`;
    
    haterSpeech = `Logistics inside the food industry are a nightmare. You deal with perishables, storage temperature regulations, supply chain spikes, and extremely tight shipping timetables. If customer deliveries are delayed even slightly, meals spoil and you receive angry refund claims, killing your operating margins.`;

    resolvedReport = {
      strengths: [
        "Strong daily consumer demand targeting the natural paint point of cooking convenience",
        "High average basket sizes and excellent potential for recurring subscription sales",
        "Natural physical visibility creates efficient offline local marketing options"
      ],
      risks: [
        "High operational risk handling fresh ingredients and perishable products",
        "Extreme competition from giant food aggregators with massive capital",
        "Complex supply chains and delivery logistics leading to thin profit margins"
      ],
      mitigations: [
        "Utilize localized hubs and partner with trusted local farmers to keep shipping short",
        "Charge a premium subscription for specialty diet options (e.g., keto, allergy safe)",
        "Optimize dry meal prep kits or recipe software matching to avoid perishable inventory"
      ],
      executionPlan: [
        "Test manual local food delivery with five beta families this weekend",
        "Set up a simple menu selector website to collect local email registrations",
        "Source dry ingredients from local organic vendors to establish direct unit costs",
        "Gradually deploy local region pilots while keeping inventory requirements lean"
      ],
      verdict: `A highly appetizing consumer strategy. By focusing on smart software matching or local organic farm kit subscriptions, you achieve great margins without heavy logistical storage traps. Approved for a quick local pilot.`,
      marketOpportunity: `A robust addressable cooking convenience market with frequent customer repeat rates. Clean, simple recipes that require less than twenty minutes of active prep time command top tier customer loyalty.`
    };

    if (userDefense && userDefense.trim().length > 0) {
      defenseImpactText = `The founder indicates a lean operational route. Sourcing localized farm ingredients or using recipe matching bypasses massive refrigeration and warehouse burdens. This is a very smart way to keep unit economics secure.`;
    }
  }
  // 6. GENERAL PITCH DEBATE PROPOSAL (Zero Truncation - Full Idea in Quotes with Premium Deep Analyses)
  else {
    fanSpeech = `This proposition is highly remarkable. By focusing on the core utility of "${idea}", we can lock in active user interest and command high customer lifetime value. There is massive unserved demand in this segment, and launching early will let us establish high brand authority and capture regional distribution moats before traditional alternatives react. This is a clear opportunity to scale and build a sustainable brand space.`;

    haterSpeech = `I must strongly disagree with this optimistic outlook. The underlying logistics and customer acquisition friction for "${idea}" represent profound challenges. Founders typically underestimate customer retention cliffs and high initial operational overhead. Without a massive marketing budget, scaling this service will lead to quick cash burn. We must scrutinize the unit economics and user onboarding complexity before spending capital.`;

    resolvedReport = {
      strengths: [
        `Directly addresses target client pain points for the entire concept: "${idea}"`,
        "Enables high margin recurring revenues and strong proprietary brand equity, assuring excellent investor payback",
        "Low capital startup barriers allowing rapid pilot prototyping, closed feedback groups, and agile pivots",
        "High affinity positioning that captures premium early adopters, driving viral organic growth loops"
      ],
      risks: [
        "Elevated client acquisition expenses and initial customer inertia towards new product forms",
        "Operational delivery constraints and raw material supply chain fluctuations in volatile times",
        "Fast replication hazards by deep pocketed competitors unless proprietary design or digital moats are established early"
      ],
      mitigations: [
        "Deploy organic customer acquisition channels such as localized micro influencer communities to mitigate customer overhead",
        "Implement a pre order subscription model to secure early self funding and optimize raw production volumes",
        "Secure trade secrets, aesthetic design patents, or localized delivery exclusivity to erect swift defensive moats",
        "Keep initial design features minimal to preserve seed runway until positive cash flow is proven"
      ],
      executionPlan: [
        "Build a fully detailed interactive design mockup and run quick interest interviews with ten ideal prospects within seven days",
        "Launch a premium web landing page to collect email wait list registrations and measure initial conversion rates",
        "Execute a safe geographic pilot with five seed clients using high touch manual fulfillment to prove product satisfaction",
        "Deploy digital advertising funnels and scale operations gradually utilizing early organic profit cash flows"
      ],
      verdict: `A highly promising business proposal regarding "${idea}". It displays robust baseline market feasibility and a clear path toward high margin market readiness. The unique customer hooks and low initial startup capital requirements grant this venture premium competition winning worth, warranting an immediate strategic pilot rollout.`,
      marketOpportunity: `A robust, rapidly expandable addressable target market featuring active human pain points and direct consumer interest. By emphasizing immediate convenience and elegant styling, this asset is positioned to bypass traditional service alternatives, securing a highly profitable niche with rapid growth velocity.`
    };

    if (userDefense && userDefense.trim().length > 0) {
      defenseImpactText = `The founder makes a fair point regarding the defense of this venture. If they can successfully execute regional pilot trials with zero cost channels as described, they might reduce early risk. However, they must still monitor operational overhead closely.`;
    }
  }

  const baseScore = Math.abs(idea.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 20) + 70;
  const overallScore = userDefense ? Math.min(98, baseScore + 6) : baseScore;

  // Final compilation of report object with sanitized submetrics
  const reportObj = {
    ...resolvedReport,
    overallScore,
    subMetrics: {
      marketMoat: Math.max(30, overallScore - 5),
      executionEase: Math.max(30, 100 - overallScore),
      adoptionFeasibility: Math.min(95, overallScore + 3),
      financialViability: Math.min(95, overallScore + 6)
    },
    suggestedPrice: priceEst,
    suggestedUnitCost: costEst,
    suggestedMonthlyUnits: volumeEst
  };

  const timestamp = Date.now();
  const messages: any[] = [
    {
      id: "msg-fan-sim",
      sender: "FAN" as const,
      senderName: fanName,
      text: fanSpeech,
      timestamp: timestamp,
      phase: 1
    },
    {
      id: "msg-hater-sim",
      sender: "HATER" as const,
      senderName: haterName,
      text: haterSpeech,
      timestamp: timestamp + 2500,
      phase: 2
    }
  ];

  if (userDefense && userDefense.trim().length > 0) {
    messages.push({
      id: "msg-defense-sim",
      sender: "BOSS" as const,
      senderName: "Founder Defends Pitch",
      text: userDefense,
      timestamp: timestamp + 5000,
      phase: 2.5
    });
    messages.push({
      id: "msg-hater-counter-sim",
      sender: "HATER" as const,
      senderName: haterName,
      text: defenseImpactText,
      timestamp: timestamp + 7500,
      phase: 2.8
    });
  }

  return {
    idea,
    messages,
    report: reportObj
  };
}


// ── MASTER PROMPT ENGINE ──────────────────────────────────────────────────────
// Single source of truth for how every idea is analyzed. Lives server-side only.

// ── PERSONA NAMING (shared by live prompts and deterministic fallback) ───────
function getPersonaNames(boardConfig: string): { fanName: string; haterName: string } {
  switch (boardConfig) {
    case 'silicon': return { fanName: 'Hacker Pioneer', haterName: 'Strict PM Realist' };
    case 'edtech': return { fanName: 'Gamified Learning Designer', haterName: 'Academic Inspector' };
    case 'eco': return { fanName: 'Green Futurist', haterName: 'Operations Cost Analyst' };
    case 'consumer': return { fanName: 'Social Brand Architect', haterName: 'Logistics Veteran' };
    case 'enterprise': return { fanName: 'Enterprise Sales Director', haterName: 'Corporate Security Hawk' };
    case 'ai_automation': return { fanName: 'AI Systems Director', haterName: 'Human Operations Director' };
    case 'it_security': return { fanName: 'Ethical White Hat Scout', haterName: 'Systems Audit Chief' };
    case 'health_wellness': return { fanName: 'Wellness Trends Cultivator', haterName: 'FDA Compliance Officer' };
    case 'creator_media': return { fanName: 'Digital Virality Agent', haterName: 'Intellectual Property Lawyer' };
    default: return { fanName: 'The Fan Innovator', haterName: 'The Hater Skeptic' };
  }
}

const VOICE_RULES = `
The FAN and HATER must sound like experts in the SPECIFIC industry of the submitted idea, not generic startup advisors. Their job titles, vocabulary, and arguments must all be domain-specific.

If the idea is a university AI tool:
- FAN might be "Chief Digital Transformation Officer, Higher Education"
- HATER might be "Director of Institutional Procurement Risk"
- FAN talks about: LMS integration, FERPA compliance as a feature, reducing TA workload, retention metrics
- HATER talks about: 18-month procurement cycles, IT security review gates, FERPA liability, budget freeze risk, competing with free ChatGPT

If the idea is a food delivery drone:
- FAN might be "Urban Logistics Innovation Analyst"
- HATER might be "FAA Regulatory Compliance Director"
- Topics are: FAA Part 135 certification, geofencing requirements, battery range, weather dependency, last-100-feet problem

If the idea is a consumer fitness app:
- FAN might be "Consumer Health Behavior Economist"
- HATER might be "Mobile App Retention Analyst"
- Topics are: D30 retention rates, CAC on Meta vs TikTok, Apple Health integration, freemium conversion benchmarks

NEVER use generic phrases like "this has a large addressable market" without citing a specific number and source type. NEVER say "execution will be challenging" without naming the specific barrier.
`;

function transcriptToPlainText(transcript: { sender: string; senderName?: string; text: string }[]): string {
  return transcript
    .map((m) => `${m.senderName || m.sender} (${m.sender}): ${m.text}`)
    .join('\n\n');
}

// ── PROMPT 1: OPENING STATEMENTS (Fan + Hater, no verdict yet) ───────────────
function buildOpeningPrompt(): string {
  return `
You are running the opening round of a boardroom debate over a submitted business idea. Two domain-expert personas speak, in this exact order:

1. FAN — an enthusiastic, highly specific domain expert who argues the idea is strong. Must cite a real market figure or adoption statistic, name the specific paying customer segment, and explain one concrete mechanism for traction. Minimum 120 words.
2. HATER — a skeptical domain expert who argues the idea has a serious structural problem. Must name a specific regulatory body, compliance framework, or market incumbent, cite a cost figure or timeline, and identify the single most dangerous weakness. Minimum 120 words.

${VOICE_RULES}

Output STRICT JSON only, no markdown, in this exact shape:
{
  "messages": [
    { "sender": "FAN", "senderName": "<domain-specific title>", "text": "<opening statement>" },
    { "sender": "HATER", "senderName": "<domain-specific title>", "text": "<opening statement>" }
  ]
}
`;
}

// ── PROMPT 2: ONE MORE ROUND (redirect a question, or answer a defense) ─────
const WITNESS_VOICE_GUIDE: Record<string, string> = {
  investor:
    'a seed-stage investor evaluating whether to write a check — focused on unit economics, defensibility, and exit potential, blunt about deal-breakers, indifferent to how exciting the idea sounds',
  regulator:
    'a real regulator with jurisdiction over this exact industry — focused strictly on compliance, licensing, and legal exposure, indifferent to the business case or growth potential',
  industry_veteran:
    'a veteran with 20+ years working inside this exact industry — focused on operational realities and what actually happens day to day, skeptical of anything that sounds like it was written by someone who has never run this kind of operation',
  skeptical_customer:
    'a real, skeptical target customer for this exact product — focused only on whether they personally would pay for it, what would stop them, and what they currently do instead',
  custom: 'a witness invented by the founder for this specific cross-examination, played as credibly and specifically as possible',
};

// ── PROMPT 2: ONE MORE ROUND (redirect a question, answer a defense, or call a witness) ─
function buildRoundPrompt(
  idea: string,
  boardConfig: string,
  transcript: { sender: string; senderName?: string; text: string }[],
  action: {
    type: 'redirect' | 'defend' | 'witness';
    target?: 'FAN' | 'HATER';
    witnessArchetype?: string;
    witnessLabel?: string;
    text: string;
  }
): string {
  const isWitness = action.type === 'witness';
  const respondent = isWitness ? 'WITNESS' : action.type === 'defend' ? 'HATER' : action.target === 'FAN' ? 'FAN' : 'HATER';
  const history = transcriptToPlainText(transcript);

  let instruction: string;
  let senderNameGuidance: string;

  if (isWitness) {
    const archetype = action.witnessArchetype || 'custom';
    const voiceGuide = WITNESS_VOICE_GUIDE[archetype] || WITNESS_VOICE_GUIDE.custom;
    const requestedTitle = action.witnessLabel && action.witnessLabel.trim().length > 0 ? action.witnessLabel.trim() : undefined;
    instruction = `The founder has called a witness to the stand${requestedTitle ? `: "${requestedTitle}"` : ''}. This witness is ${voiceGuide}.\n\nThe founder's question or prompt for this witness: "${action.text.replace(/"/g, "'")}"\n\nThe WITNESS must answer fully in character, giving a genuinely independent perspective distinct from the FAN and HATER already in the transcript — cite at least one concrete figure, regulation, or real-world reference relevant to this exact idea and this exact question. Do not simply restate what the FAN or HATER already said.`;
    senderNameGuidance = requestedTitle
      ? `"${requestedTitle.replace(/"/g, "'")}"`
      : `"<a specific, credible title matching this witness archetype and this exact industry>"`;
  } else if (action.type === 'defend') {
    instruction = `The founder just defended their idea against the board's objections with this statement: "${action.text.replace(/"/g, "'")}"\n\nThe HATER must respond: identify which specific prior objections are NOT addressed by this defense, quantify remaining exposure with a specific dollar figure or timeline, and issue one calibrated warning about the single biggest remaining gap. If the defense genuinely closes a gap, the HATER should concede that specific point before raising the next one — do not manufacture disagreement where none is warranted.`;
    senderNameGuidance = `"<keep the same title this persona already used earlier in the transcript>"`;
  } else {
    instruction = `The founder is redirecting the debate with a specific question aimed at the ${respondent}: "${action.text.replace(/"/g, "'")}"\n\nThe ${respondent} must answer this question directly and specifically, staying fully in character and industry-specific voice, citing at least one concrete figure, regulation, or named competitor relevant to the question.`;
    senderNameGuidance = `"<keep the same title this persona already used earlier in the transcript>"`;
  }

  return `
You are continuing an ongoing boardroom debate about this business idea: "${idea}"
Advisory board style: ${boardConfig}

Full debate so far:
${history}

${instruction}

${VOICE_RULES}

Output STRICT JSON only, no markdown, in this exact shape:
{
  "messages": [
    { "sender": "${respondent}", "senderName": ${senderNameGuidance}, "text": "<response, minimum 100 words>" }
  ]
}
`;
}

// ── PROMPT 3: FINAL VERDICT (uses the whole transcript to score) ────────────
function buildVerdictPrompt(transcript: { sender: string; senderName?: string; text: string }[]): string {
  const history = transcriptToPlainText(transcript);
  const founderRounds = transcript.filter((m) => m.sender === 'FOUNDER').length;

  return `
You are "The Boss" — a managing director synthesizing a completed boardroom debate into a final investment verdict. Every conclusion must be deeply specific to the exact idea debated — generic statements are not acceptable.

Full debate transcript:
${history}

The founder actively defended or redirected the debate ${founderRounds} time(s) during this session. Weigh this into your scoring: objections the founder successfully addressed in the transcript should measurably raise executionEase and adoptionFeasibility versus if they had gone unanswered; objections that were raised and never addressed should keep those sub-scores lower. Do not give credit for defenses that dodged the question.

═══════════════════════════════════════════════════════════
STEP 0 — REVENUE MODEL DETECTION (run this first, always)
═══════════════════════════════════════════════════════════

Identify the revenue architecture by answering:
Q1 WHO IS THE PAYING CUSTOMER (not always the end user)?
Q2 WHAT IS THE REVENUE MECHANISM (DIRECT_SALE, SUBSCRIPTION_CONSUMER, SUBSCRIPTION_B2B, MARKETPLACE_TAKE_RATE, ADVERTISING, FREEMIUM_UPGRADE, PROFESSIONAL_SERVICES, HARDWARE_PLUS_CONSUMABLES, DATA_LICENSING, GRANT_OR_DONOR, or API_USAGE)?
Q3 IS VOLUME MONTHLY OR ANNUAL, based on the sales motion implied by Q1/Q2?

═══════════════════════════════════════════════════════════
STEP 1 — FEASIBILITY GATE
═══════════════════════════════════════════════════════════
If the idea requires technology that does not exist in ${new Date().getFullYear()}, violates physics, or is legally impossible everywhere on Earth, assign overallScore 2-12, set strengths/risks/mitigations/executionPlan to [], set all financial values to 0, and explain exactly why in the verdict.

═══════════════════════════════════════════════════════════
STEP 2 — SECTOR-SPECIFIC FINANCIAL CALIBRATION (use real benchmarks, never invent optimistic numbers)
═══════════════════════════════════════════════════════════
CONSUMER PHYSICAL GOODS: gross margin 30-55%, CAC $15-80, price $10-500.
CONSUMER SOFTWARE/APP: gross margin 70-85%, CAC $3-25 organic / $40-120 paid, price $2-50/month.
B2B SAAS (SMB): gross margin 65-80%, CAC $500-3000, contract value $1000-24000/year.
B2B SAAS (ENTERPRISE): gross margin 70-85%, CAC $5000-50000, contract value $20000-500000/year.
MARKETPLACE: gross margin on take rate 60-80%, take rate 5-25%.
ADVERTISING-SUPPORTED: CPM $2-8 consumer / $15-40 B2B, MAU to revenue ratio $0.50-4/MAU/month.
PROFESSIONAL SERVICES: gross margin 40-65%, billable rate $50-350/hour, utilization 60-75%.
FOOD & BEVERAGE: gross margin 25-42%, CAC $8-40, high churn, location-dependent.
HARDWARE + IOT: gross margin 20-38%, certifications add $10000-100000 upfront.
HEALTHCARE/BIOTECH: FDA Class II takes 2-5 years, Class III 5-10 years, margins 60-85% post-approval.
EDUCATION TECH: LTV/CAC must exceed 3x, completion rates 8-15%, B2C CAC $40-150.
REAL ESTATE/PROPTECH: transaction fees 0.5-3%, long sales cycles 3-12 months.

═══════════════════════════════════════════════════════════
STEP 3 — B2B / INSTITUTIONAL PENALTY MATRIX (apply when payer is a business, institution, hospital, university, or government)
═══════════════════════════════════════════════════════════
Sales cycle 3-6 months → executionEase -15, adoptionFeasibility -10
Sales cycle 6-18 months → executionEase -30, adoptionFeasibility -20
Requires IT security review (SOC2/GDPR/FERPA/HIPAA) → executionEase -12, overallScore -8
Requires legal/procurement committee approval → adoptionFeasibility -15
Multiple stakeholder sign-offs (>3 people) → adoptionFeasibility -10
Capital requirement >$200K before first revenue → overallScore -12
No existing budget line for this category → adoptionFeasibility -20

═══════════════════════════════════════════════════════════
STEP 4 — OVERALLSCORE CALIBRATION
═══════════════════════════════════════════════════════════
0-15 science fiction/illegal/zero market. 16-29 fatal structural barrier. 30-44 executable but severe margin/competition problems. 45-59 real opportunity, high execution difficulty. 60-74 commercially viable defensible niche. 75-84 strong fundamentals. 85-92 rare large underserved market. 93-100 once-per-decade trillion-dollar TAM.

═══════════════════════════════════════════════════════════
STEP 5 — FINANCIAL INTEGRITY CONSTRAINTS
═══════════════════════════════════════════════════════════
primaryMetricValue (price) MUST be strictly greater than secondaryMetricValue (cost) — at most 58% of price.
projectedVolumeValue must reflect a bootstrapped founder with $0-50K in savings:
B2B enterprise 6-18mo cycle: 2-6 clients Year 1 (annual). B2B SMB SaaS: 15-80 businesses Year 1 (annual). Consumer app organic: 200-2000 MAU-payers Month 12 (monthly). Physical DTC: 30-300 monthly orders Month 6 (monthly). Marketplace: 50-500 monthly transactions Month 6 (monthly). Advertising: 5000-50000 MAU Month 12, $0.50-2.00/MAU (monthly).
For advertising/freemium: primaryMetricValue = revenue per user per month, secondaryMetricValue = cost to serve one user per month.

═══════════════════════════════════════════════════════════
OUTPUT FORMAT — strict JSON, no markdown, no trailing commas
═══════════════════════════════════════════════════════════
{
  "revenueArchitecture": {
    "payingCustomer": "<who actually writes the check>",
    "revenueModel": "<one REVENUE_MECHANISM value>",
    "endUserPaysDirectly": <true/false>,
    "revenueExplanation": "<one sentence explaining the money flow>"
  },
  "report": {
    "strengths": ["<20+ words, concrete mechanism>", "<20+ words, paying customer behavior>", "<20+ words, unit economic advantage with a number>"],
    "risks": ["<20+ words, regulation/cost/competitor>", "<20+ words, adoption/CAC risk>", "<20+ words, capital/execution risk with timeline>"],
    "mitigations": ["<concrete strategy for risk 1>", "<concrete strategy for risk 2>", "<concrete strategy for risk 3>"],
    "executionPlan": ["<Phase 1 milestone with timeframe>", "<Phase 2>", "<Phase 3>", "<Phase 4>"],
    "verdict": "<5-7 sentences: revenue model + thesis soundness; key execution variable; biggest structural risk and survival condition; realistic Year 1 revenue range; definitive recommendation (bootstrappable/angel-fundable/VC-scale/not viable) referencing how well the founder's defenses in the transcript held up>",
    "overallScore": <integer 0-100 with B2B penalties applied>,
    "subMetrics": {
      "marketMoat": <integer 0-100>,
      "executionEase": <integer 0-100>,
      "adoptionFeasibility": <integer 0-100>,
      "financialViability": <integer 0-100>
    },
    "marketOpportunity": "<4 sentences: TAM with figure+source type; beachhead segment and current spend; tailwind/headwind; realistic Year 1 addressable market>",
    "financials": {
      "businessModelType": "<descriptor>",
      "payingCustomerNote": "<one sentence clarifying who pays vs who uses>",
      "primaryMetricLabel": "<label>",
      "primaryMetricValue": <number, or 0 if infeasible>,
      "secondaryMetricLabel": "<label>",
      "secondaryMetricValue": <number, strictly < primaryMetricValue, or 0 if infeasible>,
      "projectedVolumeLabel": "<label>",
      "projectedVolumeValue": <number, or 0 if infeasible>,
      "volumeIsAnnual": <true/false>,
      "revenueModelSummary": "<one sentence>"
    },
    "recommendedBoard": "<one of: classic, silicon, edtech, eco, consumer, enterprise, ai_automation, it_security, health_wellness, creator_media>"
  }
}

CRITICAL: If overallScore < 20, set strengths, risks, mitigations, executionPlan to [] and all financial numeric values to 0.
`;
}

function parseGroqJson(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  cleaned = cleaned.trim();

  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
  return JSON.parse(cleaned);
}

function applyFinancialsPostProcessing(report: any): any {
  if (report?.financials) {
    const f = report.financials;
    const rawPrice = typeof f.primaryMetricValue === 'number' ? f.primaryMetricValue : 0;
    let rawCost = typeof f.secondaryMetricValue === 'number' ? f.secondaryMetricValue : 0;
    const rawVolume = typeof f.projectedVolumeValue === 'number' ? f.projectedVolumeValue : 0;
    const isAnnual = f.volumeIsAnnual === true || f.volumeIsAnnual === 'true';

    if (rawPrice > 0 && rawCost >= rawPrice) {
      rawCost = Math.round(rawPrice * 0.5);
    }
    const sliderVolume = isAnnual ? Math.max(1, Math.round(rawVolume / 12)) : rawVolume;

    report.suggestedPrice = rawPrice;
    report.suggestedUnitCost = rawCost;
    report.suggestedMonthlyUnits = sliderVolume;
    report.primaryMetricLabel = f.primaryMetricLabel || 'Price';
    report.secondaryMetricLabel = f.secondaryMetricLabel || 'Cost';
    report.projectedVolumeLabel = isAnnual
      ? `${f.projectedVolumeLabel || 'Annual Clients'} (÷12 = monthly avg)`
      : f.projectedVolumeLabel || 'Monthly Volume';
    report.businessModelType = f.businessModelType || '';
    report.payingCustomerNote = f.payingCustomerNote || '';
    report.revenueModelSummary = f.revenueModelSummary || '';
    report.volumeIsAnnual = isAnnual;
  }

  if (report && !report.subMetrics) {
    const s = report.overallScore || 0;
    report.subMetrics = {
      marketMoat: Math.min(100, Math.round(s * 0.92)),
      executionEase: Math.min(100, Math.round(s * 0.82)),
      adoptionFeasibility: Math.min(100, Math.round(s * 1.02)),
      financialViability: Math.min(100, Math.round(s * 0.96)),
    };
  }

  if (report?.overallScore < 20) {
    report.strengths = [];
    report.risks = [];
    report.mitigations = [];
    report.executionPlan = [];
    report.suggestedPrice = 0;
    report.suggestedUnitCost = 0;
    report.suggestedMonthlyUnits = 0;
  }

  if (!report.suggestedPrice) report.suggestedPrice = 49;
  if (!report.suggestedUnitCost) report.suggestedUnitCost = Math.round(report.suggestedPrice * 0.25);
  if (!report.suggestedMonthlyUnits) report.suggestedMonthlyUnits = 250;

  return report;
}

// ── DETERMINISTIC FALLBACKS (Groq unavailable) — derived from the same keyword
// engine as before, split into the three phases the new multi-round flow needs.
function generateDeterministicOpening(idea: string, boardConfig: string) {
  const full = generateDeterministicDebate(idea, boardConfig);
  return { messages: full.messages.slice(0, 2) };
}

const WITNESS_FALLBACK_NAMES: Record<string, string> = {
  investor: 'Seed-Stage Investor',
  regulator: 'Industry Regulator',
  industry_veteran: '20-Year Industry Veteran',
  skeptical_customer: 'Skeptical Target Customer',
  custom: 'Independent Witness',
};

function generateDeterministicRound(
  idea: string,
  boardConfig: string,
  action: { type: 'redirect' | 'defend' | 'witness'; target?: 'FAN' | 'HATER'; witnessArchetype?: string; witnessLabel?: string; text: string }
) {
  const { fanName, haterName } = getPersonaNames(boardConfig);
  const isWitness = action.type === 'witness';
  const respondent = isWitness ? 'WITNESS' : action.type === 'defend' ? 'HATER' : action.target === 'FAN' ? 'FAN' : 'HATER';
  const respondentName = isWitness
    ? action.witnessLabel?.trim() || WITNESS_FALLBACK_NAMES[action.witnessArchetype || 'custom']
    : respondent === 'FAN' ? fanName : haterName;

  const text = isWitness
    ? `Speaking plainly on "${idea}": from where I sit, the real question is whether this holds up outside a pitch room, under normal conditions, with normal budgets and normal timelines. It's not a no, but it's not a yes either until that's been tested with people who aren't invested in it succeeding.`
    : action.type === 'defend'
    ? `That defense addresses part of the concern, but the core exposure around "${idea}" remains: acquisition cost and operational timeline are still the deciding factor here, and one strong counterargument does not remove that risk. I'd want to see it validated with real pilot data before treating it as resolved.`
    : `On that specific point regarding "${idea}": the honest answer depends on execution speed and whether you can secure the first cohort of customers before a better-funded competitor reacts. It's a real consideration, not a dealbreaker, but it needs a concrete plan, not just intent.`;

  return {
    messages: [
      {
        id: `msg-round-sim-${Date.now()}`,
        sender: respondent,
        senderName: respondentName,
        text,
        timestamp: Date.now(),
        phase: 'round',
      },
    ],
  };
}

function generateDeterministicVerdict(idea: string, boardConfig: string, founderRounds: number) {
  const full = generateDeterministicDebate(idea, boardConfig, founderRounds > 0 ? 'founder engaged in active back-and-forth defense' : undefined);
  const report = { ...full.report };
  if (founderRounds > 0) {
    report.overallScore = Math.min(98, report.overallScore + Math.min(founderRounds * 2, 8));
    report.subMetrics = {
      marketMoat: report.subMetrics.marketMoat,
      executionEase: Math.min(98, report.subMetrics.executionEase + Math.min(founderRounds * 3, 10)),
      adoptionFeasibility: Math.min(98, report.subMetrics.adoptionFeasibility + Math.min(founderRounds * 3, 10)),
      financialViability: report.subMetrics.financialViability,
    };
  }
  return report;
}

// ── ROUTE 1: start a debate — Fan + Hater opening statements only ───────────
app.post('/api/debate/start', debateLimiter, async (req, res) => {
  const { idea, boardConfig = 'classic' } = req.body;

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    res.status(400).json({ error: 'Please provide a valid business or project idea to pitch to the Boardroom.' });
    return;
  }
  if (idea.length > 2000) {
    res.status(400).json({ error: 'Idea text is too long. Please keep it under 2000 characters.' });
    return;
  }

  try {
    const raw = await queryGroq(buildOpeningPrompt(), `Evaluate this business idea: "${idea}"\n\nAdvisory board style: ${boardConfig}`, 0.6, true);
    const parsed = parseGroqJson(raw);
    if (!Array.isArray(parsed.messages) || parsed.messages.length < 2) {
      throw new Error('Malformed opening response from model.');
    }
    const nowMs = Date.now();
    const messages = parsed.messages.map((m: any, i: number) => ({
      id: `msg-${i === 0 ? 'fan' : 'hater'}-${nowMs}`,
      sender: m.sender,
      senderName: m.senderName,
      text: m.text,
      timestamp: nowMs + i * 15,
      phase: i + 1,
    }));
    res.json(cleanUserStringForApp({ messages }));
  } catch (err: any) {
    console.warn('Opening call failed, using deterministic fallback.', err.message || err);
    try {
      res.json(cleanUserStringForApp(generateDeterministicOpening(idea, boardConfig)));
    } catch (fallbackErr: any) {
      console.error('Deterministic opening fallback also failed.', fallbackErr.message || fallbackErr);
      res.status(500).json({ error: 'The boardroom is temporarily unavailable. Please try again in a moment.' });
    }
  }
});

// ── ROUTE 2: one more round — redirect, defend, or call a witness ──────────
app.post('/api/debate/round', debateLimiter, async (req, res) => {
  const { idea, boardConfig = 'classic', transcript, action } = req.body;

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    res.status(400).json({ error: 'Missing idea for this debate session.' });
    return;
  }
  if (!Array.isArray(transcript) || transcript.length === 0) {
    res.status(400).json({ error: 'Missing prior transcript for this round.' });
    return;
  }
  if (!action || typeof action.text !== 'string' || action.text.trim().length === 0) {
    res.status(400).json({ error: 'Please enter a question or defense before continuing the debate.' });
    return;
  }
  if (action.text.length > 1500) {
    res.status(400).json({ error: 'That message is too long. Please keep it under 1500 characters.' });
    return;
  }
  if (action.type === 'redirect' && action.target !== 'FAN' && action.target !== 'HATER') {
    res.status(400).json({ error: 'Please choose which board member to redirect the question to.' });
    return;
  }
  const validWitnessArchetypes = ['investor', 'regulator', 'industry_veteran', 'skeptical_customer', 'custom'];
  if (action.type === 'witness') {
    if (!action.witnessArchetype || !validWitnessArchetypes.includes(action.witnessArchetype)) {
      res.status(400).json({ error: 'Please choose a valid witness type.' });
      return;
    }
    if (action.witnessLabel && (typeof action.witnessLabel !== 'string' || action.witnessLabel.length > 100)) {
      res.status(400).json({ error: 'Witness title is too long. Please keep it under 100 characters.' });
      return;
    }
  }
  if (transcript.length > 40) {
    res.status(400).json({ error: 'This debate has reached its maximum length. Please request the final verdict.' });
    return;
  }

  try {
    const prompt = buildRoundPrompt(idea, boardConfig, transcript, action);
    const raw = await queryGroq(prompt, `Continue the debate now.`, 0.6, true);
    const parsed = parseGroqJson(raw);
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      throw new Error('Malformed round response from model.');
    }
    const nowMs = Date.now();
    const messages = parsed.messages.map((m: any, i: number) => ({
      id: `msg-round-${nowMs}-${i}`,
      sender: m.sender,
      senderName: m.senderName,
      text: m.text,
      timestamp: nowMs + i * 10,
      phase: 'round',
    }));
    res.json(cleanUserStringForApp({ messages }));
  } catch (err: any) {
    console.warn('Round call failed, using deterministic fallback.', err.message || err);
    try {
      res.json(cleanUserStringForApp(generateDeterministicRound(idea, boardConfig, action)));
    } catch (fallbackErr: any) {
      console.error('Deterministic round fallback also failed.', fallbackErr.message || fallbackErr);
      res.status(500).json({ error: 'The boardroom is temporarily unavailable. Please try again in a moment.' });
    }
  }
});

// ── ROUTE 3: final verdict — Boss synthesizes the whole transcript ─────────
app.post('/api/debate/verdict', debateLimiter, async (req, res) => {
  const { idea, boardConfig = 'classic', transcript } = req.body;

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    res.status(400).json({ error: 'Missing idea for this debate session.' });
    return;
  }
  if (!Array.isArray(transcript) || transcript.length === 0) {
    res.status(400).json({ error: 'Missing transcript to base a verdict on.' });
    return;
  }

  const founderRounds = transcript.filter((m: any) => m.sender === 'FOUNDER').length;

  try {
    const prompt = buildVerdictPrompt(transcript);
    const raw = await queryGroq(prompt, `Deliver the final verdict for: "${idea}" (board style: ${boardConfig})`, 0.5, true);
    const parsed = parseGroqJson(raw);
    if (!parsed.report) throw new Error('Model response missing report object.');
    const finalReport = applyFinancialsPostProcessing(parsed.report);
    res.json(cleanUserStringForApp({ report: finalReport }));
  } catch (err: any) {
    console.warn('Verdict call failed, using deterministic fallback.', err.message || err);
    try {
      const report = generateDeterministicVerdict(idea, boardConfig, founderRounds);
      res.json(cleanUserStringForApp({ report }));
    } catch (fallbackErr: any) {
      console.error('Deterministic verdict fallback also failed.', fallbackErr.message || fallbackErr);
      res.status(500).json({ error: 'The boardroom is temporarily unavailable. Please try again in a moment.' });
    }
  }
});

app.post('/api/download-report', (req, res) => {
  const { html, filename } = req.body;
  if (!html) {
    res.status(400).send('Missing report content for download');
    return;
  }
  const safeFilename = filename || `IdeaCaprice_boardroom_report_${Date.now()}.html`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.send(html);
});

// ── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
// Final safety net. Any error that reaches this point means something threw
// outside of a route's own try/catch, most useful in a serverless
// environment like Vercel, where an unhandled error can otherwise surface as
// an opaque, undiagnosable 500 with no body at all. This guarantees a real
// JSON response and logs the actual message server side for debugging.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err?.message || err);
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).json({ error: 'Something went wrong on our end. Please try again in a moment.' });
});

export default app;