import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";

import { pool } from "./db.js";
import {
  applyInventoryUpdate
} from "./sync.js";
import {
  startOutboxWorker
} from "./worker.js";

const app = Fastify({
  logger: true
});

await app.register(cors, {
  origin: true
});


/*
 * Health check
 */
app.get("/health", async () => {
  return {
    service: "northstar-inventory-sync",
    status: "ok"
  };
});


/*
 * Support tool:
 *
 * "Is this SKU in stock?"
 */
app.get("/inventory/:sku", async (request, reply) => {

  const params = z.object({
    sku: z.string().min(1)
  }).parse(request.params);

  const result = await pool.query(
    `
    SELECT
      sku,
      product_name AS "productName",
      quantity,
      (quantity > 0) AS "inStock",
      source_version AS "sourceVersion",
      updated_at AS "updatedAt"
    FROM inventory
    WHERE sku = $1
    `,
    [params.sku]
  );

  if (result.rowCount === 0) {
    return reply.code(404).send({
      error: "SKU not found"
    });
  }

  return result.rows[0];
});


/*
 * View all inventory.
 */
app.get("/inventory", async () => {

  const result = await pool.query(
    `
    SELECT
      sku,
      product_name AS "productName",
      quantity,
      (quantity > 0) AS "inStock",
      source_version AS "sourceVersion",
      updated_at AS "updatedAt"
    FROM inventory
    ORDER BY sku
    `
  );

  return result.rows;
});


/*
 * Simulated upstream inventory update.
 */
const inventoryUpdateSchema = z.object({
  sku: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().min(0),
  sourceVersion: z.number().int().positive()
});


app.post("/sync/inventory", async (request, reply) => {

  const update =
    inventoryUpdateSchema.parse(request.body);

  try {

    return await applyInventoryUpdate(update);

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : "Inventory synchronization failed";

    if (message.startsWith("Unknown SKU")) {
      return reply.code(404).send({
        error: message
      });
    }

    throw error;
  }
});


/*
 * Start the background outbox worker.
 */
const stopWorker =
  startOutboxWorker();


/*
 * Graceful shutdown.
 */
const shutdown = async () => {

  stopWorker();

  await app.close();

  await pool.end();

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);


/*
 * Start HTTP server.
 */
await app.listen({
  host: "0.0.0.0",
  port: Number(process.env.PORT ?? 3000)
});