import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { signedUrl } from "@/lib/storage";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

const TITLE = "My club badge — Yuga Spark";
const DESCRIPTION = "Your personal Yuga Spark member badge with a scannable QR code.";

export const Route = createFileRoute("/_authenticated/badge")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: BadgePage;
});

function BadgePage() {
  return null;
}