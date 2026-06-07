// capture/hostile_session/archive.ts
// Capture‑Net: Hostile Session Archive Organ

export class HostileSessionArchive {
  constructor(private env: any) {}

  /**
   * Archive a hostile session export blob.
   * Writes to ARCHIVE_STORE and indexes the entry in archive_index.
   */
  async archive(sessionId: string, exportBlob: any) {
    const key = `archive-${sessionId}-${Date.now()}.json`;

    // Store blob in archival KV
    await this.env.ARCHIVE_STORE?.put(key, exportBlob);

    // Index archival entry in DB
    await this.env.CAPTURE_NET_DB
      ?.prepare(
        `INSERT INTO archive_index (session_id, ts, key)
         VALUES (?1, ?2, ?3)`
      )
      .bind(sessionId, Date.now(), key)
      .run();

    return key;
  }

  /**
   * Retrieve an archived blob by key.
   */
  async retrieve(key: string) {
    const blob = await this.env.ARCHIVE_STORE?.get(key);
    return blob || null;
  }

  /**
   * List all archival entries for a session in chronological order.
   */
  async list(sessionId: string) {
    const rows = await this.env.CAPTURE_NET_DB
      ?.prepare(
        `SELECT ts, key
         FROM archive_index
         WHERE session_id = ?1
         ORDER BY ts ASC`
      )
      .bind(sessionId)
      .all();

    return rows?.results || [];
  }
}
