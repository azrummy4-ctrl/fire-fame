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

const banners: Record<string, string> = {
  "br-full-map": brFullMap,
  "clash-squad": clashSquad,
  "lone-wolf": loneWolf,
  "solo-survival": soloSurvival,
  "mode-br-survival": brSurvival,
  "mode-lw-1v1-2v2": lwDuel,
  "mode-br-survival-2": brSurvival2,
  "mode-cs-onetap": csOnetap,
  "mode-lw-lose": lwLose,
  "mode-br-rush-full-map": brRush,
  "mode-only-ump": onlyUmp,
  "mode-free-match": freeMatch,
  "mode-cs-4v4": cs4v4,
  "mode-lw-headshot": lwHeadshot,
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

export function bannerFor(key: string | null | undefined) {
  if (!key) return brFullMap;
  if (key.startsWith("http")) return key;
  return banners[key] ?? brFullMap;
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

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
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

export function useTournaments() {
  return useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Tournament[];
    },
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Tournament | null;
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
