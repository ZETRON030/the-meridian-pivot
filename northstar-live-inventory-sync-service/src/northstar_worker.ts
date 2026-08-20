import { pool } from "./db.js";

export function startOutboxWorker() {
  const timer = setInterval(async () => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query<{
        id: string;
        event_id: string;
        sku: string;
        payload: unknown;
      }>(
        `
        SELECT
          id,
          event_id,
          sku,
          payload
        FROM outbox
        WHERE processed_at IS NULL
        ORDER BY id
        FOR UPDATE SKIP LOCKED
        LIMIT 20
        `
      );

      for (const event of result.rows) {

        /*
         * Prototype integration point.
         *
         * In production this would notify/update
         * Northstar's support tool.
         */
        console.log(
          "[support-tool-sync]",
          event.event_id,
          event.sku,
          event.payload
        );

        await client.query(
          `
          UPDATE outbox
          SET processed_at = NOW()
          WHERE id = $1
          `,
          [event.id]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "[outbox-worker]",
        error
      );
    } finally {
      client.release();
    }
  }, 500);

  return () => {
    clearInterval(timer);
  };
}