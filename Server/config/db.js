/**
 * Server/config/db.js
 * Optimized for Vercel Serverless + Aiven MySQL
 * Fixes:
 * - Global singleton pool (prevents pool recreation on every invocation)
 * - SSL for Aiven
 * - Custom port support
 * - Connection timeout handling
 * - KeepAlive for serverless cold starts
 * - Retry logic for intermittent ETIMEDOUT / ECONNRESET
 * - Health check query
 */

const mysql = require("mysql2/promise");

let pool;

/**
 * Create pool only once per warm serverless instance
 */
function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10),

    /**
     * Aiven SSL
     */
    ssl: {
      rejectUnauthorized: false,
    },

    /**
     * Pool settings
     */
    waitForConnections: true,
    connectionLimit: 2, // Lower for Vercel Hobby/Free stability
    maxIdle: 2,
    idleTimeout: 60000,
    queueLimit: 0,

    /**
     * Serverless stability
     */
    connectTimeout: 15000, // More forgiving for cold starts
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

/**
 * Global cache prevents pool recreation
 */
if (!global._mysqlPool) {
  global._mysqlPool = createPool();
}

pool = global._mysqlPool;

/**
 * Test DB connection
 */
async function checkConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Connected Successfully");
    connection.release();
  } catch (error) {
    console.error("❌ Initial MySQL Connection Failed:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port,
    });
  }
}

/**
 * Safe query function with retries
 */
async function query(sql, params = [], retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      /**
       * Lightweight ping before query
       */
      await pool.query("SELECT 1");

      const [results] = await pool.query(sql, params);
      return results;
    } catch (error) {
      console.error(`❌ Query Attempt ${attempt} Failed:`, {
        message: error.message,
        code: error.code,
      });

      /**
       * Retry only for transient network issues
       */
      const transientErrors = [
        "ETIMEDOUT",
        "ECONNRESET",
        "PROTOCOL_CONNECTION_LOST",
        "EHOSTUNREACH",
      ];

      if (attempt < retries && transientErrors.includes(error.code)) {
        console.log(`🔄 Retrying query (${attempt}/${retries})...`);

        /**
         * Recreate pool if connection is broken
         */
        if (
          error.code === "PROTOCOL_CONNECTION_LOST" ||
          error.code === "ECONNRESET"
        ) {
          global._mysqlPool = createPool();
          pool = global._mysqlPool;
        }

        /**
         * Small delay before retry
         */
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * attempt)
        );

        continue;
      }

      throw error;
    }
  }
}

/**
 * Transaction helper
 */
async function getConnection() {
  const connection = await pool.getConnection();

  /**
   * Auto safety wrapper
   */
  const originalRelease = connection.release.bind(connection);

  connection.safeRelease = () => {
    try {
      originalRelease();
    } catch (err) {
      console.error("⚠️ Connection release failed:", err.message);
    }
  };

  return connection;
}

/**
 * Optional startup health check
 */
checkConnection();

module.exports = {
  pool,
  query,
  getConnection,
};