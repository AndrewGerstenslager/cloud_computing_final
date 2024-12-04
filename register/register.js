document
  .getElementById("registerForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the form from submitting the default way

    // Get the values from the form fields
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const displayName = document.getElementById("name").value;
    const email = document.getElementById("email").value;

    // Prepare the data to send to the API
    const data = {
      username: username,
      password: password,
      display_name: displayName,
      email: email,
    };

    try {
      // Send the data to the API
      const response = await fetch(
        "https://fitness-tracker-functionapp.azurewebsites.net/api/httpRegisterUser?code=24Nz39x3X4R1drRltUUCSPkxkQGov_bPC34V2Jm8JMXHAzFuZOjmgA%3D%3D",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const apiResponse = await response.text();
      console.log(apiResponse);

      if (apiResponse === "User registered successfully.") {
        document.getElementById("notification").style.display = "block";
        document.getElementById("notification").innerText =
          "User registered successfully. Redirecting to login page...";
        setTimeout(function () {
          window.location.href = "../login/login.html";
        }, 3000);
      } else {
        alert(apiResponse);
      }
    } catch (error) {
      // If there's an error with the request, show it to the user
      console.error("Error during registration:", error);
      alert("Error during registration: " + error.message);
    }
  });
