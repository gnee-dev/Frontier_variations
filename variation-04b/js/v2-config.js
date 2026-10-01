/* ==========================================================================
   v2: shared data and program constants (v2.html)
   One source for every section: the How it works cards and estimator read it
   now; the leaderboard will read EXTENSIONS from here too.
   ========================================================================== */
window.FRONTIER_V2_CONFIG = {
  // the live epoch: its multiplier and when it ends (end of day, UTC)
  EPOCH: 1,
  EPOCH_MULTIPLIER: 4,
  EPOCH_END: "2027-03-21T23:59:59Z",

  // assets you can deposit (How it works, card 1); "+ more" follows them
  ASSETS: ["ETH", "SOL", "USDC"],

  // extensions and how many members back them (How it works, card 3; the leaderboard)
  EXTENSIONS: [
    { tld: ".agent", backers: 84 },
    { tld: ".crypto", backers: 57 },
    { tld: ".robot", backers: 31 }
  ],

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
