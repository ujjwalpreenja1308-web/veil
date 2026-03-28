// All database queries — every query MUST include org_id for tenant isolation

export async function getAgentsByOrg(_orgId: string) {
  throw new Error("Not implemented");
}

export async function getSessionsByOrg(_orgId: string) {
  throw new Error("Not implemented");
}

export async function getSessionById(_orgId: string, _sessionId: string) {
  throw new Error("Not implemented");
}

export async function getEventsBySession(_orgId: string, _sessionId: string) {
  throw new Error("Not implemented");
}
