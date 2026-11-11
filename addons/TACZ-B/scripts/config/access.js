// Friends-only access, enforced by script.
// Why: behind the playit tunnel the server runs behind the WaterdogPE proxy with online-mode=false, and BDS's own
// allow-list can't be used there (playit guide: "set allow-list=false"). WaterdogPE still verifies every player's
// Xbox sign-in, so gamertags are genuine and can be checked here.
// Keep this list in sync with bedrock-server-*/allowlist.json (used when the server runs without the proxy).
export const ACCESS = {
  enabled: true,
  kickMessage: "This is a private server. Ask the owner to add you to the friends list.",
  // Gamertags, case-insensitive.
  friends: [
    "MuyChakisimo",
    "AlexaVoof",
    "TinglyCornet711",
    "SquarerApple393",
    "LightDelta1",
    "Leonidas2k4o",
    "Lainx21",
    "Yet7250",
  ],
};
