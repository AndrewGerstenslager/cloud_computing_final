module.exports = async function (context, req) {
    try {
        // Dynamically import node-fetch
        const fetch = (await import('node-fetch')).default;

        const requestBody = req.body;

        if (!requestBody) {
            context.res = {
                status: 400,
                body: "Request body is missing."
            };
            return;
        }

        const apiKey = process.env.AZURE_API_KEY;
        if (!apiKey) {
            throw new Error("Azure API key is not set in environment variables.");
        }

        const requestHeaders = new Headers({
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "azureml-model-deployment": "melb-housing-2"
        });

        const apiUrl = "https://machine-learning-jrbnh.eastus.inference.ml.azure.com/score";

        const response = await fetch(apiUrl, {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: requestHeaders
        });

        if (!response.ok) {
            const errorText = await response.text();
            context.log.error("Error calling external API:", errorText);
            throw new Error(`External API call failed with status ${response.status}`);
        }

        const jsonResponse = await response.json();
        context.res = {
            status: 200,
            body: jsonResponse
        };
    } catch (error) {
        context.log.error("Error in Azure Function:", error);
        context.res = {
            status: 500,
            body: `An error occurred: ${error.message}`
        };
    }
};
