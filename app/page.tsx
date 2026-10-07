import { Dashboard } from "@/components/Dashboard";
import { Landing } from "@/components/Landing";
import { listCriteriaSets } from "@/lib/storage/criteriaSets";
import { listEvaluations } from "@/lib/storage/store";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return <Landing />;

  const [evaluations, criteriaSets] = await Promise.all([listEvaluations(supabase), listCriteriaSets(supabase)]);
  return <Dashboard email={user.email} evaluations={evaluations} criteriaSets={criteriaSets} />;
}
