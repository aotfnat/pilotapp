let airports = []; // Will be loaded from local JSON or fallback

// Sample US weather-reporting airports (expand this or load full list)
const sampleAirports = [
  { icao: "KSEA", name: "Seattle-Tacoma Intl", city: "Seattle", state: "WA" },
  { icao: "KBFI", name: "Boeing Field", city: "Seattle", state: "WA" },
  { icao: "KSFO", name: "San Francisco Intl", city: "San Francisco", state: "CA" },
  { icao: "KLAX", name: "Los Angeles Intl", city: "Los Angeles", state: "CA" },
  { icao: "KJFK", name: "John F Kennedy Intl", city: "New York", state: "NY" },
  { icao: "KORD", name: "Chicago O'Hare", city: "Chicago", state: "IL" },
  { icao: "KMIA", name: "Miami Intl", city: "Miami", state: "FL" },
  // Add more - in production, load ~1000+ from JSON
];

async function loadAirports() {
  try {
    const saved = localStorage.getItem('usAirports');
    if (saved) {
      airports = JSON.parse(saved);
    } else {
      airports = [...sampleAirports];
      localStorage.setItem('usAirports', JSON.stringify(airports));
    }
    renderAirportList();
  } catch (e) {
    airports = [...sampleAirports];
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
      fetchWeather();
    };
    container.appendChild(div);
  });
}

function filterAirports() {
  const term = document.getElementById('airport-search').value.toUpperCase();
  const filtered = airports.filter(a => 
    a.icao.includes(term) || a.name.toUpperCase().includes(term) || a.city.toUpperCase().includes(term)
  );
  renderAirportList(filtered);
}

async function updateAirportList() {
  const status = document.getElementById('status');
  status.textContent = 'Updating...';
  try {
    // In real app, fetch full list from a hosted JSON or API
    // For now, simulate
    alert('In full version, this would fetch latest US weather stations from AviationWeather.gov or ourairports data.');
    // Example: fetch a static JSON you host alongside
    localStorage.setItem('usAirports', JSON.stringify(airports)); // persist
  } catch (e) {
    alert('Update failed. Using cached list.');
  }
  status.textContent = 'Ready';
}

async function fetchWeather() {
  const icao = document.getElementById('icao-input').value.trim().toUpperCase();
  if (!icao || icao.length !== 4) {
    alert('Please enter a valid 4-letter ICAO code');
    return;
  }

  const display = document.getElementById('weather-display');
  display.classList.remove('hidden');
  display.innerHTML = '<p>Loading...</p>';

  try {
    // METAR
    const metarRes = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`);
    const metarData = metarRes.ok ? await metarRes.json() : null;

    // TAF
    const tafRes = await fetch(`https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`);
    const tafData = tafRes.ok ? await tafRes.json() : null;

    let html = `<h2>${icao}</h2>`;

    if (metarData && metarData.length > 0) {
      const m = metarData[0];
      html += `
        <div class="report">
          <h3>METAR <span class="flightcat-${getFlightCategory(m)}">${getFlightCategory(m).toUpperCase()}</span></h3>
          <pre>${m.raw_text || m.metar}</pre>
          <p>Temp: ${m.temp_c}°C / Wind: ${m.wind_dir_degrees || 'VRB'}@${m.wind_speed_kt}kt</p>
        </div>`;
    }

    if (tafData && tafData.length > 0) {
      const t = tafData[0];
      html += `
        <div class="report">
          <h3>TAF</h3>
          <pre>${t.raw_text || 'No TAF available'}</pre>
        </div>`;
    }

    // D-ATIS simulation (note: D-ATIS often requires specific sources, show placeholder)
    html += `
      <div class="report">
        <h3>D-ATIS / AWOS</h3>
        <p>Check frequency in Chart Supplement. Raw METAR above often used as backup.</p>
      </div>`;

    display.innerHTML = html;
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
  } catch (e) {
    display.innerHTML = `<p>Error fetching data. Check connection.<br>Raw fallback not implemented yet.</p>`;
  }
}

function getFlightCategory(metar) {
  // Simple logic - expand as needed
  const vis = parseFloat(metar.visibility_statute_mi || 10);
  const ceiling = metar.cloud_base_agl ? parseInt(metar.cloud_base_agl) : 9999;
  if (vis >= 5 && ceiling >= 3000) return 'vfr';
  if (vis >= 3 && ceiling >= 1000) return 'mvfr';
  return 'ifr';
}

function addToFavorites() {
  const icao = document.getElementById('icao-input').value.trim().toUpperCase();
  if (!icao) return;
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
    `<div class="airport-item" onclick="quickFetch('${icao}')">${icao}</div>`
  ).join('');
}

function quickFetch(icao) {
  document.getElementById('icao-input').value = icao;
  fetchWeather();
}

// Init
window.onload = () => {
  loadAirports();
  renderFavorites();
};