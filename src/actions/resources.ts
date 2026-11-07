"use server";

import type { ClassResource } from "fijii";
import { makeClient } from "@/lib/fijii";
import { fail, ok, toActionError, type ActionResult } from "@/lib/errors";
import { buildResourcesDto, type ResourcesDto } from "@/lib/dto";

export async function getResourcesAction(): Promise<ActionResult<ResourcesDto>> {
  try {
    const fijii = makeClient();
    const classes = await fijii.classes.list();

    // Resources are per class, not per course — fetch each in parallel and
    // merge afterwards. One inaccessible class must not blank the page.
    const settled = await Promise.allSettled(
      classes.map(async (cls) => ({
        classId: cls.id,
        resources: await fijii.classes.resources(cls.id),
      })),
    );

    let failedClasses = 0;
    const fetched = new Map<number, ClassResource[]>();
    for (const outcome of settled) {
      if (outcome.status === "rejected") {
        failedClasses += 1;
        continue;
      }
      fetched.set(outcome.value.classId, outcome.value.resources);
    }

    return ok({ courses: buildResourcesDto(classes, fetched), failedClasses });
  } catch (error) {
    return fail(toActionError(error));
  }
}
