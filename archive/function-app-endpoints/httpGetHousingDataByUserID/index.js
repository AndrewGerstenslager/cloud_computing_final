const sql = require("mssql");

// SQL database configuration using environment variables
const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false // Set to true if testing locally
    }
};

let pool; // Connection pool instance

module.exports = async function (context, req) {
    try {
        // Retrieve user_id from the query parameters
        const userId = req.query.user_id;

        // Check if user_id parameter is provided
        if (!userId) {
            context.res = {
                status: 400,
                body: "Please provide a user_id parameter."
            };
            return;
        }

        // Create a new connection pool if it doesn't exist or is closed
        if (!pool || !pool.connected) {
            pool = await sql.connect(sqlConfig);
        }

        // Execute query with parameterized user_id
        const result = await pool.request()
            .input('userId', sql.Int, userId) // Assume user_id is an integer
            .query("SELECT * FROM dbo.housing WHERE listing_id = @userId"); 

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
