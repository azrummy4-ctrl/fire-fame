// Shared rule sets for tournament categories.
// Used by the Host Dashboard and Admin Panel create form — rules auto-fill
// when a category is selected.

export const DEFAULT_RULES = [
  "📱 Emulator not allowed — smartphones only",
  "🤝 No teaming with other players",
  "🤖 No aimbot, hacks or mods — permanent ban",
  "🎥 Screenshot / recording proof required",
  "💸 No refund for missed matches",
];

export const BR_FULL_MAP_RULES = [
  "🎖️ Level Requirement: Only players with Level 40+ IDs are eligible to participate.",
  "🎯 Headshot Rate: CS career headshot rate must not exceed 70%.",
  "📱 Device Requirements: The match must be played exclusively on a smartphone or tablet. Emulators are strictly prohibited.",
  "✍️ Use simple text when registering (example - RONITH, don't use any kind of symbol).",
  "🚫 Prohibited Behavior: To ensure fair gameplay, the following actions are strictly prohibited:",
  "🤖 Using Unauthorized Tools: Employing tools such as aimbots, no-recoil applications, or any game-modifying software.",
  "🤝 Teaming Up with Opponents: Collaborating with opponents to gain an unfair advantage during the gameplay.",
  "👥 Adding Unregistered Players to the Custom Room: Inviting unregistered players and eliminating them during the gameplay.",
  "🔫 Using Prohibited Guns: Employing Double Vector guns during the gameplay.",
  "🎭 Using Prohibited Character: Employing Ryden Character during the gameplay.",
  "🎥 Mandatory Gameplay Recording: The gameplay must be recorded using the in-game recording tools available in Free Fire MAX or a screen recorder. Failure to comply will lead to penalties.",
  "📹 Mandatory Screen Recording for the Custom Room: Players must record their screens while joining the custom room.",
  "🙅 The use of multiple accounts by a single user is strictly prohibited. Any player found to be using multiple IDs will be permanently banned from our platform.",
  "⛔ Blacklisted Game-ID's are not allowed to play and immediate ban will be issued if we got any report from Garena.",
  "⏱️ Match Result: The result will be generated within 1 to 1.5 hours after the scheduled match time.",
  "💸 Refund Policy: Refunds will not be provided for missed matches. However, if server-related issues occur, refunds may be considered on a case-by-case basis.",
  "📝 Match Registration Restriction: Once you join a match, your registration cannot be canceled.",
  "⚖️ Rights: The platform reserves the right to modify match prizes, rules & regulations at its discretion.",
  "🐴 Horse: horse is completely banned — if anyone uses horse, prize will not be given to him.",
];

export const CLASH_SQUAD_RULES = [
  "🎖️ Level Requirement: Only players with Level 40+ IDs are eligible to participate.",
  "🎯 Headshot Rate: CS career headshot rate must not exceed 70%.",
  "📱 Device Requirements: The match must be played exclusively on a smartphone or tablet. Emulators are strictly prohibited.",
  "✍️ Register: Use simple text when registering (example - RONITH, don't use any kind of symbol).",
  "🚪 Match Room ID & Password: The room details will be shared 5-10 minutes before the scheduled match time.",
  "🚫 Prohibited Behavior: To ensure fair gameplay, the following actions are strictly prohibited:",
  "🤖 Using Unauthorized Tools: Employing tools such as aimbots, no-recoil applications, or any game-modifying software.",
  "🤝 Teaming Up with Opponents: Collaborating with opponents to gain an unfair advantage during the gameplay.",
  "👥 Adding Unregistered Players: Inviting unregistered players to the custom room.",
  "💣 Prohibited Throwables: Utilizing banned throwable items consisting of grenades, smoke grenades, flash freezes, flashbangs, dragon freezes, and mini turrets.",
  "📦 Zone Packing: Using tactics such as deploying gloo walls to trap opponents outside the safe zone, thereby forcing them to take damage from shrinking zones or face unfair eliminations.",
  "🎭 Prohibited Character: Selecting Orion, A124 and Ryden character during the gameplay.",
  "🎥 Mandatory Gameplay Recording: The gameplay must be recorded using the in-game recording tools available in Free Fire MAX or a screen recorder. Failure to comply will lead to penalties.",
  "📹 Mandatory Screen Recording for the Custom Room: Players must record their screens while joining the custom room.",
  "🧗 Height Not Allowed: Using height for heal purpose or spotting purpose is not allowed.",
  "⏱️ Match Result: The result will be generated within 1 to 1.5 hours after the scheduled match time.",
  "💸 Refund Policy: Missed matches will be canceled, and refunds are provided only to attendees. However, if platform-related issues (e.g., server errors) occur, refunds may be considered on a case-by-case basis.",
  "🔫 Using Prohibited Guns: Employing Double Vector guns during the gameplay.",
  "⚖️ Rights: FIRE ZONE reserves the right to modify match prizes, rules & regulations at its discretion.",
];

// Lone Wolf 1V1/2V2 rule set.
export const LW_RULES = [
  "🎖️ Level Requirement: Only players with Level 40+ IDs are eligible to participate.",
  "🎯 Headshot Rate: CS career headshot rate must not exceed 70%.",
  "📱 Device Requirements: The match must be played exclusively on a smartphone or tablet.",
  "📵 Emulators are strictly prohibited.",
  "✍️ Register: Use simple text when registering (example - RONITH, don't use any kind of symbol).",
  "🚪 Match Room ID & Password: The room details will be shared 5-10 minutes before the scheduled match time.",
  "🚫 Prohibited Behavior: To ensure fair gameplay, the following actions are strictly prohibited:",
  "🤖 Using Unauthorized Tools: Employing tools such as aimbots, no-recoil applications, or any game-modifying software.",
  "🤝 Teaming Up with Opponents: Collaborating with opponents to gain an unfair advantage during the gameplay.",
  "👥 Adding Unregistered Players: Inviting unregistered players to the custom room.",
  "📦 Zone Packing: Using tactics such as deploying gloo walls to trap opponents outside the safe zone, thereby forcing them to take damage from shrinking zones or face unfair eliminations.",
  "🎥 Mandatory Gameplay Recording: The gameplay must be recorded using the in-game recording tools available in Free Fire MAX or a screen recorder. Failure to comply will lead to penalties.",
  "📹 Mandatory Screen Recording for the Custom Room: Players must record their screens while joining the custom room.",
  "⏱️ Match Result: The result will be generated under 30 minutes after the scheduled match time.",
  "💸 Refund Policy: Missed matches will be canceled, and refunds are provided only to attendees. However, if GameX-related issues (e.g., server errors) occur, refunds may be considered on a case-by-case basis.",
  "📝 Match Registration Restriction: Once you join a match, your registration cannot be canceled.",
  "⚖️ Rights: GameX reserves the right to modify match prizes, rules & regulations at its discretion.",
  "🎭 A124 Is Strictly Prohibited: A124 is strictly prohibited and banned from LW 1V1 and LW 2V2 — no one can use it. If found, a penalty will be charged on him.",
];

// Categories that use the Clash Squad rule set (CS-style modes).
const CLASH_SQUAD_CATEGORIES = new Set([
  "CLASH SQUAD",
  "CS ONETAP",
  "CS 4V4",
  "ONLY UMP",
]);

// Categories that use the BR Full Map rule set (battle-royale modes).
const BR_FULL_MAP_CATEGORIES = new Set([
  "BR SURVIVAL",
  "BR SURVIVAL 2",
  "BR RUSH FULL MAP",
]);

// Categories that use the Lone Wolf 1V1/2V2 rule set.
const LW_CATEGORIES = new Set([
  "LW 1V1/2V2",
  "LW 1V1 / 2V2",
]);

// Which auto-fill rule set applies for a category.
export function rulesFor(category: string): string[] {
  const c = category.trim().toUpperCase().replace(/\s*\/\s*/, "/");
  if (c === "BR FULL MAP" || BR_FULL_MAP_CATEGORIES.has(c)) return BR_FULL_MAP_RULES;
  if (CLASH_SQUAD_CATEGORIES.has(c)) return CLASH_SQUAD_RULES;
  if (LW_CATEGORIES.has(c)) return LW_RULES;
  return DEFAULT_RULES;
}
