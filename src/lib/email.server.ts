/** Server-only email delivery through the Resend connector gateway. */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export type Recipient = { email: string; name?: string | null };

export type SendOutcome = {
  email: string;
  name: string | null;
  status: "sent" | "failed";
  error: string | null;
  providerId: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Replaces {{name}} / {{email}} placeholders with the recipient's own values. */
export function personalize(text: string, r: Recipient) {
  const first = (r.name ?? "").trim().split(" ")[0] || "there";
  return text
    .replace(/\{\{\s*name\s*\}\}/gi, (r.name ?? "").trim() || "there")
    .replace(/\{\{\s*first_name\s*\}\}/gi, first)
    .replace(/\{\{\s*email\s*\}\}/gi, r.email);
}

export function renderHtml(subject: string, body: string) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1a1c1f;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:14px;padding:28px;border:1px solid #e6e8ec;">
      <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#e2603a;font-weight:700;">Yuga Spark</div>
      <h1 style="margin:8px 0 20px;font-size:20px;line-height:1.3;">${escapeHtml(subject)}</h1>
      <div style="font-size:15px;color:#31353b;">${paragraphs}</div>
    </div>
    <p style="margin:18px 0 0;font-size:12px;color:#8b9099;text-align:center;">
      Yuga Spark — the hackathon club. You receive this because you are a club member.
    </p>
  </div>
</body></html>`;
}

type BatchItem = {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends one email per recipient via Resend's batch endpoint (max 100 per call).
 * Returns one outcome per recipient, in the same order.
 */
export async function sendBatch(args: {
  from: string;
  replyTo?: string | null;
  subject: string;
  body: string;
  recipients: Recipient[];
}): Promise<SendOutcome[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) {
    return args.recipients.map((r) => ({
      email: r.email,
      name: r.name ?? null,
      status: "failed" as const,
      error: "Email service is not configured",
      providerId: null,
    }));
  }

  const outcomes: SendOutcome[] = [];
  for (let i = 0; i < args.recipients.length; i += 100) {
    const chunk = args.recipients.slice(i, i + 100);
    const payload: BatchItem[] = chunk.map((r) => {
      const subject = personalize(args.subject, r);
      const text = personalize(args.body, r);
      return {
        from: args.from,
        to: [r.email],
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
        subject,
        text,
        html: renderHtml(subject, text),
      };
    });

    let response: Response;
    try {
      response = await fetch(`${GATEWAY_URL}/emails/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": resendKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      outcomes.push(
        ...chunk.map((r) => ({
          email: r.email,
          name: r.name ?? null,
          status: "failed" as const,
          error: message,
          providerId: null,
        })),
      );
      continue;
    }

    const raw = await response.text();
    if (!response.ok) {
      console.error(`Resend batch failed [${response.status}]: ${raw}`);
      outcomes.push(
        ...chunk.map((r) => ({
          email: r.email,
          name: r.name ?? null,
          status: "failed" as const,
          error: `[${response.status}] ${raw.slice(0, 300)}`,
          providerId: null,
        })),
      );
      continue;
    }

    let ids: (string | null)[] = [];
    try {
      const parsed = JSON.parse(raw) as { data?: { id?: string }[] };
      ids = (parsed.data ?? []).map((d) => d.id ?? null);
    } catch {
      ids = [];
    }
    outcomes.push(
      ...chunk.map((r, idx) => ({
        email: r.email,
        name: r.name ?? null,
        status: "sent" as const,
        error: null,
        providerId: ids[idx] ?? null,
      })),
    );
  }
  return outcomes;
}