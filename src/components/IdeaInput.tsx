import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lightbulb,
  Send,
  Compass,
  Coffee,
  ShieldAlert,
  Sparkles,
  Building,
  Cpu,
  ShieldCheck,
  ChevronRight,
  User,
  Utensils,
  Home,
  HeartPulse,
  Palette,
  Plane,
  Briefcase,
  Smile,
  Users,
  Leaf,
  HelpCircle
} from 'lucide-react';

interface IdeaInputProps {
  onSubmit: (idea: string, boardConfig: string) => void;
  isLoading: boolean;
}

const toSentenceCase = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.split(' ').map(w => {
    if (['and', 'or', 'to', 'for', 'with', 'in', 'of', 'a', 'an', 'the'].includes(w.toLowerCase())) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
};

const IDEA_CATEGORIES = [
  { id: 'food', label: 'food and drink', icon: Utensils },
  { id: 'home', label: 'home and garden', icon: Home },
  { id: 'learning', label: 'smart apps', icon: Cpu },
  { id: 'lifestyle', label: 'pets and family', icon: Users },
  { id: 'green', label: 'eco and green', icon: Leaf },
  { id: 'health', label: 'health and wellness', icon: HeartPulse },
  { id: 'creative', label: 'creative art and design', icon: Palette },
  { id: 'travel', label: 'travel and local fun', icon: Plane },
  { id: 'office', label: 'work and productivity', icon: Briefcase },
  { id: 'kids', label: 'kids and education', icon: Smile }
];

const SAMPLE_IDEAS: Record<string, { title: string; text: string; icon: any }[]> = {
  food: [
    {
      title: 'drone coffee delivery',
      text: 'hot gourmet coffee delivered by drone directly to your high rise terrace or balcony',
      icon: Coffee,
    },
    {
      title: 'backyard pizza clay oven',
      text: 'a portable easy to use wood fired oven delivered to your home for family pizza nights',
      icon: Coffee,
    },
    {
      title: 'local farm meal kits',
      text: 'tasty recipes with exact fresh ingredients from local farms delivered to make quick home cooked dinners',
      icon: Coffee,
    },
    {
      title: 'school lunch planner',
      text: 'an app that gathers allergies and food likes to make healthy weekly school lunch boxes',
      icon: Coffee,
    },
    {
      title: 'fridge recipe matcher',
      text: 'type what leftovers you have inside your fridge and the app suggests easy fast dinners you can make',
      icon: Coffee,
    }
  ],
  home: [
    {
      title: 'smart houseplant rental',
      text: 'rent beautiful indoor plants with a simple moisture sensor that tells you when it needs water',
      icon: Compass,
    },
    {
      title: 'kitchen chopping helper',
      text: 'a small robotic arm for your home kitchen that helps you chop vegetables and prep ingredients safely',
      icon: Compass,
    },
    {
      title: 'furniture refresh kit',
      text: 'rent a kit with easy chemical free tools to fix wood scrapes and polish old desks or tables',
      icon: Compass,
    },
    {
      title: 'smart trash can separator',
      text: 'a household recycling bin that automatically detects and separates glass plastic and cardboard',
      icon: Compass,
    },
    {
      title: 'porch delivery boxes',
      text: 'heavy locked parcel boxes you can place by your front door to stop people from stealing packages',
      icon: Compass,
    }
  ],
  learning: [
    {
      title: 'friendly sound pillow',
      text: 'a soft pillow that plays gentle sounds and cozy stories to help you relax and fall asleep',
      icon: Lightbulb,
    },
    {
      title: 'fun math cartoon lessons',
      text: 'an app that teaches school children math and science using short interactive cartoon animations',
      icon: Lightbulb,
    },
    {
      title: 'quiet party headsets',
      text: 'rent a kit with twenty wireless headphones and audio transmitters for home silent disco backyard parties',
      icon: Lightbulb,
    },
    {
      title: 'seniors activity companion',
      text: 'a simplified tablet app that helps older adults find game groups and call grandkids with one tap',
      icon: Lightbulb,
    },
    {
      title: 'local park audio runner',
      text: 'an app that reads fun cultural stories over your headphones when you run or walk near park landmarks',
      icon: Lightbulb,
    }
  ],
  lifestyle: [
    {
      title: 'custom pet cartoon art',
      text: 'a simple website that turns regular camera photos of your dog or cat into cute fantasy drawing characters',
      icon: Sparkles,
    },
    {
      title: 'subscription dog food',
      text: 'freshly prepared dog safe healthy meal ingredients made from organic goods delivered weekly',
      icon: Sparkles,
    },
    {
      title: 'hands on chemistry kits',
      text: 'subscription boxes full of safe non toxic science projects designed for parents to build with children',
      icon: Sparkles,
    },
    {
      title: 'simple family chore tracker',
      text: 'an interactive wallboard app that awards stars and small pocket rewards to children for cleaning up',
      icon: Sparkles,
    },
    {
      title: 'amateur board game rental',
      text: 'rent premium easy to learn family board games for weekend play instead of buying them',
      icon: Sparkles,
    }
  ],
  green: [
    {
      title: 'clip on bike solar charger',
      text: 'a lightweight mini solar panel that charges your electric bike battery while riding in the sun',
      icon: Compass,
    },
    {
      title: 'rooftop community gardens',
      text: 'tours and workshops showing people how to plant vegetables on flat building roof areas',
      icon: Compass,
    },
    {
      title: 'reusable fabric wrap kits',
      text: 'pretty fabric gift wraps delivered with a prepaid return envelope to replace paper waste',
      icon: Compass,
    },
    {
      title: 'pocket clean water filter',
      text: 'a small attachment for gym water bottles that filters tap chlorine and dust instantly anywhere',
      icon: Compass,
    },
    {
      title: 'air quality sensor badge',
      text: 'a tiny pin you wear on your collar that vibrates or changes color to warn you of heavy dust or high pollen',
      icon: Compass,
    }
  ],
  health: [
    {
      title: 'ambient posture monitor',
      text: 'a smart wooden stand for your desk that uses a gentle ambient light to remind you to sit straight',
      icon: HeartPulse,
    },
    {
      title: 'personal daily vitamin pods',
      text: 'organic daily vitamin packs customized by a nutritionist and shipped to your door monthly',
      icon: HeartPulse,
    },
    {
      title: 'water intake glow bottle',
      text: 'a beautiful insulated water bottle that glows gently when you have been sitting too long without drinking',
      icon: HeartPulse,
    },
    {
      title: 'calming breathing pod',
      text: 'a small smooth handheld pebble that pulses with comforting rhythms to help guide soothing breathing sessions',
      icon: HeartPulse,
    },
    {
      title: 'sleep better lamp',
      text: 'a bedside lamp that gradually shifts light frequencies according to your heart rate to boost deep rest cycles',
      icon: HeartPulse,
    }
  ],
  creative: [
    {
      title: 'custom laser wood engravings',
      text: 'upload physical drawing doodles and have them laser engraved onto organic wooden kitchen boards',
      icon: Palette,
    },
    {
      title: 'kids masterpiece framing',
      text: 'send children drawings in a prepaid mail pouch to receive them professionally mounted in premium wood frames',
      icon: Palette,
    },
    {
      title: 'paint and craft party boxes',
      text: 'curated aesthetic acrylic painting kits delivered monthly with online brush technique tutorial videos',
      icon: Palette,
    },
    {
      title: 'personal storybook maker',
      text: 'create custom printed children books starring your family with illustrated graphics generated on demand',
      icon: Palette,
    },
    {
      title: 'indie art print rental',
      text: 'swap independent museum quality posters and framed canvas arts on subscription to match seasonally changing home decors',
      icon: Palette,
    }
  ],
  travel: [
    {
      title: 'treasure hunt city tours',
      text: 'download clues with friends to find local hidden statues and secret bakery gems in a custom city escape game',
      icon: Plane,
    },
    {
      title: 'rent a kayak app',
      text: 'quickly scan and unlock high safety personal kayaks placed near calm local lake docks for quick afternoon paddles',
      icon: Plane,
    },
    {
      title: 'campfire starter kits',
      text: 'natural beeswax and wood chip fire starters wrapped in vintage cotton delivered directly to State Park campsites',
      icon: Plane,
    },
    {
      title: 'hidden hiking audio guides',
      text: 'interactive voice maps that play historical folk tales over headphones as you walk scenic nature trails',
      icon: Plane,
    },
    {
      title: 'amateur sunset safaris',
      text: 'join small guided group walks to discover highly photogenic city sunset spots and learn phone camera secrets',
      icon: Plane,
    }
  ],
  office: [
    {
      title: 'quiet workspace booths',
      text: 'rent noise proof soundproof wooden cubicles placed inside public libraries or train stations for video calls',
      icon: Briefcase,
    },
    {
      title: 'desk cable management rails',
      text: 'modular magnetic wood tracks that easily snap onto table edges to organize messy phone and laptop cords',
      icon: Briefcase,
    },
    {
      title: 'microbreak wellness app',
      text: 'a desktop widget that guides remote workers through quick three minute physical stretch warmups every hour',
      icon: Briefcase,
    },
    {
      title: 'paper tablet templates',
      text: 'beautiful reusable e ink notebook calendars and paper planner pages optimized for focus layout logs',
      icon: Briefcase,
    },
    {
      title: 'ergonomic wrist rest mats',
      text: 'scented therapeutic hand rests made of breathable linen filled with soothing organic lavender seeds',
      icon: Briefcase,
    }
  ],
  kids: [
    {
      title: 'build your own toy forts',
      text: 'large interlocking high strength paper tubes designed for children to construct dream castles inside living rooms',
      icon: Smile,
    },
    {
      title: 'safe chemistry experiments',
      text: 'subscription envelopes filled with baking soda recipes and fun instruction sheets for kitchen science exploration',
      icon: Smile,
    },
    {
      title: 'puppet show theatre kits',
      text: 'a collapsible cardboard shadow puppet frame and story cards to help spark toddler bedtime creative play',
      icon: Smile,
    },
    {
      title: 'wooden animal block puzzles',
      text: 'organic handmade stacking forest blocks carved from maple wood designed for sensory toddler training',
      icon: Smile,
    },
    {
      title: 'music match sound bells',
      text: 'an easy set of color coded bells with custom songbooks for children to learn nursery rhyme chords instantly',
      icon: Smile,
    }
  ]
};

const BOARDROOM_PRESETS = [
  {
    id: 'classic',
    title: 'growth committee',
    subtitle: 'growth experts',
    description: 'a marketing and business growth expert debates a risk manager focused on pricing models and launching cost',
    icon: Building,
    badgeColor: 'border-peach-medium/20 bg-charcoal-dark text-peach-medium',
  },
  {
    id: 'silicon',
    title: 'product guild',
    subtitle: 'product makers',
    description: 'an advanced technology designer debates a product manager focused on how easily customers can learn and use the product',
    icon: Cpu,
    badgeColor: 'border-peach-medium/20 bg-charcoal-dark text-peach-medium',
  },
  {
    id: 'edtech',
    title: 'edtech learn council',
    subtitle: 'education era',
    description: 'an innovative digital gamification designer debates an academic school board curriculum standards supervisor about learning retention and screen time safety',
    icon: Smile,
    badgeColor: 'border-peach-medium/20 bg-charcoal-dark text-peach-medium',
  },
  {
    id: 'eco',
    title: 'green council',
    subtitle: 'sustainable experts',
    description: 'an eco sustainability strategist debates an operations manager about green sourcing and raw material expenses',
    icon: Leaf,
    badgeColor: 'border-peach-medium/20 bg-charcoal-dark text-peach-medium',
  },
  {
    id: 'consumer',
    title: 'consumer retail panel',
    subtitle: 'brand experts',
    description: 'a viral brand designer debates a veteran logistics manager about customer loyalty and supply chain risks',
    icon: Users,
    badgeColor: 'border-peach-medium/20 bg-charcoal-dark text-peach-medium',
  },
  {
    id: 'enterprise',
    title: 'enterprise syndicate',
    subtitle: 'enterprise sales',
    description: 'a high ticket sales director debates an information security officer about long sales cycles and data safety compliance',
    icon: Briefcase,
    badgeColor: 'border-peach-medium/20 bg-charcoal-dark text-peach-medium',
  },
  {
    id: 'ai_automation',
    title: 'ai automation council',
    subtitle: 'ai and automation',
    description: 'an artificial intelligence integration pioneer debates a traditional operations workflow consultant about automation redundancy and staff retraining costs',
    icon: Sparkles,
    badgeColor: 'border-peach-medium/20 bg-charcoal-dark text-peach-medium',
  },
  {
    id: 'it_security',
    title: 'cyber infrastructure board',
    subtitle: 'tech risk',
    description: 'a white hat cybersecurity specialist debates a legacy systems infrastructure cloud architect about data leak hazards and scaling maintenance fees',
    icon: ShieldAlert,
    badgeColor: 'border-peach-medium/20 bg-charcoal-dark text-peach-medium',
  },
  {
    id: 'health_wellness',
    title: 'bio health wellness guild',
    subtitle: 'health experts',
    description: 'a medical compliance officer debates a consumer fitness trends strategist about healthcare trial barriers and physical device production costs',
    icon: HeartPulse,
    badgeColor: 'border-peach-medium/20 bg-charcoal-dark text-peach-medium',
  },
  {
    id: 'creator_media',
    title: 'creator economy board',
    subtitle: 'media experts',
    description: 'a modern digital agency content producer debates a traditional media intellectual property attorney about audience virality and copyright liabilities',
    icon: Palette,
    badgeColor: 'border-peach-medium/20 bg-charcoal-dark text-peach-medium',
  }
];

const CATEGORY_TO_BOARD_RECOMMENDATION: Record<string, string> = {
  food: 'consumer',
  home: 'consumer',
  learning: 'silicon',
  lifestyle: 'consumer',
  green: 'eco',
  health: 'health_wellness',
  creative: 'creator_media',
  travel: 'classic',
  office: 'enterprise',
  kids: 'edtech'
};

export default function IdeaInput({ onSubmit, isLoading }: IdeaInputProps) {
  const [idea, setIdea] = useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [boardConfig, setBoardConfig] = useState('classic');
  const [activeCategory, setActiveCategory] = useState('food');
  const [error, setError] = useState('');
  const [sampleOpen, setSampleOpen] = useState(false);
  const [adversaryOpen, setAdversaryOpen] = useState(false);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    const recommendedBoard = CATEGORY_TO_BOARD_RECOMMENDATION[catId];
    if (recommendedBoard) {
      setBoardConfig(recommendedBoard);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      setError('please type in a business or startup idea first');
      return;
    }
    if (idea.trim().length < 20) {
      setError('please write at least twenty letters so our ai board has enough detail to help you');
      return;
    }
    setError('');
    onSubmit(idea.trim(), boardConfig);
  };

  const selectSample = (text: string) => {
  setIdea(text);
  setError('');
  // Add this to focus the textarea:
  setTimeout(() => {
    const textarea = document.getElementById('idea-textarea');
    if (textarea) {
      textarea.focus();
    }
  }, 100);
};

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-12 animate-fadeIn font-sans" id="idea-selection-panel">

      {/* ── HERO BANNER ── */}
      <div className="w-full bg-peach rounded-2xl sm:rounded-[3rem] p-5 sm:p-10 md:p-12 text-ink relative overflow-hidden shadow-2xl border border-white/20 select-none mb-8 flex flex-col md:flex-row items-center gap-5 sm:gap-10 min-h-[200px] sm:min-h-[280px]">
        <div className="shrink-0 flex items-center justify-center p-2 sm:p-3 relative bg-peach-light/25 rounded-2xl sm:rounded-[2rem] border border-white/20 shadow-xl">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-peach-light/40 relative flex items-center justify-center border border-white/10 shadow-inner"
          >
            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-3 rounded-full bg-[var(--color-peach-light)] blur p-1" />
            <svg className="w-full h-full absolute z-10 bottom-1" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="80" cy="115" rx="55" ry="18" fill="var(--color-charcoal)" opacity="0.9" />
              <path d="M40 100 C40 85, 52 82, 52 110" stroke="var(--color-charcoal)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="46" cy="78" r="8" stroke="var(--color-charcoal)" strokeWidth="2.5" fill="var(--color-peach-medium)" />
              <path d="M48 83 Q54 85, 58 80" stroke="var(--color-charcoal)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M120 100 C120 85, 108 82, 108 110" stroke="var(--color-charcoal)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="114" cy="78" r="8" stroke="var(--color-charcoal)" strokeWidth="2.5" fill="var(--color-peach-medium)" />
              <path d="M112 83 Q106 85, 102 80" stroke="var(--color-charcoal)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M68 135 C68 115, 92 115, 92 135" stroke="var(--color-charcoal)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="80" cy="98" r="10" stroke="var(--color-charcoal)" strokeWidth="2.8" fill="var(--color-peach-medium)" />
              <rect x="76" y="55" width="8" height="6" rx="2" fill="var(--color-charcoal)" />
              <path d="M72 40 C62 40, 62 18, 80 18 C98 18, 98 40, 88 40" stroke="var(--color-charcoal)" strokeWidth="2.5" fill="var(--color-peach-light)" />
              <path d="M75 52 L85 52" stroke="var(--color-charcoal)" strokeWidth="2.5" />
              <line x1="80" y1="10" x2="80" y2="14" stroke="var(--color-charcoal)" strokeWidth="2" strokeLinecap="round" />
              <line x1="56" y1="24" x2="60" y2="27" stroke="var(--color-charcoal)" strokeWidth="2" strokeLinecap="round" />
              <line x1="104" y1="24" x2="100" y2="27" stroke="var(--color-charcoal)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>
        <div className="flex-grow flex flex-col justify-center text-center md:text-left gap-3">
          <div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-charcoal font-sans leading-tight mb-1.5">Welcome to IdeaCaprice</h2>
            <p className="text-charcoal/90 text-sm sm:text-base leading-relaxed font-sans font-medium max-w-2xl mx-auto md:mx-0">Feel less stressed and more confident with clear simple business planning boards.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 self-center md:self-start">
            <button type="button" onClick={() => { setIdea("A voice guided gamified math app with dynamic challenges and reward tokens for elementary pupils"); setActiveCategory("kids"); setBoardConfig("edtech"); setTimeout(() => { const t = document.getElementById("idea-textarea"); if (t) t.focus(); }, 100); }} className="bg-charcoal hover:bg-charcoal-light text-cream font-medium text-xs sm:text-sm rounded-2xl py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2.5 border border-charcoal cursor-pointer transition-all shadow-xl">
              <Sparkles className="w-4 h-4 text-peach animate-pulse shrink-0" />
              <span>Load Edtech Sample Pitch</span>
              <ChevronRight className="w-3.5 h-3.5 text-peach shrink-0" />
            </button>
            <span className="text-xs text-charcoal/75 font-sans font-bold">Quick start preset</span>
          </div>
        </div>
      </div>

      {/* ── SECTION A: SAMPLE IDEAS — collapsible on mobile ── */}
      <div className="border-2 border-charcoal rounded-[1.75rem] overflow-hidden mb-5">
        <button type="button" onClick={() => setSampleOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-4 bg-charcoal/40 md:pointer-events-none">
          <h3 className="text-xs font-bold text-[var(--color-peach-medium)] font-sans tracking-wide">Choose a sample category to match boards instantly</h3>
          <ChevronRight className={`w-4 h-4 text-peach-medium md:hidden flex-shrink-0 transition-transform duration-300 ${sampleOpen ? 'rotate-[270deg]' : 'rotate-90'}`} />
        </button>
        <div className={`md:block ${sampleOpen ? 'block' : 'hidden'} px-4 sm:px-5 pb-5 pt-2`}>
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {IDEA_CATEGORIES.map((cat) => { const CatIcon = cat.icon; return (
              <button key={cat.id} type="button" onClick={() => handleCategoryChange(cat.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 flex items-center gap-1.5 ${activeCategory === cat.id ? 'bg-peach text-ink border-peach' : 'bg-charcoal/40 text-cream-dim border-charcoal-light hover:border-charcoal hover:bg-charcoal/80'}`}>
                <CatIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{toTitleCase(cat.label)}</span>
              </button>
            ); })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {SAMPLE_IDEAS[activeCategory]?.map((sample, idx) => { const Icon = sample.icon; return (
              <button key={idx} type="button" disabled={isLoading} onClick={() => selectSample(sample.text)} className="group flex flex-col justify-between text-left p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[var(--color-charcoal-soft)] to-[var(--color-charcoal-deep)] hover:from-[var(--color-charcoal-soft)] hover:to-[var(--color-charcoal-deep)] border-2 border-charcoal hover:border-peach-medium/50 transition-all duration-300 cursor-pointer disabled:opacity-40 min-h-[130px] sm:min-h-[160px]">
                <div className="space-y-2">
                  <div className="flex items-start gap-1.5">
                    <span className="p-1.5 rounded-xl bg-charcoal border-2 border-charcoal-light text-peach shrink-0 mt-0.5"><Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></span>
                    <span className="font-extrabold text-cream group-hover:text-peach transition-colors text-sm leading-tight">{toTitleCase(sample.title)}</span>
                  </div>
                  <p className="text-cream-dim text-sm leading-relaxed font-sans">{toSentenceCase(sample.text)}</p>
                </div>
                <span className="text-xs text-[var(--color-peach-medium)]/60 group-hover:text-[var(--color-peach-medium)] font-bold mt-2 flex items-center justify-end gap-1">Convene <span className="group-hover:translate-x-1 transition-transform">→</span></span>
              </button>
            ); })}
          </div>
        </div>
      </div>

      {/* ── SECTION B: ADVISORY BOARD — collapsible on mobile ── */}
      <div className="border-2 border-charcoal rounded-[1.75rem] overflow-hidden mb-8">
        <button type="button" onClick={() => setAdversaryOpen(v => !v)} className="w-full flex items-center justify-between px-5 py-4 bg-charcoal/40 md:pointer-events-none">
          <h3 className="text-xs font-bold text-[var(--color-peach-medium)] font-sans tracking-wide">Choose your advisory board</h3>
          <ChevronRight className={`w-4 h-4 text-peach-medium md:hidden flex-shrink-0 transition-transform duration-300 ${adversaryOpen ? 'rotate-[270deg]' : 'rotate-90'}`} />
        </button>
        <div className={`md:block ${adversaryOpen ? 'block' : 'hidden'} px-4 sm:px-5 pb-5 pt-2`}>

          {/* Explainer card FIRST */}
          <div className="bg-charcoal-dark/40 border-2 border-charcoal-light p-4 sm:p-6 rounded-[1.75rem] mb-5">
            <div className="flex items-center gap-2 text-peach-medium mb-3">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span className="font-sans text-xs sm:text-sm font-bold tracking-wide">How to choose a boardroom setup</span>
            </div>
            <p className="text-sm leading-relaxed text-cream-dim/80 font-sans mb-3 font-semibold">Each advisory board has three roles that start a live simulated conversation:</p>
            <ul className="text-sm leading-relaxed text-cream-dim/70 font-sans list-none space-y-3 ml-1 mb-3">
              <li className="flex gap-2 items-start"><span className="w-2 h-2 rounded-full bg-peach mt-1.5 shrink-0" /><div><strong className="text-peach-medium block font-bold text-sm">The Fan Role</strong><p className="text-cream-dim/60 text-xs mt-0.5">An optimistic advisor who finds advantages and growth leverage to champion your idea.</p></div></li>
              <li className="flex gap-2 items-start"><span className="w-2 h-2 rounded-full bg-[var(--color-peach-medium)] mt-1.5 shrink-0" /><div><strong className="text-[var(--color-peach-medium)] block font-bold text-sm">The Hater Role</strong><p className="text-cream-dim/60 text-xs mt-0.5">A cynical auditor who uncovers main risks, operational costs, and client acquisition barriers.</p></div></li>
              <li className="flex gap-2 items-start"><span className="w-2 h-2 rounded-full bg-peach mt-1.5 shrink-0" /><div><strong className="text-peach-medium block font-bold text-sm">The Boss Role</strong><p className="text-cream-dim/60 text-xs mt-0.5">A wise managing partner who makes the final verdict and gives you a safety percentage score.</p></div></li>
            </ul>
            <div className="text-xs leading-relaxed text-peach font-sans border-t-2 border-charcoal-light pt-3 font-bold">Hint: Select a sector tab above and the best advisory board loads automatically.</div>
          </div>

          {/* Board preset cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {BOARDROOM_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = boardConfig === preset.id;
              const recommendedBoard = CATEGORY_TO_BOARD_RECOMMENDATION[activeCategory];
              const isRecommended = recommendedBoard === preset.id;
              return (
                <button key={preset.id} type="button" disabled={isLoading} onClick={() => setBoardConfig(preset.id)} className={`text-left p-4 sm:p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[140px] sm:min-h-[180px] relative duration-300 group hover:translate-y-[-2px] ${isSelected ? 'bg-gradient-to-br from-charcoal to-[var(--color-charcoal-soft)] border-peach shadow-2xl shadow-peach-medium/10 text-cream' : isRecommended ? 'bg-[var(--color-charcoal-soft)]/60 border-peach-medium/40 hover:border-peach hover:bg-[var(--color-charcoal-soft)]/95 text-cream-dim' : 'bg-[var(--color-charcoal-deep)]/60 border-charcoal hover:border-charcoal-light hover:bg-[var(--color-charcoal-soft)]/80 text-cream-dim'}`}>
                  <div className="w-full flex items-center justify-between gap-1 mb-2">
                    <span className={`p-2 rounded-xl border-2 ${isSelected ? 'text-peach bg-peach-medium/20 border-peach/50 animate-pulse' : 'text-cream-dim/60 bg-charcoal-dark border-charcoal'}`}><Icon className="w-4 h-4" /></span>
                    {isRecommended ? <span className="text-sm bg-peach-medium/30 text-peach px-2 py-0.5 rounded-full font-bold font-sans border border-peach-medium/50 animate-pulse">recommended</span> : <span className={`text-xs font-sans font-semibold px-1.5 py-0.5 rounded-lg border-2 ${preset.badgeColor}`}>{preset.subtitle}</span>}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm mb-1 font-sans text-cream group-hover:text-peach transition-colors">{toTitleCase(preset.title)}</h4>
                    <p className="text-xs leading-relaxed text-cream-dim/75 font-sans group-hover:text-cream transition-colors">{toSentenceCase(preset.description)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION C: INPUT FORM ── */}
      <div className="flex flex-col gap-5 mb-10" id="board-pitch-interactive-form">
        <div className="px-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-charcoal border border-charcoal-light mb-3 select-none">
            <Sparkles className="w-3.5 h-3.5 text-peach-medium animate-pulse" />
            <span className="text-sm font-sans font-bold text-cream-dim">AI Venture Helper</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-cream font-sans">IdeaCaprice Boardroom</h1>
          <p className="mt-2 text-cream-dim text-sm leading-relaxed max-w-2xl font-sans font-normal">Choose an AI advisory board to test your ideas, find potential problems, and calculate a safety and success score.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-charcoal/40 border-2 border-charcoal p-4 sm:p-7 rounded-[2rem] backdrop-blur-md shadow-2xl">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <label htmlFor="idea-textarea" className="text-xs sm:text-sm font-bold text-peach-medium font-sans tracking-wide flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-charcoal border border-charcoal-light flex items-center justify-center text-peach-medium font-bold text-xs">1</span>
                Type your business idea:
              </label>
              <div className="relative">
                <textarea id="idea-textarea" value={idea} onChange={(e) => { setIdea(e.target.value); if (e.target.value.length >= 20) setError(''); }} placeholder="e.g. A subscription service for weekly local vegetable boxes delivered with recipes for busy families" rows={4} disabled={isLoading} className="w-full bg-charcoal-dark border-2 border-charcoal-light hover:border-peach-medium/40 text-cream placeholder-cream-dim/20 rounded-2xl p-4 sm:p-5 pr-12 focus:outline-none focus:ring-2 focus:ring-peach transition-all text-sm sm:text-base resize-none font-sans leading-relaxed shadow-inner" />
                <div className="absolute bottom-3 right-4 text-xs text-cream-dim/30 font-sans">{idea.length}</div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-1 bg-charcoal-dark/45 p-4 rounded-[1.5rem] border-2 border-charcoal-light/60">
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-extrabold text-cream">Ready to convene the AI boardroom</p>
                  <p className="text-xs text-peach-medium font-sans font-bold">Analyzes your pitch using the selection above</p>
                </div>
                <button type="submit" disabled={isLoading} id="pitch-board-button" className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-peach hover:bg-peach-medium text-ink font-bold px-6 py-4 rounded-xl transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm font-sans shrink-0">
                  {isLoading ? (<><div className="w-4 h-4 border-2 border-ink border-t-white rounded-full animate-spin" /><span>Analyzing your idea</span></>) : (<><span>Start Board Debate</span><Send className="w-4 h-4 ml-1 text-ink" /></>)}
                </button>
              </div>
            </div>
          </div>
        </form>

        {error && (
          <div className="flex items-center gap-2 text-peach-medium text-xs sm:text-sm bg-peach-medium/5 border-2 border-peach-medium/20 p-3 rounded-xl animate-fadeIn font-sans">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

    </div>
  );
}