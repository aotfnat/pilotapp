<script>
// app.js
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
  container.innerHTML = '';
  const list = filtered || airports;
  list.forEach(apt => {
    const div = document.createElement('div');
    div.className = 'airport-item';
    div.textContent = `${apt.icao} - ${apt.name} (${apt.city}, ${apt.state})`;
    div.onclick = () => {
      document.getElementById('icao-input').value = apt.icao;
      fetchWeather(apt.icao);   // Pass ICAO explicitly
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
  const status = document.getElementById('status');
  status.textContent = 'Updating...';
  alert("In a full version this would fetch a large airports.json. For now using sample list.");
  status.textContent = 'Ready';
}

async function fetchWeather(forcedIcao = null) {
  let icao = forcedIcao || document.getElementById('icao-input').value.trim().toUpperCase();

  if (!icao || icao.length !== 4 || !/^[A-Z0-9]{4}$/.test(icao)) {
    alert('Please enter a valid 4-letter ICAO code (e.g. KLAX)');
    return;
  }

  const display = document.getElementById('weather-display');
  display.classList.remove('hidden');
  display.innerHTML = '<p>Loading weather for ' + icao + '...</p>';

  try {
    // Use AVWX.rest (CORS-enabled)
    const [metarRes, tafRes] = await Promise.all([
      fetch(`https://avwx.rest/api/metar/${icao}`),
      fetch(`https://avwx.rest/api/taf/${icao}`)
    ]);

    const metar = metarRes.ok ? await metarRes.json() : null;
    const taf = tafRes.ok ? await tafRes.json() : null;

    let html = `<h2>${icao} — ${metar?.station?.name || 'Airport'}</h2>`;

    if (metar) {
      html += `
        <div class="report">
          <h3>METAR <span class="flightcat-${(metar.flight_rules || 'unknown').toLowerCase()}">${(metar.flight_rules || 'N/A').toUpperCase()}</span></h3>
          <pre>${metar.raw || 'No raw METAR'}</pre>
          <p>Wind: ${metar.wind_direction?.repr || '—'} @ ${metar.wind_speed?.repr || '—'} kt</p>
          <p>Vis: ${metar.visibility?.repr || '—'} | Temp: ${metar.temperature?.repr || '—'}°C</p>
        </div>`;
    }

    if (taf) {
      html += `
        <div class="report">
          <h3>TAF</h3>
          <pre>${taf.raw || 'No TAF available'}</pre>
        </div>`;
    }

    html += `
      <div class="report">
        <h3>D-ATIS / AWOS</h3>
        <p>Use official frequencies from Chart Supplement. METAR is often the best real-time proxy.</p>
      </div>`;

    display.innerHTML = html;
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
  } catch (e) {
    console.error(e);
    display.innerHTML = `<p class="error">Error fetching data.<br>Try again or check your internet connection.</p>`;
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
  const list = document.getElementById('favorites-list');
  const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  list.innerHTML = favs.map(icao => 
    `<div class="airport-item" onclick="fetchWeather('${icao}')">${icao}</div>`
  ).join('');
}

// Init
window.onload = () => {
  loadAirports();
  renderFavorites();
};
</script>