"use server";

import type { ClassResource } from "fijii";
import { makeClient } from "@/lib/fijii";
import { fail, ok, toActionError, type ActionResult } from "@/lib/errors";
import {
  buildResourcesDto,
  recentResources,
  type RecentResourceDto,
  type ResourcesDto,
} from "@/lib/dto";

async function loadResources(): Promise<ActionResult<ResourcesDto>> {
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

export async function getResourcesAction(): Promise<ActionResult<ResourcesDto>> {
  return loadResources();
}

/** The most recently updated resources across every course, for the home page. */
export async function getRecentResourcesAction(limit = 3): Promise<ActionResult<RecentResourceDto[]>> {
  const result = await loadResources();
  if (!result.ok) return result;
  return ok(recentResources(result.data.courses, limit));
}

