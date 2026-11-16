import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const assertAdmin = async (supabase: SupabaseClient<Database>, userId: string) => {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Admin access required");
};

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      search: z.string().trim().max(120).default(""),
      status: z.enum(["all", "blocked"]).default("all"),
      page: z.number().int().min(1).max(100000).default(1),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase.rpc("admin_list_users", {
      _search: data.search,
      _status: data.status,
      _page: data.page,
    });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getAdminUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase.rpc("admin_get_user_detail", {
      _user_id: data.userId,
    });
    if (error) throw new Error(error.message);
    const user = rows?.[0];
    if (!user) throw new Error("User not found");
    return user;
  });

export const setAdminUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), status: z.enum(["active", "banned"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: status, error } = await context.supabase.rpc("admin_set_user_status", {
      _user_id: data.userId,
      _status: data.status,
    });
    if (error) throw new Error(error.message);
    return { status };
  });

export const adjustAdminUserCoins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      userId: z.string().uuid(),
      amount: z.number().finite().refine((amount) => amount !== 0, "Coin amount cannot be zero"),
      note: z.string().trim().max(250).default(""),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: balance, error } = await context.supabase.rpc("admin_adjust_coins", {
      _user_id: data.userId,
      _amount: data.amount,
      _note: data.note,
    });
    if (error) throw new Error(error.message);
    return { balance: Number(balance) };
  });