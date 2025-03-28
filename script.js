document.addEventListener("DOMContentLoaded", () => {
    const apiKey = "5a4ab0e3ddb73fe3f2199676e45ccc7b";
    const weatherIcons = {
        '01d': 'fas fa-sun text-yellow-400',
        '01n': 'fas fa-moon text-gray-400',
        '02d': 'fas fa-cloud-sun text-yellow-300',
        '02n': 'fas fa-cloud-moon text-gray-300',
        '03d': 'fas fa-cloud text-gray-400',
        '03n': 'fas fa-cloud text-gray-400',
        '04d': 'fas fa-cloud text-gray-500',
        '04n': 'fas fa-cloud text-gray-500',
        '09d': 'fas fa-cloud-rain text-blue-400',
        '09n': 'fas fa-cloud-rain text-blue-400',
        '10d': 'fas fa-cloud-sun-rain text-blue-300',
        '10n': 'fas fa-cloud-moon-rain text-blue-300',
        '11d': 'fas fa-bolt text-yellow-500',
        '11n': 'fas fa-bolt text-yellow-500',
        '13d': 'fas fa-snowflake text-blue-200',
        '13n': 'fas fa-snowflake text-blue-200',
        '50d': 'fas fa-smog text-gray-400',
        '50n': 'fas fa-smog text-gray-400'
    };

    const elements = {
        cityInput: document.getElementById("cityInput"),
        searchBtn: document.getElementById("searchBtn"),
        currentLocationBtn: document.getElementById("currentLocationBtn"),
        currentWeather: document.getElementById("currentWeather"),
        forecast: document.getElementById("forecast"),
        extraDetails: document.getElementById("extraDetails"),
        suggestions: document.getElementById("suggestions"),
        errorMessage: document.getElementById("errorMessage"),
        loading: document.getElementById("loading"),
        lastUpdated: document.getElementById("lastUpdated"),
        location: document.querySelector("#location .city-name"),
        currentDate: document.querySelector("#currentDate .date"),
        weatherIcon: document.getElementById("weatherIcon"),
        temperature: document.getElementById("temperature"),
        weatherDescription: document.getElementById("weatherDescription"),
        feelsLike: document.querySelector("#feelsLike .feels-like-text"),
        windSpeed: document.getElementById("windSpeed"),
        humidity: document.getElementById("humidity"),
        pressure: document.getElementById("pressure"),
        visibility: document.getElementById("visibility"),
        cloudiness: document.getElementById("cloudiness"),
        sunrise: document.getElementById("sunrise"),
        sunset: document.getElementById("sunset"),
        errorText: document.querySelector("#errorMessage .error-text")
    };

    async function fetchWeatherData(city) {
        try {
            showLoading();
            const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`);
            if (!geoResponse.ok) throw new Error("Location service unavailable");
            
            const geoData = await geoResponse.json();
            if (!geoData?.length) throw new Error("City not found");
            
            const { lat, lon, name, country } = geoData[0];
            const [weatherResponse, forecastResponse] = await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
                fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
            ]);
            
            if (!weatherResponse.ok || !forecastResponse.ok) throw new Error("Weather data unavailable");
            
            const [weatherData, forecastData] = await Promise.all([weatherResponse.json(), forecastResponse.json()]);
            displayWeather(weatherData, forecastData, name, country);
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    function displayWeather(data, forecastData, cityName, country) {
        const date = new Date(data.dt * 1000);
        const sunrise = new Date(data.sys.sunrise * 1000);
        const sunset = new Date(data.sys.sunset * 1000);
        
        elements.location.textContent = `${cityName}, ${country}`;
        elements.currentDate.textContent = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        elements.temperature.textContent = `${Math.round(data.main.temp)}°C`;
        elements.weatherDescription.textContent = data.weather[0].description;
        elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
        elements.windSpeed.textContent = `${data.wind.speed} m/s`;
        elements.humidity.textContent = `${data.main.humidity}%`;
        elements.pressure.textContent = `${data.main.pressure} hPa`;
        elements.visibility.textContent = `${data.visibility / 1000} km`;
        elements.cloudiness.textContent = `${data.clouds.all}%`;
        elements.sunrise.textContent = sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        elements.sunset.textContent = sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const iconClass = weatherIcons[data.weather[0].icon] || 'fas fa-cloud';
        elements.weatherIcon.className = `text-5xl ${iconClass}`;
        
        displayForecast(forecastData);
        elements.lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        elements.currentWeather.classList.remove("hidden");
        elements.extraDetails.classList.remove("hidden");
    }

    function displayForecast(data) {
        elements.forecast.innerHTML = '';
        const dailyForecast = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);
        
        dailyForecast.forEach(day => {
            const date = new Date(day.dt * 1000);
            const iconClass = weatherIcons[day.weather[0].icon] || 'fas fa-cloud';
            
            elements.forecast.innerHTML += `
                <div class="weather-card bg-white rounded-lg shadow p-4">
                    <div class="flex justify-between items-center">
                        <p class="font-semibold">${date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                        <div class="text-2xl ${iconClass}"></div>
                    </div>
                    <div class="flex justify-between mt-2">
                        <div>
                            <p class="text-xl font-bold">${Math.round(day.main.temp)}°C</p>
                            <p class="text-sm text-gray-600 capitalize">${day.weather[0].description}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm">
                                <i class="fas fa-wind mr-1"></i>${day.wind.speed} m/s
                            </p>
                            <p class="text-sm">
                                <i class="fas fa-tint mr-1"></i>${day.main.humidity}%
                            </p>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    function getWeatherByLocation() {
        if (!navigator.geolocation) {
            showError("Geolocation not supported");
            return;
        }
        
        showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const [weatherResponse, forecastResponse] = await Promise.all([
                        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`),
                        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`)
                    ]);
                    
                    if (!weatherResponse.ok || !forecastResponse.ok) throw new Error("Weather data unavailable");
                    
                    const [weatherData, forecastData] = await Promise.all([weatherResponse.json(), forecastResponse.json()]);
                    displayWeather(weatherData, forecastData, weatherData.name, weatherData.sys.country);
                } catch (error) {
                    showError(error.message);
                } finally {
                    hideLoading();
                }
            },
            () => {
                showError("Location access denied");
                hideLoading();
            },
            { timeout: 10000 }
        );
    }

    function showLoading() {
        elements.loading.classList.remove("hidden");
        elements.currentWeather.classList.add("hidden");
        elements.extraDetails.classList.add("hidden");
        hideError();
    }

    function hideLoading() {
        elements.loading.classList.add("hidden");
    }

    function showError(message) {
        elements.errorText.textContent = message;
        elements.errorMessage.classList.remove("hidden");
        elements.currentWeather.classList.add("hidden");
        elements.extraDetails.classList.add("hidden");
    }

    function hideError() {
        elements.errorMessage.classList.add("hidden");
    }

    elements.searchBtn.addEventListener("click", () => {
        const city = elements.cityInput.value.trim();
        if (city) fetchWeatherData(city);
        else showError("Please enter a city name");
    });

    elements.currentLocationBtn.addEventListener("click", getWeatherByLocation);

    elements.cityInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const city = elements.cityInput.value.trim();
            if (city) fetchWeatherData(city);
        }
    });
});