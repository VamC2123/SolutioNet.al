import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch accurate up/down vote counts from the votes table (source of truth).
 * Use this so counts are correct on reload and don't depend on DB trigger or RPC.
 */
export async function getVoteCountsForProblems(
  problemIds: string[]
): Promise<Record<string, { up: number; down: number }>> {
  const result: Record<string, { up: number; down: number }> = {};
  problemIds.forEach((id) => {
    result[id] = { up: 0, down: 0 };
  });
  if (problemIds.length === 0) return result;

  const { data: rows, error } = await supabase
    .from("votes")
    .select("problem_id, vote_type")
    .in("problem_id", problemIds);

  if (error) {
    console.error("getVoteCountsForProblems:", error);
    return result;
  }

  (rows || []).forEach((row: { problem_id: string; vote_type: string }) => {
    if (result[row.problem_id]) {
      if (row.vote_type === "up") result[row.problem_id].up += 1;
      else result[row.problem_id].down += 1;
    }
  });
  return result;
}

/** Get counts for a single problem (e.g. ProblemDetails page). */
export async function getVoteCountsForProblem(
  problemId: string
): Promise<{ up: number; down: number }> {
  const map = await getVoteCountsForProblems([problemId]);
  return map[problemId] ?? { up: 0, down: 0 };
}
