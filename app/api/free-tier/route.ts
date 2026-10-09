import { NextResponse } from "next/server";
import { FREE_TIER_MESSAGES, freeTierStatus } from "@/lib/freeTier";
import { createClient, requireUser } from "@/lib/supabase/server";

/** How many free evaluations the signed-in user has left this month (never the key itself). */
export async function GET() {
  const supabase = await createClient();
  const { user, response } = await requireUser(supabase);
  if (response) return response;

  try {
    const status = await freeTierStatus(user.email);
    return NextResponse.json(
      status.available ? status : { ...status, message: FREE_TIER_MESSAGES[status.reason] }
    );
  } catch {
    return NextResponse.json({ available: false, reason: "disabled", message: FREE_TIER_MESSAGES.disabled });
  }
}
