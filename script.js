// Don't even start loading the page if the user isn't logged in 
const storedUserData = localStorage.getItem("userData");
if (!storedUserData) { {
  // No user data found, redirect to login
  window.location.href = "../login/login.html"; // Adjust the URL as needed
}

// Initialize the map and set its view to Flinders Street Station, Melbourne
var map = L.map("map", {
  center: [-37.8181, 144.9668], // Flinders Street Station coordinates
  zoom: 13,
  dragging: true,
  scrollWheelZoom: true,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false,
  zoomControl: true,
});

// Add a tile layer to the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Update mouse position
map.on("mousemove", function (e) {
  document.getElementById("mouse-position").innerHTML =
    "Mouse Position: " +
    e.latlng.lat.toFixed(5) +
    ", " +
    e.latlng.lng.toFixed(5);
});

var marker;
var flindersStation = L.latLng(-37.8181, 144.9668); // Flinders Street Station coordinates
// Function to calculate distance in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the Earth in kilometers
  var dLat = ((lat2 - lat1) * Math.PI) / 180;
  var dLon = ((lon2 - lon1) * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;
  return distance;
}

// Add a marker on map click and get the suburb
map.on("click", function (e) {
  if (marker) {
    map.removeLayer(marker);
  }
  marker = L.marker(e.latlng).addTo(map);
  document.getElementById("latitude").value = e.latlng.lat.toFixed(5);
  document.getElementById("longitude").value = e.latlng.lng.toFixed(5);

  // Calculate distance from Flinders Street Station
  var distance = calculateDistance(
    flindersStation.lat,
    flindersStation.lng,
    e.latlng.lat,
    e.latlng.lng
  );
  document.getElementById("distance").value = distance.toFixed(2);

  // Reverse geocode to get the suburb
  fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`
  )
    .then((response) => response.json())
    .then((data) => {
      var suburb = data.address.suburb || "Unknown";
      document.getElementById("suburb").value = suburb;
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("suburb").value = "Error";
    });
});

function createCharts(allData) {
  console.log("Creating charts...");
  if (!globalCSVData) {
    console.error("No CSV data available");
    return;
  }
  console.log("Global CSV Data length:", globalCSVData.length);

  // Clear previous charts
  document.getElementById("charts").innerHTML = "";

  // Filter out any undefined or empty entries
  const validData = globalCSVData.filter(
    (row) => row.Category && row["All data"]
  );

  // Sort data by value in descending order
  validData.sort(
    (a, b) => parseFloat(b["All data"]) - parseFloat(a["All data"])
  );

  // Prepare the data
  const labels = validData.map((row) => row.Category);
  const values = validData.map((row) => parseFloat(row["All data"]));

  // Create the first chart
  const ctx1 = document.createElement("canvas");
  ctx1.style.width = "100%";
  ctx1.style.height = "400px";
  ctx1.style.maxHeight = "400px";
  ctx1.style.marginBottom = "20px";
  document.getElementById("charts").appendChild(ctx1);

  // Create the second chart
  const ctx2 = document.createElement("canvas");
  ctx2.style.width = "100%";
  ctx2.style.height = "400px";
  ctx2.style.maxHeight = "400px";
  document.getElementById("charts").appendChild(ctx2);

  console.log("Categories:", labels);
  console.log("Values:", values);

  const chart1 = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Feature Importance Score",
          data: values,
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.5)",
            "rgba(255, 206, 86, 0.5)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Aggregated Feature Importance",
            color: "white",
          },
          ticks: {
            color: "white",
            callback: function (value) {
              return "$" + parseFloat(value).toLocaleString("en-US");
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Features",
            color: "white",
          },
          ticks: {
            color: "white",
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Feature Importance Scores",
          color: "white",
          font: {
            size: 16,
          },
        },
        legend: {
          labels: {
            color: "white",
          },
        },
      },
    },
  });

  // Process data for region averages from the API data
  const regionData = {};
  allData.forEach((house) => {
    if (house.Regionname && house.Price) {
      if (!regionData[house.Regionname]) {
        regionData[house.Regionname] = {
          sum: 0,
          count: 0,
        };
      }
      const price = parseFloat(house.Price);
      if (!isNaN(price)) {
        regionData[house.Regionname].sum += price;
        regionData[house.Regionname].count += 1;
      }
    }
  });

  // Calculate averages and prepare chart data
  const regionPairs = Object.keys(regionData).map((region) => {
    const average = (regionData[region].sum / regionData[region].count).toFixed(
      2
    );
    console.log(
      `Region: ${region}, Average: ${average}, Count: ${regionData[region].count}`
    );
    return {
      region: region,
      average: parseFloat(average),
    };
  });

  // Sort regions by average price in descending order
  regionPairs.sort((a, b) => b.average - a.average);

  // Separate the sorted data back into labels and values
  const regionLabels = regionPairs.map((pair) => pair.region);
  const regionAverages = regionPairs.map((pair) => pair.average.toFixed(2));

  console.log("Region Labels:", regionLabels);
  console.log("Region Averages:", regionAverages);

  // Generate colors for each region
  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 360) / count;
      colors.push(`hsla(${hue}, 70%, 60%, 0.5)`);
    }
    return colors;
  };

  const generateBorderColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 360) / count;
      colors.push(`hsla(${hue}, 70%, 60%, 1)`);
    }
    return colors;
  };

  // Create the third chart
  const ctx3 = document.createElement("canvas");
  ctx3.style.width = "100%";
  ctx3.style.height = "400px";
  ctx3.style.maxHeight = "400px";
  ctx3.style.marginTop = "20px";
  document.getElementById("charts").appendChild(ctx3);

  // Process data for suburb averages
  const suburbData = {};
  allData.forEach((house) => {
    if (house.Suburb && house.Price) {
      if (!suburbData[house.Suburb]) {
        suburbData[house.Suburb] = {
          sum: 0,
          count: 0,
        };
      }
      const price = parseFloat(house.Price);
      if (!isNaN(price)) {
        suburbData[house.Suburb].sum += price;
        suburbData[house.Suburb].count += 1;
      }
    }
  });

  // Calculate averages and prepare suburb chart data
  const suburbPairs = Object.keys(suburbData).map((suburb) => {
    const average = (suburbData[suburb].sum / suburbData[suburb].count).toFixed(
      2
    );
    return {
      suburb: suburb,
      average: parseFloat(average),
      count: suburbData[suburb].count,
    };
  });

  // Sort suburbs by average price in descending order and take top 20
  const top20Suburbs = suburbPairs
    .sort((a, b) => b.average - a.average)
    .slice(0, 20);

  // Separate the sorted data back into labels and values
  const suburbLabels = top20Suburbs.map((pair) => pair.suburb);
  const suburbAverages = top20Suburbs.map((pair) => pair.average.toFixed(2));

  console.log("Top 20 Suburbs:", suburbLabels);
  console.log("Top 20 Averages:", suburbAverages);

  // Create second chart with region data
  const chart2 = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: regionLabels,
      datasets: [
        {
          label: "Average House Price by Region",
          data: regionAverages.map((price) => parseFloat(price)), // Keep as numbers
          backgroundColor: generateColors(regionLabels.length),
          borderColor: generateBorderColors(regionLabels.length),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Average Price ($)",
            color: "white",
          },
          ticks: {
            color: "white",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Region",
            color: "white",
          },
          ticks: {
            color: "white",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Average House Price by Region",
          color: "white",
          font: {
            size: 16,
          },
        },
        legend: {
          labels: {
            color: "white",
          },
        },
      },
    },
  });

  // Create the fourth chart
  const ctx4 = document.createElement("canvas");
  ctx4.style.width = "100%";
  ctx4.style.height = "400px";
  ctx4.style.maxHeight = "400px";
  ctx4.style.marginTop = "20px";
  document.getElementById("charts").appendChild(ctx4);

  // Get bottom 20 suburbs
  const bottom20Suburbs = suburbPairs
    .sort((a, b) => a.average - b.average) // Sort in ascending order
    .slice(0, 20);

  // Separate the sorted data back into labels and values for bottom 20
  const bottomSuburbLabels = bottom20Suburbs.map((pair) => pair.suburb);
  const bottomSuburbAverages = bottom20Suburbs.map((pair) =>
    pair.average.toFixed(2)
  );

  console.log("Bottom 20 Suburbs:", bottomSuburbLabels);
  console.log("Bottom 20 Averages:", bottomSuburbAverages);

  // Create third chart with suburb data
  const chart3 = new Chart(ctx3, {
    type: "bar",
    data: {
      labels: suburbLabels,
      datasets: [
        {
          label: "Average House Price by Suburb (Top 20)",
          data: suburbAverages.map((price) => parseFloat(price)),
          backgroundColor: generateColors(20),
          borderColor: generateBorderColors(20),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Average Price ($)",
            color: "white",
          },
          ticks: {
            color: "white",
            callback: function (value) {
              return "$" + value.toLocaleString("en-US");
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Suburb",
            color: "white",
          },
          ticks: {
            color: "white",
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Top 20 Suburbs by Average House Price",
          color: "white",
          font: {
            size: 16,
          },
        },
        legend: {
          labels: {
            color: "white",
          },
        },
      },
    },
  });

  // Create the fifth chart
  const ctx5 = document.createElement("canvas");
  ctx5.style.width = "100%";
  ctx5.style.height = "400px";
  ctx5.style.maxHeight = "400px";
  ctx5.style.marginTop = "20px";
  document.getElementById("charts").appendChild(ctx5);

  // Process data for car spaces averages
  const carData = {};
  allData.forEach((house) => {
    if (house.Car && house.Price) {
      const cars = parseFloat(house.Car);
      const price = parseFloat(house.Price);
      // Only process data for 0-5 cars
      if (!isNaN(cars) && !isNaN(price) && cars >= 0 && cars <= 5) {
        if (!carData[cars]) {
          carData[cars] = {
            sum: 0,
            count: 0,
          };
        }
        carData[cars].sum += price;
        carData[cars].count += 1;
      }
    }
  });

  // Calculate averages for each number of cars
  const carLabels = Array.from({ length: 6 }, (_, i) => i.toString()); // ["0", "1", "2", "3", "4", "5"]
  const carAverages = carLabels.map((cars) => {
    if (carData[cars]) {
      return (carData[cars].sum / carData[cars].count).toFixed(2);
    }
    return "0";
  });

  console.log("Car Space Averages:", carAverages);

  // Create fourth chart with bottom 20 suburbs data
  const chart4 = new Chart(ctx4, {
    type: "bar",
    data: {
      labels: bottomSuburbLabels,
      datasets: [
        {
          label: "Average House Price by Suburb (Bottom 20)",
          data: bottomSuburbAverages.map((price) => parseFloat(price)),
          backgroundColor: generateColors(20),
          borderColor: generateBorderColors(20),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Average Price ($)",
            color: "white",
          },
          ticks: {
            color: "white",
            callback: function (value) {
              return "$" + value.toLocaleString("en-US");
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Suburb",
            color: "white",
          },
          ticks: {
            color: "white",
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Bottom 20 Suburbs by Average House Price",
          color: "white",
          font: {
            size: 16,
          },
        },
        legend: {
          labels: {
            color: "white",
          },
        },
      },
    },
  });

  // Create the sixth chart for bedrooms
  const ctx6 = document.createElement("canvas");
  ctx6.style.width = "100%";
  ctx6.style.height = "400px";
  ctx6.style.maxHeight = "400px";
  ctx6.style.marginTop = "20px";
  document.getElementById("charts").appendChild(ctx6);

  // Create the seventh chart for bathrooms
  const ctx7 = document.createElement("canvas");
  ctx7.style.width = "100%";
  ctx7.style.height = "400px";
  ctx7.style.maxHeight = "400px";
  ctx7.style.marginTop = "20px";
  document.getElementById("charts").appendChild(ctx7);

  // Process data for bedrooms averages
  const bedroomData = {};
  allData.forEach((house) => {
    if (house.Bedroom2 && house.Price) {
      const bedrooms = parseFloat(house.Bedroom2);
      const price = parseFloat(house.Price);
      // Only process data for 0-5 bedrooms
      if (!isNaN(bedrooms) && !isNaN(price) && bedrooms >= 1 && bedrooms <= 5) {
        if (!bedroomData[bedrooms]) {
          bedroomData[bedrooms] = {
            sum: 0,
            count: 0,
          };
        }
        bedroomData[bedrooms].sum += price;
        bedroomData[bedrooms].count += 1;
      }
    }
  });

  // Process data for bathrooms averages
  const bathroomData = {};
  allData.forEach((house) => {
    if (house.Bathroom && house.Price) {
      const bathrooms = parseFloat(house.Bathroom);
      const price = parseFloat(house.Price);
      // Only process data for 0-5 bathrooms
      if (
        !isNaN(bathrooms) &&
        !isNaN(price) &&
        bathrooms >= 1 &&
        bathrooms <= 5
      ) {
        if (!bathroomData[bathrooms]) {
          bathroomData[bathrooms] = {
            sum: 0,
            count: 0,
          };
        }
        bathroomData[bathrooms].sum += price;
        bathroomData[bathrooms].count += 1;
      }
    }
  });

  // Calculate averages for bedrooms (1-5 only)
  const bedroomLabels = Array.from({ length: 5 }, (_, i) => (i + 1).toString());
  const bedroomAverages = bedroomLabels.map((bedrooms) => {
    if (bedroomData[bedrooms]) {
      return (bedroomData[bedrooms].sum / bedroomData[bedrooms].count).toFixed(
        2
      );
    }
    return "0";
  });

  // Calculate averages for bathrooms (1-5 only)
  const bathroomLabels = Array.from({ length: 5 }, (_, i) =>
    (i + 1).toString()
  );
  const bathroomAverages = bathroomLabels.map((bathrooms) => {
    if (bathroomData[bathrooms]) {
      return (
        bathroomData[bathrooms].sum / bathroomData[bathrooms].count
      ).toFixed(2);
    }
    return "0";
  });

  console.log("Bedroom Averages:", bedroomAverages);
  console.log("Bathroom Averages:", bathroomAverages);

  // Create fifth chart with car space data
  const chart5 = new Chart(ctx5, {
    type: "bar",
    data: {
      labels: carLabels.map((cars) => cars + (cars === "1" ? " Car" : " Cars")),
      datasets: [
        {
          label: "Average House Price by Number of Car Spaces",
          data: carAverages.map((price) => parseFloat(price)),
          backgroundColor: generateColors(6),
          borderColor: generateBorderColors(6),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Average Price ($)",
            color: "white",
          },
          ticks: {
            color: "white",
            callback: function (value) {
              return "$" + value.toLocaleString("en-US");
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Number of Car Spaces",
            color: "white",
          },
          ticks: {
            color: "white",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Average House Price by Number of Car Spaces",
          color: "white",
          font: {
            size: 16,
          },
        },
        legend: {
          labels: {
            color: "white",
          },
        },
      },
    },
  });

  // Create sixth chart with bedroom data
  const chart6 = new Chart(ctx6, {
    type: "bar",
    data: {
      labels: bedroomLabels.map(
        (bedrooms) => bedrooms + (bedrooms === "1" ? " Bedroom" : " Bedrooms")
      ),
      datasets: [
        {
          label: "Average House Price by Number of Bedrooms",
          data: bedroomAverages.map((price) => parseFloat(price)),
          backgroundColor: generateColors(6),
          borderColor: generateBorderColors(6),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Average Price ($)",
            color: "white",
          },
          ticks: {
            color: "white",
            callback: function (value) {
              return "$" + value.toLocaleString("en-US");
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Number of Bedrooms",
            color: "white",
          },
          ticks: {
            color: "white",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Average House Price by Number of Bedrooms",
          color: "white",
          font: {
            size: 16,
          },
        },
        legend: {
          labels: {
            color: "white",
          },
        },
      },
    },
  });

  // Create seventh chart with bathroom data
  const chart7 = new Chart(ctx7, {
    type: "bar",
    data: {
      labels: bathroomLabels.map(
        (bathrooms) =>
          bathrooms + (bathrooms === "1" ? " Bathroom" : " Bathrooms")
      ),
      datasets: [
        {
          label: "Average House Price by Number of Bathrooms",
          data: bathroomAverages.map((price) => parseFloat(price)),
          backgroundColor: generateColors(6),
          borderColor: generateBorderColors(6),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Average Price ($)",
            color: "white",
          },
          ticks: {
            color: "white",
            callback: function (value) {
              return "$" + value.toLocaleString("en-US");
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Number of Bathrooms",
            color: "white",
          },
          ticks: {
            color: "white",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Average House Price by Number of Bathrooms",
          color: "white",
          font: {
            size: 16,
          },
        },
        legend: {
          labels: {
            color: "white",
          },
        },
      },
    },
  });
}

async function fetchData(url) {
  const allData = [];
  let nextUrl = url;

  // Show the loading overlay
  document.getElementById("loading-overlay").style.display = "flex";

  try {
    // Loop to fetch data until `nextLink` is null
    while (nextUrl) {
      const response = await fetch(nextUrl);

      // Handle HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Verify the content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Received non-JSON response");
      }

      const json = await response.json();

      // Add fetched data to the allData array
      allData.push(...json.value);

      // Update `nextUrl` by replacing base URL with /data-api/rest/House and ensuring $first=1000 is included
      nextUrl = json.nextLink
        ? json.nextLink.replace(/^.*\/rest\/House/, "/data-api/rest/House")
        : null;
    }

    console.log("Fetched Data:", allData);

    // Once all data is fetched, perform your tasks
    createCharts(allData);
    addHouseMarkers(allData);
  } catch (error) {
    console.error("Error fetching data:", error);
    alert("An error occurred while fetching data. Please try again later.");
  } finally {
    // Hide the loading overlay
    document.getElementById("loading-overlay").style.display = "none";
  }
}

// Call the function with the initial endpoint and $first=5000 parameter
fetchData("/data-api/rest/House?$first=5000");

function addHouseMarkers(data) {
  var redDotIcon = L.icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    iconSize: [25, 25],
    iconAnchor: [4, 4],
  });

  var markers = L.markerClusterGroup();

  data.forEach(function (house) {
    var marker = L.marker([house.Lattitude, house.Longtitude], {
      icon: redDotIcon,
    });
    marker.on("mouseover", function () {
      var modal = document.getElementById("house-modal");
      modal.innerHTML = `
                <strong>Price:</strong> ${house.Price}<br>
                <strong>Rooms:</strong> ${house.Rooms}<br>
                <strong>Type:</strong> ${house.Type}<br>
                <strong>Method:</strong> ${house.Method}<br>
                <strong>SellerG:</strong> ${house.SellerG}<br>
                <strong>Distance:</strong> ${house.Distance}<br>
                <strong>Postcode:</strong> ${house.Postcode}<br>
                <strong>Bedroom2:</strong> ${house.Bedroom2}<br>
                <strong>Bathroom:</strong> ${house.Bathroom}<br>
                <strong>Car:</strong> ${house.Car}<br>
                <strong>Landsize:</strong> ${house.Landsize}<br>
                <strong>BuildingArea:</strong> ${house.BuildingArea}<br>
                <strong>YearBuilt:</strong> ${house.YearBuilt}<br>
                <strong>CouncilArea:</strong> ${house.CouncilArea}<br>
                <strong>Regionname:</strong> ${house.Regionname}<br>
                <strong>Propertycount:</strong> ${house.Propertycount}
            `;
      modal.style.display = "block";
    });
    marker.on("mouseout", function () {
      var modal = document.getElementById("house-modal");
      modal.style.display = "none";
    });
    markers.addLayer(marker);
  });

  map.addLayer(markers);
}

function showTab(tab) {
  // Remove active class from all tabs
  document.querySelectorAll(".tab").forEach(function (el) {
    el.classList.remove("active");
  });

  // Hide all content tabs
  document.querySelectorAll(".content-tab").forEach(function (el) {
    el.style.display = "none";
  });

  // Show selected content tab
  document.querySelector(`#${tab}`).style.display = "block";

  // Add active class to selected tab
  document
    .querySelector(`.tab[onclick="showTab('${tab}')"]`)
    .classList.add("active");

  // Special handling for map to ensure proper rendering
  if (tab === "map-container") {
    setTimeout(function () {
      map.invalidateSize();
    }, 100);
  }
}

function updateSliderValue(sliderId) {
  var slider = document.getElementById(sliderId);
  var valueSpan = document.getElementById(sliderId + "-value");
  valueSpan.textContent = slider.value;
}

async function sendData() {
  const latitude = document.getElementById("latitude").value;
  const longitude = document.getElementById("longitude").value;
  const suburb = document.getElementById("suburb").value;
  const bedroom2 = document.getElementById("bedroom2").value;
  const landsize = document.getElementById("landsize").value;
  const bathroom = document.getElementById("bathroom").value;
  const car = document.getElementById("car").value;
  const type = document.getElementById("type").value;
  const distance = document.getElementById("distance").value;

  console.log("Latest form data:");
  console.log("Latitude:", latitude);
  console.log("Longitude:", longitude);
  console.log("Suburb:", suburb);
  console.log("Bedroom2:", bedroom2);
  console.log("Landsize:", landsize);
  console.log("Bathroom:", bathroom);
  console.log("Car:", car);
  console.log("Type:", type);

  const requestBody = {
    input_data: {
      columns: [
        "Type",
        "Distance",
        "Bedroom2",
        "Bathroom",
        "Car",
        "Landsize",
        "Lattitude",
        "Longtitude",
        "Regionname",
      ],
      index: [0],
      data: [
        [
          type,
          distance,
          bedroom2,
          bathroom,
          car,
          landsize,
          latitude,
          longitude,
          suburb,
        ],
      ],
    },
  };

  const url =
    "https://fitness-tracker-functionapp.azurewebsites.net/api/httpMLRegression?code=jnV3SGWgA9BjslQszMSkMGfeLp-yvWZRwJsqXHK8hx-XAzFuelkEiw%3D%3D";

  // Show the loading overlay
  document.getElementById("loading-overlay").style.display = "flex";
  document.getElementById("loading-text").textContent =
    "Calculating the estimated price of your house. This service may take a while if it needs to warm up and deploy. Please be patient!";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const predictedPrice = result[0];
    document.getElementById("predicted-price").value = predictedPrice;
  } catch (error) {
    console.error("Error:", error);
    alert(
      "An error occurred while predicting the price. Please try again later."
    );

    // Set the predicted price to -1
    document.getElementById("predicted-price").value = "-1";
  } finally {
    // Hide the loading overlay
    document.getElementById("loading-overlay").style.display = "none";
    document.getElementById("loading-text").textContent = "Loading data...";
  }
}

// Declare global variables
let globalCSVData = null;
let allData = []; // Global variable for API data

// Function to load and parse CSV data
async function loadCSVData() {
  try {
    const response = await fetch("important_dataset_features.csv");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const rows = csvText.split("\n");
    const headers = rows[0].split(",");

    const data = rows.slice(1).map((row) => {
      const values = row.split(",");
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header.trim()] = values[index]?.trim();
      });
      return rowData;
    });

    // Set the global variable
    globalCSVData = data;
    console.log("CSV Data loaded:", globalCSVData);
    return data;
  } catch (error) {
    console.error("Error loading CSV:", error);
  }
}

// Load CSV data when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  const storedUserData = localStorage.getItem("userData");
  if (storedUserData) {
    const user = JSON.parse(storedUserData);
    document.getElementById("username").textContent = `${user.display_name}!`;
  }

  // Get the logout button by its ID
  const logoutButton = document.getElementById("logout-button");

  // Add an event listener for the logout button
  logoutButton.addEventListener("click", () => {
    // Remove user data from localStorage
    localStorage.removeItem("userData");

    // Redirect to the login page
    window.location.href = "../login/login.html"; // Adjust the URL as needed
  });

  await loadCSVData();
  console.log("CSV Data loaded");
});

// Show the map tab by default
showTab("instructions");
