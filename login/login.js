document.addEventListener("DOMContentLoaded", () => {
  // Select the login form by its ID
  const loginForm = document.getElementById("login-form");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Extract username and password from the form
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      // Send a GET request to the Azure API endpoint
      const response = await fetch(
        `https://fitness-tracker-functionapp.azurewebsites.net/api/httpLoginUser?code=Aj_Bg37eqhhZqqRcrR2mHjHBxdcuVvGJQZdjJRIum1e_AzFut0AuWg%3D%3D&username=${username}&password=${password}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Parse the response
      const data = await response.text();

      if (response.ok) {
        console.log(data);
        // Store the data object in the browser's local storage
        localStorage.setItem("userData", JSON.stringify(JSON.parse(data)));

        // Redirect to the home page or another page
        console.log("logged in");
        window.location.href = "../index.html";
      } else {
        // Log error to the console
        console.error(`Error: ${data}`);
        alert("Invalid username or password. Please try again.");
      }
    } catch (error) {
      console.error("An error occurred while logging in:", error.message);
      alert("An unexpected error occurred. Please try again later.");
    }
  });
});
