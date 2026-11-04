import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { broadcastPush, getPushStats } from "@/lib/admin-push.functions";

export const Route = createFileRoute("/_authenticated/admin/push")({
  head: () => ({
    meta: [
      { title: "Push Notifications | FireZone Admin" },
      { name: "description", content: "Send banner push notifications to all FireZone players." },
      { property: "og:title", content: "Push Notifications | FireZone Admin" },
      { property: "og:description", content: "Broadcast push notifications with banner and link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPush,
});

const pages = [
  { label: "Home", value: "/" },
  { label: "Tournaments", value: "/tournaments" },
  { label: "Wallet", value: "/wallet" },
  { label: "Earn", value: "/earn" },
  { label: "Notifications", value: "/notifications" },
];

function AdminPush() {
  const send = useServerFn(broadcastPush);
  const stats = useQuery({ queryKey: ["admin", "push-stats"], queryFn: () => getPushStats() });
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("/tournaments");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title aur message dono likho");
      return;
    }
    setBusy(true);
    try {
      const r = await send({ data: { title, body, image, link } });
      toast.success(`${r.sent}/${r.total} devices pe notification gaya`);
      setTitle("");
      setBody("");
      setImage("");
      queryClient.invalidateQueries({ queryKey: ["admin", "push-stats"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send nahi hua");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm";
  return (
    <AdminShell>
      <h1 className="font-display text-xl font-bold">Push Notification bhejo</h1>
      <p className="text-xs text-muted-foreground">Sabhi users jinhone notification on kiya hai unko jayega.</p>
      <div className="mt-4 space-y-3">
        <input className={input} placeholder="Title (jaise: Fire Zone Special Event! 🔥)" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={input} rows={3} placeholder="Message" value={body} maxLength={500} onChange={(e) => setBody(e.target.value)} />
        <input className={input} placeholder="Banner photo link (https://...) — optional" value={image} onChange={(e) => setImage(e.target.value)} />
        {image && <img src={image} alt="Banner preview" className="w-full rounded-xl border border-border object-cover" />}
        <div>
          <p className="mb-1 text-xs font-semibold">Click karne pe kaunsa page khule</p>
          <div className="flex flex-wrap gap-2">
            {pages.map((p) => (
              <button key={p.value} type="button" onClick={() => setLink(p.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${link === p.value ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <input className={`${input} mt-2`} placeholder="/tournaments ya https://..." value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <button disabled={busy} onClick={submit} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {busy ? "Bhej rahe hain..." : "SEND NOTIFICATION"}
        </button>
      </div>
    </AdminShell>
  );
}
