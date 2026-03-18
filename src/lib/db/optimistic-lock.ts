/**
 * Optimistic locking helper.
 * Throws a VersionConflictError if the row's current version doesn't match
 * the expected version sent by the client.
 */
export class VersionConflictError extends Error {
  public currentVersion: number;
  constructor(currentVersion: number) {
    super('Version conflict: data was modified by another session');
    this.name = 'VersionConflictError';
    this.currentVersion = currentVersion;
  }
}

/**
 * Check that `clientVersion` matches `dbVersion`. If not, throw.
 * If clientVersion is undefined (old clients), skip the check.
 */
export function checkVersion(clientVersion: number | undefined, dbVersion: number): void {
  if (clientVersion !== undefined && clientVersion !== dbVersion) {
    throw new VersionConflictError(dbVersion);
  }
}
