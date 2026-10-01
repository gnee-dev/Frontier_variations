/* ==========================================================================
   v2: shared data and program constants (v2.html)
   One source for every section: How it works (cards, estimator), the
   leaderboard and the partner preview all read it.
   ========================================================================== */
window.FRONTIER_V2_CONFIG = {
  // the live epoch: its multiplier and when it ends (end of day, UTC)
  EPOCH: 1,
  EPOCH_MULTIPLIER: 4,
  EPOCH_END: "2027-03-21T23:59:59Z",

  // assets you can deposit (How it works, card 1); "+ more" follows them
  ASSETS: ["ETH", "SOL", "USDC"],

  // extensions: one list for every section (How it works card 3, the leaderboard,
  // the partner preview). backers: null = not published yet (shown as [##]).
  // category drives the leaderboard filters (All / AI / Crypto / Identity).
  EXTENSIONS: [
    { tld: ".agent",  backers: 84,   category: "AI",       applicant: "[Applicant]", status: "Applied", applied: "Aug 2026", launch: "2027" },
    { tld: ".crypto", backers: 57,   category: "Crypto",   applicant: "[Applicant]", status: "Applied", applied: "Aug 2026", launch: "2027" },
    { tld: ".robot",  backers: 31,   category: "AI",       applicant: "[Applicant]", status: "Applied", applied: "Aug 2026", launch: "2027" },
    { tld: ".hype",   backers: null, category: "Crypto",   applicant: "[Applicant]", status: "Applied", applied: "Aug 2026", launch: "2027" },
    { tld: ".human",  backers: null, category: "Identity", applicant: "[Applicant]", status: "Applied", applied: "Aug 2026", launch: "2027" },
    { tld: ".btc",    backers: null, category: "Crypto",   applicant: "[Applicant]", status: "Applied", applied: "Aug 2026", launch: "2027" },
    { tld: ".sol",    backers: null, category: "Crypto",   applicant: "[Applicant]", status: "Applied", applied: "Aug 2026", launch: "2027" },
    { tld: ".gate",   backers: null, category: "Identity", applicant: "[Applicant]", status: "Applied", applied: "Aug 2026", launch: "2027" }
  ],
  // the leaderboard's filters, in order ("All" first)
  CATEGORIES: ["All", "AI", "Crypto", "Identity"],

  // the points estimator: deposit amounts ($) and how long you hold (days; "epoch" =
  // the days left until EPOCH_END, worked out when the page loads)
  ESTIMATOR: {
    DEPOSITS: [500, 2000, 10000, 50000],
    DEFAULT_DEPOSIT: 2000,
    HOLDS: [
      { label: "30 days", days: 30 },
      { label: "90 days", days: 90 },
      { label: "Until epoch ends", days: "epoch" }
    ],
    DEFAULT_HOLD: 90
  }
};
