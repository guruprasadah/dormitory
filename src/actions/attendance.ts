"use server";

import { makeClient } from "@/lib/fijii";
import { fail, ok, toActionError, type ActionResult } from "@/lib/errors";
import {
  toAttendanceDto,
  toTermDto,
  type AttendanceDto,
  type TermDto,
} from "@/lib/dto";

export async function getTermsAction(): Promise<ActionResult<TermDto[]>> {
  try {
    const fijii = await makeClient();
    const terms = await fijii.attendance.terms();
    return ok(terms.map(toTermDto));
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function getAttendanceAction(termId?: number): Promise<ActionResult<AttendanceDto>> {
  try {
    const fijii = await makeClient();
    const summary = await fijii.attendanceSummary(termId);
    return ok(toAttendanceDto(summary));
  } catch (error) {
    return fail(toActionError(error));
  }
}
