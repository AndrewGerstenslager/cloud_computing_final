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

// Call the function with the initial endpoint and $first=1000 parameter
fetchData("/data-api/rest/House?$first=5000");

function createCharts(data) {
	// Extract data for histograms
	var prices = data.map((item) => item.Price);
	var rooms = data.map((item) => item.Rooms);
	var landsize = data.map((item) => item.Landsize);
	var car = data.map((item) => item.Car);
	var suburbs = data.map((item) => item.Suburb);
	var regionnames = data.map((item) => item.Regionname);

	// Sort prices and take the top 10
	prices.sort((a, b) => b - a);
	var topPrices = prices.slice(0, 10);

	// Create histogram for prices
	var ctxHistogram = document.getElementById("histogram").getContext("2d");
	new Chart(ctxHistogram, {
		type: "bar",
		data: {
			labels: topPrices.map((price, index) => `Decile: ${index + 1}`),
			datasets: [
				{
					label: "Top 10 Prices",
					data: topPrices,
					backgroundColor: "rgba(75, 192, 192, 0.2)",
					borderColor: "rgba(75, 192, 192, 1)",
					borderWidth: 1,
				},
			],
		},
		options: {
			scales: {
				x: {
					beginAtZero: true,
				},
				y: {
					beginAtZero: true,
				},
			},
		},
	});

	// Create histogram for rooms
	var ctxRoomsHistogram = document
		.getElementById("rooms-histogram")
		.getContext("2d");
	new Chart(ctxRoomsHistogram, {
		type: "bar",
		data: {
			labels: rooms.slice(0, 10).map((room, index) => `House ${index + 1}`),
			datasets: [
				{
					label: "Rooms",
					data: rooms.slice(0, 10),
					backgroundColor: "rgba(153, 102, 255, 0.2)",
					borderColor: "rgba(153, 102, 255, 1)",
					borderWidth: 1,
				},
			],
		},
		options: {
			scales: {
				x: {
					beginAtZero: true,
				},
				y: {
					beginAtZero: true,
				},
			},
		},
	});

	// Create histogram for landsize
	var ctxLandsizeHistogram = document
		.getElementById("landsize-histogram")
		.getContext("2d");
	new Chart(ctxLandsizeHistogram, {
		type: "bar",
		data: {
			labels: landsize.slice(0, 10).map((size, index) => `House ${index + 1}`),
			datasets: [
				{
					label: "Landsize",
					data: landsize.slice(0, 10),
					backgroundColor: "rgba(255, 159, 64, 0.2)",
					borderColor: "rgba(255, 159, 64, 1)",
					borderWidth: 1,
				},
			],
		},
		options: {
			scales: {
				x: {
					beginAtZero: true,
				},
				y: {
					beginAtZero: true,
				},
			},
		},
	});

	// Create histogram for car
	var ctxCarHistogram = document
		.getElementById("car-histogram")
		.getContext("2d");
	new Chart(ctxCarHistogram, {
		type: "bar",
		data: {
			labels: car.slice(0, 10).map((c, index) => `House ${index + 1}`),
			datasets: [
				{
					label: "Car",
					data: car.slice(0, 10),
					backgroundColor: "rgba(54, 162, 235, 0.2)",
					borderColor: "rgba(54, 162, 235, 1)",
					borderWidth: 1,
				},
			],
		},
		options: {
			scales: {
				x: {
					beginAtZero: true,
				},
				y: {
					beginAtZero: true,
				},
			},
		},
	});

	// Create pie chart for suburbs
	var suburbCounts = {};
	suburbs.forEach((suburb) => {
		suburbCounts[suburb] = (suburbCounts[suburb] || 0) + 1;
	});

	var ctxSuburbPieChart = document
		.getElementById("suburb-pie-chart")
		.getContext("2d");
	new Chart(ctxSuburbPieChart, {
		type: "pie",
		data: {
			labels: Object.keys(suburbCounts),
			datasets: [
				{
					label: "Suburbs",
					data: Object.values(suburbCounts),
					backgroundColor: Object.keys(suburbCounts).map(
						(_, index) =>
							`rgba(${(index * 25) % 255}, ${(index * 50) % 255}, ${
								(index * 75) % 255
							}, 0.2)`
					),
					borderColor: Object.keys(suburbCounts).map(
						(_, index) =>
							`rgba(${(index * 25) % 255}, ${(index * 50) % 255}, ${
								(index * 75) % 255
							}, 1)`
					),
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
		},
	});

	// Create pie chart for regionnames
	var regionnameCounts = {};
	regionnames.forEach((regionname) => {
		regionnameCounts[regionname] = (regionnameCounts[regionname] || 0) + 1;
	});

	var ctxRegionnamePieChart = document
		.getElementById("regionname-pie-chart")
		.getContext("2d");
	new Chart(ctxRegionnamePieChart, {
		type: "pie",
		data: {
			labels: Object.keys(regionnameCounts),
			datasets: [
				{
					label: "Regionnames",
					data: Object.values(regionnameCounts),
					backgroundColor: Object.keys(regionnameCounts).map(
						(_, index) =>
							`rgba(${(index * 25) % 255}, ${(index * 50) % 255}, ${
								(index * 75) % 255
							}, 0.2)`
					),
					borderColor: Object.keys(regionnameCounts).map(
						(_, index) =>
							`rgba(${(index * 25) % 255}, ${(index * 50) % 255}, ${
								(index * 75) % 255
							}, 1)`
					),
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
		},
	});
}

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
	document.querySelectorAll(".tab").forEach(function (el) {
		el.classList.remove("active");
	});
	document.querySelectorAll("#map-container, #charts").forEach(function (el) {
		el.style.display = "none";
	});
	document.querySelector(`#${tab}`).style.display = "block";
	document
		.querySelector(`.tab[onclick="showTab('${tab}')"]`)
		.classList.add("active");
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
					0,
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
  document.getElementById("loading-text").textContent = "Calculating the estimated price of your house...";
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

// Show the map tab by default
showTab("map-container");
