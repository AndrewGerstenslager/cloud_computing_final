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
        // Validate "start" and "end" query parameters
        const start = parseInt(req.query.start, 10);
        const end = parseInt(req.query.end, 10);

        if (isNaN(start) || isNaN(end) || start < 0 || end < 0 || start > end) {
            context.res = {
                status: 400,
                body: "Invalid 'start' or 'end' query parameters. Ensure both are positive integers and 'start' is less than or equal to 'end'."
            };
            return;
        }

        // Create a new connection pool if it doesn't exist or is closed
        if (!pool || !pool.connected) {
            pool = await sql.connect(sqlConfig);
        }

        // Execute a parameterized query to fetch data within the range
        const result = await pool.request()
            .input("start", sql.Int, start)
            .input("end", sql.Int, end)
            .query(`
                SELECT * 
                FROM dbo.housing 
                WHERE listing_id BETWEEN @start AND @end
            `);

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
