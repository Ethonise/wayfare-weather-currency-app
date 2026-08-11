// ---------- WEATHER ----------

const WMO_CODES = {
  0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Rain showers", 81: "Heavy showers", 82: "Violent showers",
  95: "Thunderstorm", 96: "Thunderstorm + hail", 99: "Severe thunderstorm"
};

const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city-input');
const weatherResult = document.getElementById('weather-result');

weatherForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  weatherResult.innerHTML = '<p class="readout-empty loading">Looking that up…</p>';
  const btn = weatherForm.querySelector('button');
  btn.disabled = true;

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      weatherResult.innerHTML = `<p class="readout-error">Couldn't find "${city}". Try a different spelling.</p>`;
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
    const weatherData = await weatherRes.json();
    const cw = weatherData.current_weather;
    const description = WMO_CODES[cw.weathercode] || "Unknown conditions";

    weatherResult.innerHTML = `
      <div class="weather-main">
        <span class="weather-temp">${Math.round(cw.temperature)}°C</span>
        <span class="weather-city">${name}, ${country}</span>
      </div>
      <p class="weather-desc">${description}</p>
      <div class="weather-meta">
        <span>Wind <strong>${cw.windspeed} km/h</strong></span>
        <span>Updated <strong>${cw.time.slice(11, 16)}</strong></span>
      </div>
    `;
  } catch (err) {
    weatherResult.innerHTML = '<p class="readout-error">Something went wrong fetching the weather. Try again.</p>';
    console.error(err);
  } finally {
    btn.disabled = false;
  }
});

// ---------- CURRENCY ----------

// Fixed list — 10 currencies covering major regions plus the ones requested
const CURRENCIES = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  RUB: "Russian Ruble",
  INR: "Indian Rupee",
  KGS: "Kyrgyzstani Som",
  CNY: "Chinese Yuan",
  JPY: "Japanese Yen",
  TRY: "Turkish Lira",
  KZT: "Kazakhstani Tenge"
};

const currencyForm = document.getElementById('currency-form');
const amountInput = document.getElementById('amount-input');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const currencyResult = document.getElementById('currency-result');

function loadCurrencies() {
  const options = Object.entries(CURRENCIES)
    .map(([code, label]) => `<option value="${code}">${code} — ${label}</option>`)
    .join('');

  fromSelect.innerHTML = options;
  toSelect.innerHTML = options;
  fromSelect.value = 'USD';
  toSelect.value = 'RUB';
}
loadCurrencies();

currencyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;
  if (!amount || amount <= 0) return;

  currencyResult.innerHTML = '<p class="readout-empty loading">Converting…</p>';
  const btn = currencyForm.querySelector('button');
  btn.disabled = true;

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    const data = await res.json();

    if (data.result !== 'success' || !data.rates[to]) {
      currencyResult.innerHTML = `<p class="readout-error">No rate available for ${from} → ${to} right now.</p>`;
      return;
    }

    const rate = data.rates[to];
    const converted = amount * rate;

    currencyResult.innerHTML = `
      <div class="currency-result-main">
        <span class="currency-amount">${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        <span class="currency-code">${to}</span>
      </div>
      <p class="currency-rate">1 ${from} = ${rate.toFixed(4)} ${to} · updated ${data.time_last_update_utc || ''}</p>
    `;
  } catch (err) {
    currencyResult.innerHTML = '<p class="readout-error">Couldn\'t fetch the exchange rate. Try again.</p>';
    console.error(err);
  } finally {
    btn.disabled = false;
  }
});