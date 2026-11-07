"use server";

import { makeClient } from "@/lib/fijii";
import { fail, ok, toActionError, type ActionResult } from "@/lib/errors";
import { toAssignmentDto, type PendingAssignmentsDto } from "@/lib/dto";

export interface PendingAssignmentsInput {
  includeOverdue?: boolean;
  dueWithinDays?: number;
}

export async function getPendingAssignmentsAction(
  input: PendingAssignmentsInput = {},
): Promise<ActionResult<PendingAssignmentsDto>> {
  try {
    const fijii = makeClient();
    let failedClasses = 0;
    const pending = await fijii.pendingAssignments({
      includeOverdue: input.includeOverdue ?? true,
      dueWithinDays: input.dueWithinDays,
      // A single broken class must not take down the whole list.
      onError: () => {
        failedClasses += 1;
      },
    });
    return ok({ assignments: pending.map(toAssignmentDto), failedClasses });
  } catch (error) {
    return fail(toActionError(error));
  }
}
