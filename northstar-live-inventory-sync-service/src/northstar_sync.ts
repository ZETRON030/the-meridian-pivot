import { randomUUID } from "node:crypto";
import { pool } from "./db.js";

export type InventoryUpdate = {
  sku: string;
  productName: string;
  quantity: number;
  sourceVersion: number;
};

export async function applyInventoryUpdate(
  update: InventoryUpdate
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{
      quantity: number;
      source_version: string;
    }>(
      `
      SELECT quantity, source_version
      FROM inventory
      WHERE sku = $1
      FOR UPDATE
      `,
      [update.sku]
    );

    if (result.rowCount === 0) {
      throw new Error(`Unknown SKU: ${update.sku}`);
    }

    const currentVersion =
      Number(result.rows[0].source_version);

    /*
     * Ignore duplicate or stale inventory events.
     */
    if (update.sourceVersion <= currentVersion) {
      await client.query("ROLLBACK");

      return {
        applied: false,
        reason: "stale_or_duplicate",
        currentVersion
      };
    }

    /*
     * Update inventory.
     */
    await client.query(
      `
      UPDATE inventory
      SET
        product_name = $2,
        quantity = $3,
        source_version = $4,
        updated_at = NOW()
      WHERE sku = $1
      `,
      [
        update.sku,
        update.productName,
        update.quantity,
        update.sourceVersion
      ]
    );

    /*
     * Create the outbox event in the SAME transaction.
     */
    await client.query(
      `
      INSERT INTO outbox (
        event_id,
        sku,
        event_type,
        payload
      )
      VALUES (
        $1,
        $2,
        'InventoryChanged',
        $3::jsonb
      )
      `,
      [
        randomUUID(),
        update.sku,
        JSON.stringify({
          sku: update.sku,
          quantity: update.quantity,
          sourceVersion: update.sourceVersion
        })
      ]
    );

    await client.query("COMMIT");

    return {
      applied: true,
      currentVersion: update.sourceVersion
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}