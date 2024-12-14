const sql = require("mssql");

// SQL database configuration using environment variables
const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // e.g., "your-server-name.database.windows.net"
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false // Set to true if testing locally
    }
};

let pool; // Connection pool instance

module.exports = async function (context, req) {
    try {
        // Create a new connection pool if it doesn't exist or is closed
        if (!pool || !pool.connected) {
            pool = await sql.connect(sqlConfig);
        }

        // Execute query to fetch data from "fitness" table
        const result = await pool.request().query("SELECT TOP 5 * FROM dbo.fitness");

        // Return the query results in JSON format
        context.res = {
            status: 200,
            body: result.recordset
        };
    } catch (err) {
        context.log(`Database connection error: ${err.message}`);
        context.res = {
            status: 500,
            body: `Error connecting to the database: ${err.message}`
        };
    }
};
