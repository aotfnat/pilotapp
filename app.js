// app.js - Updated with AVWX.rest + better error handling
const API_BASE = 'https://avwx.rest/api';

async function fetchWeather(icao) {
    const upperIcao = icao.toUpperCase().trim();
    if (!/^[A-Z]{4}$/.test(upperIcao)) {
        showError("Invalid ICAO code (e.g. KLAX, KSEA)");
        return;
    }

    showLoading(true);

    try {
        // Fetch METAR
        const metarRes = await fetch(`${API_BASE}/metar/${upperIcao}`);
        const metarData = metarRes.ok ? await metarRes.json() : null;

        // Fetch TAF
        const tafRes = await fetch(`${API_BASE}/taf/${upperIcao}`);
        const tafData = tafRes.ok ? await tafRes.json() : null;

        if (metarData || tafData) {
            displayWeather(metarData, tafData, upperIcao);
        } else {
            showError("No data found for this airport.");
        }
    } catch (err) {
        console.error(err);
        showError("Network error. Check connection or try again later.");
    } finally {
        showLoading(false);
    }
}

function displayWeather(metar, taf, icao) {
    const container = document.getElementById('weather-display');
    container.innerHTML = `
        <h2>${icao} - ${metar?.station?.name || 'Unknown'}</h2>
        
        ${metar ? `
        <div class="report">
            <h3>METAR <span class="time">(${new Date(metar.timestamp).toLocaleTimeString()})</span></h3>
            <div class="raw">${metar.raw || 'No raw report'}</div>
            <div class="decoded">
                <strong>Flight Category:</strong> <span class="fltcat ${metar.flight_rules || 'unknown'}">${metar.flight_rules?.toUpperCase() || 'N/A'}</span><br>
                <strong>Wind:</strong> ${metar.wind_direction?.repr || ''}° at ${metar.wind_speed?.repr || ''} kt<br>
                <strong>Visibility:</strong> ${metar.visibility?.repr || 'N/A'}<br>
                <strong>Temperature:</strong> ${metar.temperature?.repr || 'N/A'}°C / ${metar.dewpoint?.repr || 'N/A'}°C<br>
                <strong>Altimeter:</strong> ${metar.altimeter?.repr || 'N/A'} inHg
            </div>
        </div>` : ''}

        ${taf ? `
        <div class="report">
            <h3>TAF</h3>
            <div class="raw">${taf.raw || 'No TAF available'}</div>
        </div>` : ''}
    `;
}

function showError(msg) {
    document.getElementById('weather-display').innerHTML = `<p class="error">${msg}</p>`;
}

function showLoading(isLoading) {
    // Add a simple loading indicator if you want
    console.log(isLoading ? 'Loading...' : 'Done');
}

// Rest of your file (event listeners, favorites, etc.) stays the same