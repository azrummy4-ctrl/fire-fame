import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

import brFullMap from "@/assets/banner-br-full-map.jpg";
import clashSquad from "@/assets/banner-clash-squad.jpg";
import loneWolf from "@/assets/banner-lone-wolf.jpg";
import soloSurvival from "@/assets/banner-solo-survival.jpg";
import brSurvival from "@/assets/mode-br-survival.jpg";
import lwDuel from "@/assets/mode-lw-1v1-2v2.jpg";
import brSurvival2 from "@/assets/mode-br-survival-2.jpg";
import csOnetap from "@/assets/mode-cs-onetap.jpg";
import cs1v1 from "@/assets/mode-cs-1v1-2v2.jpg";
import lwLose from "@/assets/mode-lw-lose.jpg";
import brRush from "@/assets/mode-br-rush-full-map.jpg";
import onlyUmp from "@/assets/mode-only-ump.jpg";
import freeMatch from "@/assets/mode-free-match.jpg";
import cs4v4 from "@/assets/mode-cs-4v4.jpg";
import lwHeadshot from "@/assets/mode-lw-headshot.jpg";
import homeBrFullMap from "@/assets/home-br-full-map.jpg";
import homeCs1v1 from "@/assets/home-cs-1v1-2v2.jpg";
import homeBrSurvival from "@/assets/home-br-survival.jpg";
import homeLwDuel from "@/assets/home-lw-1v1-2v2.jpg";
import homeBrSurvival2 from "@/assets/home-br-survival-2.jpg";
import homeCsOnetap from "@/assets/home-cs-onetap.jpg";
import homeLwLose from "@/assets/home-lw-lose.jpg";
import homeBrRush from "@/assets/home-br-rush-full-map.jpg";
import homeOnlyUmp from "@/assets/home-only-ump.jpg";
import homeFreeMatch from "@/assets/home-free-match.jpg";
import homeCs4v4 from "@/assets/home-cs-4v4.jpg";
import homeLwHeadshot from "@/assets/home-lw-headshot.jpg";

const banners: Record<string, string> = {
  "br-full-map": brFullMap,
  "clash-squad": clashSquad,
  "lone-wolf": loneWolf,
  "solo-survival": soloSurvival,
  "mode-br-survival": brSurvival,
  "mode-lw-1v1-2v2": lwDuel,
  "mode-br-survival-2": brSurvival2,
  "mode-cs-onetap": csOnetap,
  "mode-cs-1v1-2v2": cs1v1,
  "mode-lw-lose": lwLose,
  "mode-br-rush-full-map": brRush,
  "mode-only-ump": onlyUmp,
  "mode-free-match": freeMatch,
  "mode-cs-4v4": cs4v4,
  "mode-lw-headshot": lwHeadshot,
};

const homeBanners: Record<string, string> = {
  "BR FULL MAP": homeBrFullMap,
  "CS 1V1/2V2": homeCs1v1,
  "BR SURVIVAL": homeBrSurvival,
  "LW 1V1 / 2V2": homeLwDuel,
  "BR SURVIVAL 2": homeBrSurvival2,
  "CS ONETAP": homeCsOnetap,
  "LW LOSE": homeLwLose,
  "BR RUSH FULL MAP": homeBrRush,
  "ONLY UMP": homeOnlyUmp,
  "FREE MATCH": homeFreeMatch,
  "CS 4V4": homeCs4v4,
  "LW HEADSHOT": homeLwHeadshot,
};

export const homeGameCatalog = [
  { category: "BR FULL MAP", banner_url: "br-full-map" },
  { category: "CS 1V1/2V2", banner_url: "mode-cs-1v1-2v2" },
  { category: "BR SURVIVAL", banner_url: "mode-br-survival" },
  { category: "LW 1V1 / 2V2", banner_url: "mode-lw-1v1-2v2" },
  { category: "BR SURVIVAL 2", banner_url: "mode-br-survival-2" },
  { category: "CS ONETAP", banner_url: "mode-cs-onetap" },
  { category: "LW LOSE", banner_url: "mode-lw-lose" },
  { category: "BR RUSH FULL MAP", banner_url: "mode-br-rush-full-map" },
  { category: "ONLY UMP", banner_url: "mode-only-ump" },
  { category: "FREE MATCH", banner_url: "mode-free-match" },
  { category: "CS 4V4", banner_url: "mode-cs-4v4" },
  { category: "LW HEADSHOT", banner_url: "mode-lw-headshot" },
] as const;

// Ye categories Home page aur Host/Admin panel se chhupayi gayi hain (purane tournaments DB me rehte hain).
export const hiddenCategories = new Set(["CLASH SQUAD", "LONE WOLF", "SOLO"]);

export function categoryBannerKey(category: string | null | undefined) {
  const normalized = category?.trim().toUpperCase();
  return homeGameCatalog.find((game) => game.category === normalized)?.banner_url ?? null;
}

export function bannerFor(key: string | null | undefined, category?: string | null) {
  if (!key) {
    const categoryKey = categoryBannerKey(category);
    return categoryKey ? banners[categoryKey] : brFullMap;
  }
  if (key.startsWith("http")) return key;
  return banners[key] ?? brFullMap;
}

export function homeBannerFor(category: string) {
  return homeBanners[category.trim().toUpperCase()] ?? brFullMap;
}

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type Tournament = {
  id: string;
  name: string;
  category: string;
  banner_url: string | null;
  mode: string;
  map: string;
  entry_fee: number;
  prize_pool: number;
  per_kill: number;
  max_players: number;
  starts_at: string;
  status: string;
  rules: string[];
  prize_split: { place: string; amount: number }[];
  room_published: boolean;
  results_published: boolean;
};

// Cache the session across components so page switches don't reset it and refetch data.
let cachedSession: Session | null = null;
let sessionKnown = false;

export function useSession() {
  const [session, setSession] = useState<Session | null>(cachedSession);
  const [loading, setLoading] = useState(!sessionKnown);

  useEffect(() => {
    const update = (s: Session | null) => {
      cachedSession = s;
      sessionKnown = true;
      setSession(s);
      setLoading(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => update(s));
    if (!sessionKnown) supabase.auth.getSession().then(({ data }) => update(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useProfile() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useWallet() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useIsHost() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["is-host", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "host")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useIsAdmin() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

// Time pura hote hi upcoming -> live (ongoing); result publish par DB status 'completed' ho jata hai.
export function effectiveStatus(t: Pick<Tournament, "status" | "starts_at" | "results_published">, now = Date.now()) {
  if (t.results_published) return "completed";
  if (t.status === "upcoming" && new Date(t.starts_at).getTime() <= now) return "live";
  return t.status;
}

function withEffectiveStatus(t: Tournament): Tournament {
  return { ...t, status: effectiveStatus(t) };
}

export function useTournaments() {
  return useQuery({
    queryKey: ["tournaments"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as unknown as Tournament[]).map(withEffectiveStatus);
    },
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ["tournament", id],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? withEffectiveStatus(data as unknown as Tournament) : null;
    },
  });
}

export function useParticipants(tournamentId: string) {
  return useQuery({
    queryKey: ["participants", tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("total_points", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSlotCounts() {
  return useQuery({
    queryKey: ["slot-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("participants").select("tournament_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) counts[row.tournament_id] = (counts[row.tournament_id] ?? 0) + 1;
      return counts;
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
