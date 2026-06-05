// pilot-pwa/app.js - Clean version with AVWX.rest (CORS-friendly)

let airports = [];

const sampleAirports = [
  { icao: "KSEA", name: "Seattle-Tacoma Intl", city: "Seattle", state: "WA" },
  { icao: "KBFI", name: "Boeing Field", city: "Seattle", state: "WA" },
  { icao: "KSFO", name: "San Francisco Intl", city: "San Francisco", state: "CA" },
  { icao: "KLAX", name: "Los Angeles Intl", city: "Los Angeles", state: "CA" },
  { icao: "KJFK", name: "John F Kennedy Intl", city: "New York", state: "NY" },
  { icao: "KORD", name: "Chicago O'Hare", city: "Chicago", state: "IL" },
  { icao: "KMIA", name: "Miami Intl", city: "Miami", state: "FL" },
  { icao: "KSDL", name: "Scottsdale", city: "Scottsdale", state: "AZ" },
];

async function loadAirports() {
  try {
    const saved = localStorage.getItem('usAirports');
    airports = saved ? JSON.parse(saved) : [...sampleAirports];
    localStorage.setItem('usAirports', JSON.stringify(airports));
    renderAirportList();
  } catch (e) {
    airports = [...sampleAirports];
    renderAirportList();
  }
}

function renderAirportList(filtered = null) {
  const container = document.getElementById('airports-container');
  if (!container) return;
  container.innerHTML = '';
  const list = filtered || airports;
  list.forEach(apt => {
    const div = document.createElement('div');
    div.className = 'airport-item';
    div.textContent = `${apt.icao} - ${apt.name} (${apt.city}, ${apt.state})`;
    div.onclick = () => {
      document.getElementById('icao-input').value = apt.icao;
      fetchWeather();
    };
    container.appendChild(div);
  });
}

function filterAirports() {
  const term = document.getElementById('airport-search').value.toUpperCase().trim();
  const filtered = airports.filter(a => 
    a.icao.includes(term) || 
    a.name.toUpperCase().includes(term) || 
    a.city.toUpperCase().includes(term)
  );
  renderAirportList(filtered);
}

async function updateAirportList() {
  alert("In a full version this would download a large list of US airports. Using sample list for now.");
}

async function fetchWeather() {
  const icaoInput = document.getElementById('icao-input');
  let icao = icaoInput.value.trim().toUpperCase();

  if (!icao || icao.length !== 4) {
    alert('Please enter a valid 4-letter ICAO code (e.g. KLAX)');
    return;
  }

  const display = document.getElementById('weather-display');
  display.classList.remove('hidden');
  display.innerHTML = `<p>Loading weather for ${icao}...</p>`;

  try {
    // Use AVWX.rest - CORS enabled and reliable
    const [metarRes, tafRes] = await Promise.all([
      fetch(`https://avwx.rest/api/metar/${icao}`),
      fetch(`https://avwx.rest/api/taf/${icao}`)
    ]);

    const metar = metarRes.ok ? await metarRes.json() : null;
    const taf = tafRes.ok ? await tafRes.json() : null;

    let html = `<h2>${icao} — ${metar?.station?.name || 'Unknown Airport'}</h2>`;

    if (metar) {
      html += `
        <div class="report">
          <h3>METAR <span class="fltcat ${metar.flight_rules?.toLowerCase() || 'unknown'}">${(metar.flight_rules || 'N/A').toUpperCase()}</span></h3>
          <pre class="raw">${metar.raw || 'No raw data'}</pre>
          <p><strong>Wind:</strong> ${metar.wind_direction?.repr || '—'}° / ${metar.wind_speed?.repr || '—'} kt</p>
          <p><strong>Visibility:</strong> ${metar.visibility?.repr || '—'}</p>
          <p><strong>Temp/Dew:</strong> ${metar.temperature?.repr || '—'}°C / ${metar.dewpoint?.repr || '—'}°C</p>
        </div>`;
    }

    if (taf) {
      html += `
        <div class="report">
          <h3>TAF</h3>
          <pre class="raw">${taf.raw || 'No TAF available'}</pre>
        </div>`;
    }

    html += `
      <div class="report">
        <h3>D-ATIS / AWOS</h3>
        <p>Check official frequencies in the Chart Supplement. METAR is the best real-time proxy.</p>
      </div>`;

    display.innerHTML = html;
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
  } catch (e) {
    console.error(e);
    display.innerHTML = `<p class="error">Error fetching data.<br>Check your internet connection and try again.</p>`;
  }
}

function addToFavorites() {
  const icao = document.getElementById('icao-input').value.trim().toUpperCase();
  if (!icao || icao.length !== 4) return;
  let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  if (!favs.includes(icao)) {
    favs.push(icao);
    localStorage.setItem('favorites', JSON.stringify(favs));
    renderFavorites();
  }
}

function renderFavorites() {
  const container = document.getElementById('favorites-list');
  if (!container) return;
  const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  container.innerHTML = favs.map(icao => 
    `<div class="airport-item" onclick="fetchWeatherFromFav('${icao}')">${icao}</div>`
  ).join('');
}

function fetchWeatherFromFav(icao) {
  document.getElementById('icao-input').value = icao;
  fetchWeather();
}

// Initialize
window.onload = () => {
  loadAirports();
  renderFavorites();
};