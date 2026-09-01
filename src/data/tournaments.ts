import brFullMap from "@/assets/banner-br-full-map.jpg";
import clashSquad from "@/assets/banner-clash-squad.jpg";
import loneWolf from "@/assets/banner-lone-wolf.jpg";
import soloSurvival from "@/assets/banner-solo-survival.jpg";

export type TournamentStatus = "upcoming" | "live" | "completed" | "full";
export type TournamentMode = "Solo" | "Duo" | "Squad";

export type Tournament = {
  id: string;
  name: string;
  category: string;
  banner: string;
  mode: TournamentMode;
  map: string;
  entryFee: number;
  prizePool: number;
  perKill: number;
  joined: number;
  maxPlayers: number;
  startsAt: string;
  status: TournamentStatus;
  rules: string[];
  prizeSplit: { place: string; amount: number }[];
  roomId?: string;
  roomPassword?: string;
  roomPublished: boolean;
};

/**
 * Demo catalogue used until Lovable Cloud is wired up (Phase 3/4).
 * Replace with database-backed reads — do not ship as live data.
 */
export const tournaments: Tournament[] = [
  {
    id: "br-full-map",
    name: "BR Full Map Tournament",
    category: "BR FULL MAP",
    banner: brFullMap,
    mode: "Squad",
    map: "Bermuda",
    entryFee: 30,
    prizePool: 2000,
    perKill: 8,
    joined: 58,
    maxPlayers: 48,
    startsAt: "Today, 8:00 PM",
    status: "live",
    rules: [
      "Every player must record their POV / screen recording.",
      "Emulator, hack or teaming results in a permanent ban.",
      "Join the room 10 minutes before the match starts.",
    ],
    prizeSplit: [
      { place: "1st", amount: 1000 },
      { place: "2nd", amount: 600 },
      { place: "3rd", amount: 400 },
    ],
    roomId: "88214470",
    roomPassword: "fire24",
    roomPublished: true,
  },
  {
    id: "cs-1v1",
    name: "Clash Squad 1v1 Tournament",
    category: "CS 1V1 / 2V2",
    banner: clashSquad,
    mode: "Solo",
    map: "Bermuda Remastered",
    entryFee: 20,
    prizePool: 800,
    perKill: 0,
    joined: 107,
    maxPlayers: 128,
    startsAt: "Today, 9:30 PM",
    status: "upcoming",
    rules: [
      "Best of 3 rounds, 40 second respawn off.",
      "Character skills are disabled.",
      "Screenshot of the result is mandatory.",
    ],
    prizeSplit: [
      { place: "Winner", amount: 600 },
      { place: "Runner up", amount: 200 },
    ],
    roomPublished: false,
  },
  {
    id: "lone-wolf",
    name: "Lone Wolf 1v1 Tournament",
    category: "LW 1V1 / 2V2",
    banner: loneWolf,
    mode: "Duo",
    map: "Lone Wolf Arena",
    entryFee: 25,
    prizePool: 1000,
    perKill: 0,
    joined: 71,
    maxPlayers: 72,
    startsAt: "Tomorrow, 7:00 PM",
    status: "upcoming",
    rules: [
      "Only Lone Wolf arena weapons allowed.",
      "No gloo wall spam beyond 4 per round.",
      "Late entry is not permitted.",
    ],
    prizeSplit: [
      { place: "Winner", amount: 700 },
      { place: "Runner up", amount: 300 },
    ],
    roomPublished: false,
  },
  {
    id: "solo-survival",
    name: "Solo Survival Tournament",
    category: "BR SURVIVAL",
    banner: soloSurvival,
    mode: "Solo",
    map: "Purgatory",
    entryFee: 10,
    prizePool: 500,
    perKill: 5,
    joined: 59,
    maxPlayers: 48,
    startsAt: "Yesterday, 9:00 PM",
    status: "completed",
    rules: ["Kill points 5 each.", "Placement points as per official chart."],
    prizeSplit: [
      { place: "1st", amount: 300 },
      { place: "2nd", amount: 200 },
    ],
    roomPublished: false,
  },
];

export const getTournament = (id: string) => tournaments.find((t) => t.id === id);

export const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
