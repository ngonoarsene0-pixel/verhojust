/**
 * ============================================================================
 *  VERHOJUST ÉPICERIE — Central Database Configuration
 * ============================================================================
 *
 *  This module centralizes all database connection settings and exposes a
 *  single `dbConfig` object consumed by the API service layer.
 *
 *  ----------------------------------------------------------------------------
 *  >>> CLEVER CLOUD MySQL CREDENTIALS <<<
 *  ----------------------------------------------------------------------------
 *  Replace the placeholder values below with the credentials provided by your
 *  Clever Cloud MySQL add-on. They are read from environment variables so you
 *  can keep secrets out of source control.
 *
 *  Add the following to your `.env` file (NEVER commit real values):
 *
 *      DB_HOST=     <your-clever-cloud-mysql-host>.clevercloud.com
 *      DB_PORT=     3306
 *      DB_USER=     <your-clever-cloud-mysql-user>
 *      DB_PASSWORD= <your-clever-cloud-mysql-password>
 *      DB_NAME=     <your-clever-cloud-mysql-database>
 *
 *  When you later stand up the Express.js API server (see /server), this same
 *  config is used by the `mysql2/promise` connection pool — see
 *  `server/src/config/db.ts` for the server-side counterpart.
 *  ----------------------------------------------------------------------------
 */

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/* ------------------------------------------------------------------ */
/*  👇 INSERT YOUR CLEVER CLOUD MYSQL CREDENTIALS IN `.env` 👇          */
/* ------------------------------------------------------------------ */
export const dbConfig: DbConfig = {
  host: import.meta.env.VITE_DB_HOST ?? "localhost",
  port: Number(import.meta.env.VITE_DB_PORT ?? 3306),
  user: import.meta.env.VITE_DB_USER ?? "root",
  password: import.meta.env.VITE_DB_PASSWORD ?? "",
  database: import.meta.env.VITE_DB_NAME ?? "verhojust_epicerie",
};
/* ------------------------------------------------------------------ */

/**
 * The base URL of the backend API (Express.js or similar) that brokers
 * requests to the Clever Cloud MySQL database. In production this points to
 * your deployed API; in development it can point to a local Express server.
 *
 *   VITE_API_URL=http://localhost:4000/api   (dev)
 *   VITE_API_URL=https://api.verhojust.com/api (prod)
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

/**
 * Whether the app should use the built-in mock API (in-memory) instead of
 * hitting a live backend. Defaults to `true` so the app runs end-to-end
 * without a server. Set `VITE_USE_MOCK=false` once your Express API is live.
 */
export const USE_MOCK_API =
  (import.meta.env.VITE_USE_MOCK_API ?? "true") !== "false";

export const BUSINESS = {
  name: "VERHOJUST ÉPICERIE",
  tagline: "L'épicerie premium au cœur de Yaoundé",
  address: "Mfoundi Mall, Yaoundé, Cameroun",
  phone: "+237 6 93 33 89 25/ +237 6 71 46 13 40",
  email: "contact@verhojust-epicerie.cm",
  currency: "FCFA",
  currencySymbol: "F",
  deliveryFee: 1500,
  freeDeliveryThreshold: 50000,
};
