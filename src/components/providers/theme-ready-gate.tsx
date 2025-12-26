"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const QUOTES: { text: string; author: string }[] = [
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Wealth is the ability to fully experience life.", author: "Henry David Thoreau" },
  { text: "The rich rule over the poor, and the borrower is slave to the lender.", author: "Proverbs 22:7" },
  { text: "Commit to the LORD whatever you do, and he will establish your plans.", author: "Proverbs 16:3" },
  { text: "With hardship comes ease.", author: "Qur’an 94:6" },
  { text: "You have a right to your labor, but not to the fruits of your labor.", author: "Bhagavad Gita 2:47" },
  { text: "As a solid rock is not shaken by the wind, so the wise are not moved by praise or blame.", author: "Dhammapada" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu (Tao Te Ching)" },
  { text: "It does not matter how slowly you go so long as you do not stop.", author: "Confucius (Analects)" },
  { text: "What you seek is seeking you.", author: "Rumi" },
  { text: "Act only according to that maxim whereby you can at the same time will that it should become a universal law.", author: "Immanuel Kant" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", author: "Will Durant (on Aristotle)" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "Opportunities multiply as they are seized.", author: "Sun Tzu" },
  { text: "All the world’s a stage, and all the men and women merely players.", author: "William Shakespeare" },
  { text: "There is nothing either good or bad, but thinking makes it so.", author: "William Shakespeare" },
  { text: "Not all those who wander are lost.", author: "J. R. R. Tolkien" },
  { text: "So it goes.", author: "Kurt Vonnegut" },
  { text: "A book is a dream that you hold in your hand.", author: "Neil Gaiman" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "If I have seen further it is by standing on the shoulders of giants.", author: "Isaac Newton" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The credit belongs to the man who is actually in the arena.", author: "Theodore Roosevelt" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "You miss 100% of the shots you don’t take.", author: "Wayne Gretzky" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
  { text: "The art of progress is to preserve order amid change and to preserve change amid order.", author: "Alfred North Whitehead" },
  { text: "Money is a terrible master but an excellent servant.", author: "P. T. Barnum" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Not everything that counts can be counted, and not everything that can be counted counts.", author: "William Bruce Cameron" },
  { text: "The purpose of business is to create and keep a customer.", author: "Peter Drucker" },
  { text: "Science is organized knowledge. Wisdom is organized life.", author: "Immanuel Kant" },
  { text: "Faith is taking the first step even when you don’t see the whole staircase.", author: "Martin Luther King Jr." },
  { text: "For every action there is an equal and opposite reaction.", author: "Isaac Newton" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "The future is promised to no one.", author: "Wayne Dyer" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "I am because we are.", author: "Ubuntu (Nguni Bantu)" },
  { text: "Arise, awake, and stop not until the goal is reached.", author: "Swami Vivekananda" },
  { text: "Let your life lightly dance on the edges of Time like dew on the tip of a leaf.", author: "Rabindranath Tagore" },
  { text: "In his will is our peace.", author: "Dante Alighieri" },
  { text: "Bear up, my heart, you have borne worse than this.", author: "Homer" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "One who conquers himself is greater than another who conquers a thousand times a thousand on the battlefield.", author: "Dhammapada" },
  { text: "Knowledge without action is meaningless, and action without knowledge is folly.", author: "Al-Ghazali" },

  // Added for financial independence, post-scarcity, and abundance
  { text: "The world has enough for everyone's need, but not everyone's greed.", author: "Mahatma Gandhi" },
  { text: "A rising tide lifts all boats.", author: "John F. Kennedy" },
  { text: "We have it in our power to begin the world over again.", author: "Thomas Paine" },
  { text: "Create more value than you capture.", author: "Tim O’Reilly" },
  { text: "The reasonable man adapts himself to the world; the unreasonable one persists in trying to adapt the world to himself. Therefore all progress depends on the unreasonable man.", author: "George Bernard Shaw" },
  { text: "When ideas have sex, innovation accelerates.", author: "Matt Ridley" },
  { text: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
  { text: "The future is already here—it's just not evenly distributed.", author: "William Gibson" },
  { text: "We are called to be architects of the future, not its victims.", author: "R. Buckminster Fuller" },
  { text: "You never change things by fighting the existing reality. To change something, build a new model that makes the existing model obsolete.", author: "R. Buckminster Fuller" },
  { text: "Do more with less.", author: "R. Buckminster Fuller" },
  { text: "Development is freedom.", author: "Amartya Sen" },
  { text: "The solution to poverty is to abolish it directly by a now widely discussed measure: the guaranteed income.", author: "Martin Luther King Jr." },
  { text: "Poverty is not created by poor people.", author: "Muhammad Yunus" },
  { text: "Price is what you pay; value is what you get.", author: "Warren Buffett" },
  { text: "The best investment you can make is in yourself.", author: "Warren Buffett" },
  { text: "Someone’s sitting in the shade today because someone planted a tree a long time ago.", author: "Warren Buffett" },
  { text: "Take a simple idea and take it seriously.", author: "Charlie Munger" },
  { text: "Make something people want.", author: "Paul Graham" },
  { text: "We always overestimate the change that will occur in the next two years and underestimate the change that will occur in the next ten.", author: "Bill Gates" },
  { text: "Abundance is not about providing everyone on this planet with a life of luxury—it's about providing all with a life of possibility.", author: "Peter H. Diamandis" },
  { text: "Seek wealth, not money or status. Wealth is having assets that earn while you sleep.", author: "Naval Ravikant" },
  { text: "Productize yourself.", author: "Naval Ravikant" },
  { text: "The curious task of economics is to demonstrate to men how little they really know about what they imagine they can design.", author: "F. A. Hayek" },
  { text: "It is not from the benevolence of the butcher, the brewer, or the baker that we expect our dinner, but from their regard to their own interest.", author: "Adam Smith" },
  { text: "Wealth is the product of man’s capacity to think.", author: "Ayn Rand" },
  { text: "The good life is one inspired by love and guided by knowledge.", author: "Bertrand Russell" },
  { text: "A wealth of information creates a poverty of attention.", author: "Herbert A. Simon" },
  { text: "Software is eating the world.", author: "Marc Andreessen" },
  { text: "AI is the new electricity.", author: "Andrew Ng" },
  { text: "Prosperity is not just what we accumulate; it’s what we enable others to become.", author: "Unknown" },
  { text: "We can have prosperity without plunder.", author: "Leon Louw" },
  { text: "The greatest danger in times of turbulence is not the turbulence; it is to act with yesterday’s logic.", author: "Peter Drucker" },
  { text: "The entrepreneur always searches for change, responds to it, and exploits it as an opportunity.", author: "Peter Drucker" },
  { text: "Vision without action is a daydream; action without vision is a nightmare.", author: "Japanese Proverb" },
  { text: "Genius is 1% inspiration and 99% perspiration.", author: "Thomas Edison" },
  { text: "Opportunity is missed by most people because it is dressed in overalls and looks like work.", author: "Thomas Edison" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Fortune favors the prepared mind.", author: "Louis Pasteur" },
  { text: "Don’t let schooling interfere with your education.", author: "Mark Twain" },
  { text: "The beginning is the most important part of the work.", author: "Plato" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { text: "Contentment is natural wealth; luxury is artificial poverty.", author: "Socrates" },
  { text: "He who is not contented with what he has would not be contented with what he would like to have.", author: "Socrates" },
  { text: "Frugality includes all the other virtues.", author: "Cicero" },
  { text: "The man who dies rich dies disgraced.", author: "Andrew Carnegie" },
  { text: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill" },
  { text: "Service to others is the rent you pay for your room here on earth.", author: "Muhammad Ali" },
  { text: "You can have everything in life you want, if you will just help enough other people get what they want.", author: "Zig Ziglar" },
  { text: "Formal education will make you a living; self-education will make you a fortune.", author: "Jim Rohn" },
  { text: "It is not the man who has too little, but the man who craves more, that is poor.", author: "Seneca" },
  { text: "The strongest of all warriors are these two—Time and Patience.", author: "Leo Tolstoy" },
  { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
  { text: "To improve is to change; to be perfect is to change often.", author: "Winston Churchill" },
  { text: "Discontent is the first necessity of progress.", author: "Thomas A. Edison" },
  { text: "Everything should be made as simple as possible, but not simpler.", author: "Albert Einstein" },
  { text: "Wealth flows from energy and ideas.", author: "William Feather" },
  { text: "Capital is that part of wealth which is devoted to obtaining further wealth.", author: "Alfred Marshall" },
  { text: "The most potent weapon in the hands of the oppressor is the mind of the oppressed.", author: "Steve Biko" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Knowledge is power.", author: "Francis Bacon" },
  { text: "Liberty means responsibility. That is why most men dread it.", author: "George Bernard Shaw" },
  { text: "An ounce of action is worth a ton of theory.", author: "Ralph Waldo Emerson" },
  { text: "Whatever you can do or dream you can, begin it. Boldness has genius, power, and magic in it.", author: "Johann Wolfgang von Goethe" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Fortune sides with him who dares.", author: "Virgil" },
  { text: "The greatest wealth is to live content with little.", author: "Plato" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "Your wealth can be stolen, but the precious riches buried deep in your soul cannot.", author: "Minnie Riperton" },
  { text: "It is good to have an end to journey toward; but it is the journey that matters, in the end.", author: "Ursula K. Le Guin" },
  { text: "Things which matter most must never be at the mercy of things which matter least.", author: "Johann Wolfgang von Goethe" },
  { text: "Prosperity is not without many fears and distastes; adversity not without many comforts and hopes.", author: "Francis Bacon" },
  { text: "Wealth is the ability to fully experience life—without stealing it from tomorrow.", author: "Unknown" },
  { text: "Courage is grace under pressure.", author: "Ernest Hemingway" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
  { text: "Where there is charity and wisdom, there is neither fear nor ignorance.", author: "St. Francis of Assisi" },
  { text: "If a man knows not to which port he sails, no wind is favorable.", author: "Seneca" },
  { text: "To know the road ahead, ask those coming back.", author: "Chinese Proverb" },
  { text: "Give me six hours to chop down a tree and I will spend the first four sharpening the axe.", author: "Abraham Lincoln" },
  { text: "Strategy without tactics is the slowest route to victory. Tactics without strategy is the noise before defeat.", author: "Sun Tzu" },
  { text: "Wealth is the product of energy × intelligence × persistence.", author: "Naval Ravikant" },
  { text: "Sustainable abundance is built on trust and compounding cooperation.", author: "Unknown" },
  { text: "The great achievements of civilization have not come from government bureaus.", author: "Milton Friedman" },
  { text: "Inflation is taxation without legislation.", author: "Milton Friedman" },
  { text: "It is better to be roughly right than precisely wrong.", author: "John Maynard Keynes" },
  { text: "For the first time, man will be faced with his real, his permanent problem—how to use his freedom from pressing economic cares.", author: "John Maynard Keynes" },
  { text: "Commerce on the Internet has come to rely almost exclusively on financial institutions serving as trusted third parties.", author: "Satoshi Nakamoto" },
  { text: "None of us is as smart as all of us.", author: "Ken Blanchard" },
  { text: "Alone we are smart. Together we are brilliant.", author: "Steven Anderson" },
  { text: "Wealth is like seawater; the more we drink, the thirstier we become.", author: "Arthur Schopenhauer" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
  { text: "Every day do something that will inch you closer to a better tomorrow.", author: "Doug Firebaugh" },
  { text: "Prosperity is a great teacher; adversity a greater.", author: "William Hazlitt" },
  { text: "The secret to getting ahead is getting started, and the secret to getting started is breaking your complex tasks into small manageable tasks.", author: "Mark Twain" },
  { text: "Wealth is not his that has it, but his that enjoys it.", author: "Benjamin Franklin" },
  { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "All progress takes place outside the comfort zone.", author: "Michael John Bobak" },
  { text: "The only wealth which you will keep forever is the wealth you have given away.", author: "Marcus Aurelius" },
  { text: "The greatest use of life is to spend it for something that will outlast it.", author: "William James" },
  { text: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "Prosperity depends more on wanting what you have than having what you want.", author: "Geoffrey F. Abert" },
  { text: "Good fortune is what happens when opportunity meets with planning.", author: "Thomas Edison" },
  { text: "Nothing is more powerful than an idea whose time has come.", author: "Victor Hugo" },
  { text: "The best way to predict your future is to create it.", author: "Peter Drucker" },
  { text: "Wealth is largely the result of habit.", author: "John Jacob Astor" },
  { text: "The secret of change is to focus all your energy not on fighting the old, but on building the new.", author: "Socrates (attributed)" },
  { text: "Abundance is a process of letting go; that which is empty can receive.", author: "Bryant H. McGill" },
  { text: "Do not save what is left after spending; spend what is left after saving.", author: "Warren Buffett" },
  { text: "Frugality is built on the premise that there is nothing you can’t have; you just can’t have everything.", author: "Calvin Johnson" },
  { text: "Wealth is not his that has much, but his that gives much.", author: "Erich Fromm" },
  { text: "In the long run we are all dead; in the meantime, build.", author: "Unknown" },
  { text: "Abundance is not something we acquire. It is something we tune into.", author: "Wayne Dyer" },
  { text: "The greatest investment you can make is in building systems that outlive you.", author: "Unknown" },
  { text: "Sustainability is the capacity to endure; abundance is the capacity to share that endurance.", author: "Unknown" },
  { text: "The ultimate resource is people—especially skilled, spirited, and hopeful young people endowed with liberty.", author: "Julian Simon" },
  { text: "Optimism is a force multiplier.", author: "Colin Powell" },
  { text: "Do not wait to strike till the iron is hot; make it hot by striking.", author: "William Butler Yeats" },
  { text: "Prosperity begins in the mind and ends in the marketplace.", author: "Unknown" },
  { text: "The most reliable way to predict the future is to build it with others.", author: "Unknown" },
  { text: "Energy, persistence, and a clear purpose conquer all things.", author: "Benjamin Franklin" },
  { text: "Sustainable prosperity comes from compounding trust, technology, and time.", author: "Unknown" },
  { text: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
  { text: "Do not despise small beginnings, for the Lord rejoices to see the work begin.", author: "Zechariah 4:10" },
  { text: "To the one who has, more will be given; from the one who has not, even what he has will be taken away.", author: "Luke 8:18" },
  { text: "Charity does not decrease wealth.", author: "Hadith (Muslim)" },
  { text: "Trust in God, but tie your camel.", author: "Arabic Proverb" },
  { text: "Diligence is the mother of good luck.", author: "Benjamin Franklin" },
  { text: "Fortune favors the bold.", author: "Latin Proverb" },
  { text: "He who would be rich in a day will be hanged in a year.", author: "Leonardo da Vinci" },
  { text: "Do not be embarrassed by your failures; learn from them and start again.", author: "Richard Branson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Sow a thought and you reap an action; sow an act and you reap a habit; sow a habit and you reap a character; sow a character and you reap a destiny.", author: "Ralph Waldo Emerson" },
  { text: "While we do our good works let us not forget that the real solution lies in a world in which charity will have become unnecessary.", author: "Chinua Achebe" },
  { text: "Prosperity is not a matter of money, but of a mindset capable of spotting and creating opportunity.", author: "Unknown" },
  { text: "Wealth is created when knowledge meets purpose and persists through systems.", author: "Unknown" }
];


/**
 * ThemeReadyGate
 * - Detects if a user is present (via /api/auth/me or auth events)
 * - If a user is detected, blocks rendering visually with a loading overlay
 *   until the whitelabel theme is fully loaded (ThemeLoader sets data-pp-theme-ready and dispatches events).
 * - Prevents flash of default theme (FOUC) on portals and app pages for authenticated users.
 */
export function ThemeReadyGate() {
  const [gate, setGate] = useState(true);
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState<string>(() => {
    try {
      return document?.documentElement?.getAttribute("data-pp-theme-stage") || "boot";
    } catch {
      return "boot";
    }
  });
  const [needMerchant, setNeedMerchant] = useState(false);
  const [merchantExpected, setMerchantExpected] = useState(false);
  const [merchantAvailable, setMerchantAvailable] = useState<null | boolean>(null);
  const [consoleReady, setConsoleReady] = useState<boolean>(() => {
    try {
      return document?.documentElement?.getAttribute("data-pp-console-ready") === "1";
    } catch {
      return false;
    }
  });
  const pathname = usePathname() || "";
  const [navBlock, setNavBlock] = useState(false);
  // Navbar height and route-aware overlay offset so the spinner is centered below the visible sticky navbar on Console/Preview
  const [navH, setNavH] = useState(0);
  const isNavUnobstructed = pathname.startsWith("/terminal");
  // Require merchant stage only when merchant theme is explicitly available=true; unknown/unavailable will not block
  const requireMerchantStage = (merchantExpected || needMerchant) && merchantAvailable === true;
  const [qIndex, setQIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [portalReady, setPortalReady] = useState(false);

  // Hold quotes in a ref; shuffle on the client after mount to avoid SSR hydration mismatches.
  const quotesRef = React.useRef<{ text: string; author: string }[]>(QUOTES);

  // Mark mounted to avoid SSR/CSR hydration mismatches for randomized quotes

  // Measure navbar height so we can offset the overlay on routes where the navbar must remain visible
  useEffect(() => {
    try {
      const el = document.querySelector('header');
      const h = el ? el.getBoundingClientRect().height : 0;
      setNavH(h);
    } catch {
      setNavH(0);
    }
  }, [pathname]);

  // After mount: seed a starting index based on current time (no shuffle to avoid hydration mismatch)
  useEffect(() => {
    try {
      const arr = quotesRef.current;
      if (arr && arr.length > 0) {
        const seedIdx = Math.floor(Date.now() % arr.length);
        setQIndex(seedIdx);
      }
    } catch { }
  }, []);



  // Check theme readiness and subscribe to readiness events
  useEffect(() => {
    function check() {
      try {
        const root = document.documentElement;
        const readyAttr = root.getAttribute("data-pp-theme-ready");
        const stageAttr = root.getAttribute("data-pp-theme-stage");
        const expectedAttr = root.getAttribute("data-pp-theme-merchant-expected");
        const availableAttr = root.getAttribute("data-pp-theme-merchant-available");
        const consoleAttr = root.getAttribute("data-pp-console-ready");
        const portalAttr = root.getAttribute("data-pp-portal-ready");
        setReady(readyAttr === "1");
        setStage(stageAttr || "boot");
        setMerchantExpected(expectedAttr === "1");
        setMerchantAvailable(availableAttr === "1" ? true : (availableAttr === "0" ? false : null));
        setConsoleReady(consoleAttr === "1");
        setPortalReady(portalAttr === "1");
        try {
          const url = new URL(window.location.href);
          const r = String(url.searchParams.get("recipient") || "");
          const w = String(url.searchParams.get("wallet") || "");
          const hasMerchantParam = /^0x[a-fA-F0-9]{40}$/.test(r.trim()) || /^0x[a-fA-F0-9]{40}$/.test(w.trim());
          setNeedMerchant(hasMerchantParam);
        } catch {
          setNeedMerchant(false);
        }
      } catch {
        setReady(false);
        setStage("boot");
      }
    }
    check();
    const onReady = () => { check(); };
    const onUpdated = () => { check(); };
    let mo: MutationObserver | null = null;
    try {
      window.addEventListener("pp:theme:ready", onReady as any);
      window.addEventListener("pp:theme:updated", onUpdated as any);
      // Listen for merchant-ready explicitly (portal sets stage after applying vars)
      window.addEventListener("pp:theme:merchant_ready", onUpdated as any);
      window.addEventListener("pp:theme:console_ready", onUpdated as any);
      // Observe root attribute changes so stage/ready updates are caught even without events
      const root = document.documentElement;
      mo = new MutationObserver(() => onUpdated());
      mo.observe(root, {
        attributes: true,
        attributeFilter: [
          "data-pp-theme-stage",
          "data-pp-theme-ready",
          "data-pp-theme-merchant-expected",
          "data-pp-theme-merchant-available",
          "data-pp-console-ready",
          "data-pp-portal-ready",
        ],
      });
    } catch { }
    return () => {
      try {
        window.removeEventListener("pp:theme:ready", onReady as any);
        window.removeEventListener("pp:theme:updated", onUpdated as any);
        window.removeEventListener("pp:theme:merchant_ready", onUpdated as any);
        window.removeEventListener("pp:theme:console_ready", onUpdated as any);
        if (mo) { try { mo.disconnect(); } catch { } }
      } catch { }
    };
  }, []);

  // Listen for explicit portal readiness (receipt + config loaded) to avoid CSS/attr timing issues
  useEffect(() => {
    const onPortalReady = () => {
      setPortalReady(true);
      try {
        const root = document.documentElement;
        root.setAttribute("data-pp-theme-ready", "1");
        root.setAttribute("data-pp-portal-ready", "1");
      } catch { }
    };
    try {
      window.addEventListener("pp:portal:ready", onPortalReady as any);
    } catch { }
    return () => {
      try {
        window.removeEventListener("pp:portal:ready", onPortalReady as any);
      } catch { }
    };
  }, []);

  // Update needMerchant on navigation events
  useEffect(() => {
    function onNav() {
      try {
        const url = new URL(window.location.href);
        const r = String(url.searchParams.get("recipient") || "");
        const w = String(url.searchParams.get("wallet") || "");
        const hasMerchantParam = /^0x[a-fA-F0-9]{40}$/.test(r.trim()) || /^0x[a-fA-F0-9]{40}$/.test(w.trim());
        setNeedMerchant(hasMerchantParam);
      } catch {
        setNeedMerchant(false);
      }
    }
    window.addEventListener("popstate", onNav as any);
    window.addEventListener("hashchange", onNav as any);
    return () => {
      window.removeEventListener("popstate", onNav as any);
      window.removeEventListener("hashchange", onNav as any);
    };
  }, []);

  // Do not reset portalReady on internal path updates to avoid re-blocking after initial render.
  // Once pp:portal:ready is received, keep portalReady true until leaving the portal entirely.
  useEffect(() => {
    // no-op; prevents overlay from reappearing due to incidental pathname updates within the portal
  }, [pathname]);

  // Rotating inspirational quotes under the spinner with graceful crossfade (client-only random)
  useEffect(() => {
    const id = window.setInterval(() => {
      try {
        setQuoteVisible(false);
        window.setTimeout(() => {
          setQIndex((i) => {
            const len = quotesRef.current.length;
            if (len <= 1) return i;
            let next = i;
            // pick a random different index to avoid always playing through sequentially
            for (let t = 0; t < 5; t++) {
              const candidate = Math.floor(Math.random() * len);
              if (candidate !== i) { next = candidate; break; }
            }
            return next;
          });
          setQuoteVisible(true);
        }, 600); // fade-out before swap
      } catch {
        setQIndex((i) => (i + 1) % quotesRef.current.length);
        setQuoteVisible(true);
      }
    }, 6000); // keep each quote visible for ~6s
    return () => window.clearInterval(id);
  }, []);

  // Route-aware transient overlay for Console and Portal Preview
  useEffect(() => {
    try {
      const needNavOverlay = pathname.startsWith("/terminal");
      if (!needNavOverlay) { setNavBlock(false); return; }

      // Show overlay immediately and keep it for a minimum duration to avoid flicker
      setNavBlock(true);
      const minMs = 2200;
      const startedAt = Date.now();
      let cleared = false;
      let pendingTimer: number | null = null;

      const clear = () => {
        if (cleared) return;
        cleared = true;
        if (pendingTimer) { window.clearTimeout(pendingTimer); pendingTimer = null; }
        setNavBlock(false);
      };

      const ensureMinThenClear = () => {
        const elapsed = Date.now() - startedAt;
        const remain = minMs - elapsed;
        if (remain <= 0) {
          clear();
        } else {
          if (pendingTimer) { window.clearTimeout(pendingTimer); }
          pendingTimer = window.setTimeout(clear, remain);
        }
      };

      // Always clear at the minimum duration even if no events fire
      pendingTimer = window.setTimeout(clear, minMs);

      // If the theme signals readiness/updates early, still hold until minimum duration
      const onReady = () => ensureMinThenClear();
      const onUpdated = () => ensureMinThenClear();
      window.addEventListener("pp:theme:ready", onReady as any);
      window.addEventListener("pp:theme:updated", onUpdated as any);

      return () => {
        if (pendingTimer) { window.clearTimeout(pendingTimer); pendingTimer = null; }
        window.removeEventListener("pp:theme:ready", onReady as any);
        window.removeEventListener("pp:theme:updated", onUpdated as any);
      };
    } catch {
      setNavBlock(false);
    }
  }, [pathname]);

  // Safety fallback: avoid blocking indefinitely (e.g., network error).
  // Extend to ~9s for generic pages. Also unblock immediately when merchant theme is explicitly unavailable.
  useEffect(() => {
    const shouldBlock = gate && (!ready || (requireMerchantStage && stage !== "merchant"));
    if (!shouldBlock) return;
    // If merchant theme is explicitly unavailable and merchant theme is required in context, unblock immediately (global theme is sufficient)
    if ((merchantExpected || needMerchant) && merchantAvailable === false) {
      setReady(true);
      try { document.documentElement.setAttribute("data-pp-theme-ready", "1"); } catch { }
      return;
    }
    const t = setTimeout(() => {
      // Only auto-unblock non-merchant flows; merchant portals should remain gated until stage becomes "merchant".
      if (!needMerchant) { setReady(true); try { document.documentElement.setAttribute("data-pp-theme-ready", "1"); } catch { } }
      // Do not force merchant stage; wait for ThemeLoader runtime update.
    }, 9000);
    return () => clearTimeout(t);
  }, [gate, ready, requireMerchantStage, stage, merchantAvailable, needMerchant, merchantExpected]);

  if (!gate) return null;
  const baseBlock = !ready || (requireMerchantStage && stage !== "merchant");
  const isPortalRoute = pathname.startsWith("/portal");
  // For portal routes, show overlay ONLY until pp:portal:ready is received to avoid attribute/stage race conditions.
  // For non-portal routes, fall back to base gating.
  const themeReadyOk = ready && (!requireMerchantStage || stage === "merchant");
  const shouldShow = navBlock || (isPortalRoute ? (!portalReady) : baseBlock);
  if (!shouldShow) return null;

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 z-[9990] transition-opacity duration-300 bg-black/60 backdrop-blur-md`}
      style={{
        top: isNavUnobstructed ? navH : 0,
        isolation: "isolate",
        backdropFilter: "blur(16px) saturate(1.05)",
        WebkitBackdropFilter: "blur(16px) saturate(1.05)",
      }}
    >
      {/* Quotes begin below the centered spinner, without affecting its centering */}
      <div className={`absolute left-1/2 -translate-x-1/2 top-1/2 mt-[64px] text-center text-[11px] max-w-[80vw] md:max-w-md transition-opacity duration-700 ${quoteVisible ? "opacity-80" : "opacity-0"} h-[200px] leading-[16px] overflow-hidden flex flex-col items-center justify-center`}>
        <>
          <div className="opacity-90">{quotesRef.current[qIndex]?.text}</div>
          <div className="opacity-60 italic">• {quotesRef.current[qIndex]?.author}</div>
        </>
      </div>
    </div>
  );
}
