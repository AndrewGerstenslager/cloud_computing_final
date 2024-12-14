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
        // Retrieve input fields from the request body
        const { username, password, display_name, email } = req.body;

        // Validate that all required fields are provided
        if (!username || !password || !display_name || !email) {
            context.res = {
                status: 400,
                body: "Please provide 'username', 'password', 'display_name', and 'email'."
            };
            return;
        }

        // Create a new connection pool if it doesn't exist or is closed
        if (!pool || !pool.connected) {
            pool = await sql.connect(sqlConfig);
        }

        // Check if the username already exists
        const existingUser = await pool.request()
            .input('username', sql.VarChar, username)
            .query("SELECT 1 FROM dbo.users WHERE username = @username");

        if (existingUser.recordset.length > 0) {
            context.res = {
                status: 409, // Conflict
                body: "Username already exists. Please choose a different username."
            };
            return;
        }

        // Check if the email already exists
        const existingEmail = await pool.request()
            .input('email', sql.VarChar, email)
            .query("SELECT 1 FROM dbo.users WHERE email = @email");

        if (existingEmail.recordset.length > 0) {
            context.res = {
                status: 409, // Conflict
                body: "Email already exists. Please use a different email."
            };
            return;
        }

        // Insert the new user into the database
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .input('display_name', sql.VarChar, display_name)
            .input('email', sql.VarChar, email)
            .query(`
                INSERT INTO dbo.users (username, password, display_name, email)
                VALUES (@username, @password, @display_name, @email)
            `);

        // Respond with success
        context.res = {
            status: 201, // Created
            body: "User registered successfully."
        };
    } catch (err) {
        context.log(`Database connection error: ${err.message}`);
        context.res = {
            status: 500,
            body: `Error connecting to the database: ${err.message}`
        };
    }
};
