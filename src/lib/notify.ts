import { supabase } from "@/integrations/supabase/client";

/**
 * In-app notifications. Every member sees these on the notice board.
 * Used while the club has no verified email sending domain.
 */

function fmtDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export async function announceHackathon(
  h: {
    title: string;
    event_date: string;
    venue: string | null;
    start_time: string | null;
    team_min: number;
    team_max: number;
    mode: string;
    registration_deadline: string | null;
  },
  createdBy: string,
) {
  const lines = [
    `${fmtDate(h.event_date)}${h.start_time ? ` at ${h.start_time.slice(0, 5)}` : ""}.`,
    h.venue ? `Venue: ${h.venue} (${h.mode}).` : `Mode: ${h.mode}.`,
    `Teams of ${h.team_min}–${h.team_max}.`,
    h.registration_deadline
      ? `Register before ${new Date(h.registration_deadline).toLocaleString()}.`
      : "Register from your dashboard.",
  ];
  const { error } = await supabase.from("notices").insert({
    kind: "announcement",
    title: `New hackathon: ${h.title}`,
    body: lines.join(" "),
    created_by: createdBy,
  });
  return error?.message ?? null;
}

export async function announceResults(title: string, createdBy: string) {
  const { error } = await supabase.from("notices").insert({
    kind: "announcement",
    title: `Results out: ${title}`,
    body: "Placements and points are live on the leaderboard. Attendees can download certificates from the Certificates page.",
    created_by: createdBy,
  });
  return error?.message ?? null;
}