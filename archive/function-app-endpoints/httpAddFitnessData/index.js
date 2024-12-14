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
        // Retrieve fields from the request body
        const {
            user_id, date, steps, calories_burned, distance_km, active_minutes,
            sleep_hours, heart_rate_avg, workout_type, weather_conditions, location, mood
        } = req.body;

        // Validate required fields
        if (!user_id || !date || !steps || !calories_burned || !distance_km || !active_minutes ||
            !sleep_hours || !heart_rate_avg || !workout_type || !weather_conditions || !location || !mood) {
            context.res = {
                status: 400,
                body: "All fields are required."
            };
            return;
        }

        // Create a new connection pool if it doesn't exist or is closed
        if (!pool || !pool.connected) {
            pool = await sql.connect(sqlConfig);
        }

        // Insert data into the table using parameterized query
        const result = await pool.request()
            .input('userId', sql.NVarChar, user_id)
            .input('date', sql.NVarChar, date)
            .input('steps', sql.NVarChar, steps)
            .input('caloriesBurned', sql.NVarChar, calories_burned)
            .input('distanceKm', sql.NVarChar, distance_km)
            .input('activeMinutes', sql.NVarChar, active_minutes)
            .input('sleepHours', sql.NVarChar, sleep_hours)
            .input('heartRateAvg', sql.NVarChar, heart_rate_avg)
            .input('workoutType', sql.NVarChar, workout_type)
            .input('weatherConditions', sql.NVarChar, weather_conditions)
            .input('location', sql.NVarChar, location)
            .input('mood', sql.NVarChar, mood)
            .query(`
                INSERT INTO dbo.fitness (
                    user_id, date, steps, calories_burned, distance_km, active_minutes,
                    sleep_hours, heart_rate_avg, workout_type, weather_conditions, location, mood
                ) 
                VALUES (
                    @userId, @date, @steps, @caloriesBurned, @distanceKm, @activeMinutes,
                    @sleepHours, @heartRateAvg, @workoutType, @weatherConditions, @location, @mood
                )
            `);

        // Return a success response
        context.res = {
            status: 201,
            body: "Data inserted successfully."
        };
    } catch (err) {
        context.log(`Database connection error: ${err.message}`);
        context.res = {
            status: 500,
            body: `Error connecting to the database: ${err.message}`
        };
    }
};
