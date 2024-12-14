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
        // Retrieve username and password from the request body
        const { username, password } = req.query;

        // Validate input parameters
        if (!username || !password) {
            context.res = {
                status: 400,
                body: "Please provide both username and password."
            };
            return;
        }

        // Create a new connection pool if it doesn't exist or is closed
        if (!pool || !pool.connected) {
            pool = await sql.connect(sqlConfig);
        }

        // Execute query with parameterized username and password
        const result = await pool.request()
            .input('username', sql.VarChar, username) // Assume username is a VARCHAR
            .input('password', sql.VarChar, password) // Assume password is a VARCHAR
            .query(`
                SELECT user_id, username, display_name 
                FROM dbo.users 
                WHERE username = @username 
                AND password = @password
            `);

        // Check if any user data is returned
        if (result.recordset.length === 0) {
            context.res = {
                status: 401, // Unauthorized
                body: "{'Invalid username or password.'}"
            };
            return;
        }

        // Return the user data
        context.res = {
            status: 200,
            body: result.recordset[0] // Return the first matching user
        };
    } catch (err) {
        context.log(`Database connection error: ${err.message}`);
        context.res = {
            status: 500,
            body: `Error connecting to the database: ${err.message}`
        };
    }
};
