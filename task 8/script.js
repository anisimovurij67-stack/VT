const TARGET_TICKERS = ['SBER', 'GAZP', 'LKOH', 'ROSN', 'GMKN'];
const COMPANY_META = {
  SBER: { icon: '🏛️', defaultName: 'Сбербанк' },
  GAZP: { icon: '⛽', defaultName: 'Газпром' },
  LKOH: { icon: '🛢️', defaultName: 'Лукойл' },
  ROSN: { icon: '🏭', defaultName: 'Роснефть' },
  GMKN: { icon: '⛏️', defaultName: 'Норникель' }
};

let chartInstance = null;
let currentTicker = 'SBER';
function formatCap(value) {
  if (!value || isNaN(value)) return 'Капитализация: —';
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2).replace('.', ',')} трлн ₽`;
  }
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2).replace('.', ',')} млрд ₽`;
  }
  return `${value.toLocaleString('ru-RU')} ₽`;
}
async function loadCompaniesData() {
  const url = `https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?securities=${TARGET_TICKERS.join(',')}&iss.only=securities,marketdata&iss.meta=off`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const secBlock = json.securities;
    const mktBlock = json.marketdata;
    const secIdIdx = secBlock.columns.indexOf('SECID');
    const nameIdx = secBlock.columns.indexOf('SHORTNAME');
    const issueSizeIdx = secBlock.columns.indexOf('ISSUESIZE');

    const securitiesInfo = {};
    secBlock.data.forEach(row => {
      const ticker = row[secIdIdx];
      securitiesInfo[ticker] = {
        name: row[nameIdx],
        issueSize: row[issueSizeIdx]
      };
    });

    const mktSecIdIdx = mktBlock.columns.indexOf('SECID');
    const lastIdx = mktBlock.columns.indexOf('LAST');
    const prevPriceIdx = mktBlock.columns.indexOf('PREVPRICE');
    const marketPriceIdx = mktBlock.columns.indexOf('MARKETPRICE');

    const marketCaps = {};
    mktBlock.data.forEach(row => {
      const ticker = row[mktSecIdIdx];
      const info = securitiesInfo[ticker];
      if (!info || !info.issueSize) return;

        let price = row[lastIdx];
      if (!price || price <= 0) price = row[marketPriceIdx];
      if (!price || price <= 0) price = row[prevPriceIdx];

      if (price) {
        marketCaps[ticker] = price * info.issueSize;
      }
    });

    renderCompanyButtons(securitiesInfo, marketCaps);
  } catch (err) {
    console.error('Ошибка загрузки данных компаний:', err);
    renderCompanyButtons({}, {});
  }
}

function renderCompanyButtons(securitiesInfo, marketCaps) {
  const container = document.getElementById('companyButtons');
  container.innerHTML = '';

  TARGET_TICKERS.forEach(ticker => {
    const info = securitiesInfo[ticker] || {};
    const name = info.name || COMPANY_META[ticker]?.defaultName || ticker;
    const cap = marketCaps[ticker];
    const icon = COMPANY_META[ticker]?.icon || '📊';

    const btn = document.createElement('button');
    btn.className = `company-card ${ticker === currentTicker ? 'active' : ''}`;
    btn.id = `btn-${ticker}`;
    btn.onclick = () => selectCompany(ticker, name);

    btn.innerHTML = `
      <div class="company-icon">${icon}</div>
      <div class="company-info">
        <div class="company-ticker">${ticker}</div>
        <div class="company-name">${name}</div>
        <div class="company-cap">${formatCap(cap)}</div>
      </div>
    `;

    container.appendChild(btn);
  });
}

function selectCompany(ticker, companyName) {
  currentTicker = ticker;

  document.querySelectorAll('.company-card').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-${ticker}`);
  if (activeBtn) activeBtn.classList.add('active');

  loadMonthlyChart(ticker, companyName);
}

async function loadMonthlyChart(ticker, companyName) {
  const till = new Date();
  const from = new Date();
  from.setMonth(till.getMonth() - 1);

  const formatDate = d => d.toISOString().slice(0, 10);
  const fromStr = formatDate(from);
  const tillStr = formatDate(till);

  document.getElementById('chartTitle').textContent = `${ticker} (${companyName}) — цена за месяц`;
  document.getElementById('dateRange').textContent = `Период: ${fromStr} — ${tillStr}`;

  const candlesUrl = `https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/${ticker}/candles.json?from=${fromStr}&till=${tillStr}&interval=24&iss.meta=off`;

  try {
    const res = await fetch(candlesUrl);
    const data = await res.json();
    const block = data.candles;

    const closeIdx = block.columns.indexOf('close');
    const beginIdx = block.columns.indexOf('begin');

    const labels = block.data.map(r => r[beginIdx].slice(0, 10));
    const prices = block.data.map(r => r[closeIdx]);

    renderChart(ticker, labels, prices);
  } catch (err) {
    console.error('Ошибка получения свечей:', err);
  }
}

function renderChart(ticker, labels, prices) {
  const ctx = document.getElementById('stockChart').getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 380);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.28)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${ticker} — цена закрытия, ₽`,
        data: prices,
        borderColor: '#2563eb',
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.25,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#2563eb'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 14,
            font: { size: 12, weight: '600' }
          }
        },
        tooltip: {
          callbacks: {
            label: context => `Цена: ${context.parsed.y.toLocaleString('ru-RU')} ₽`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } }
        },
        y: {
          beginAtZero: false,
          grid: { color: '#f1f5f9' },
          ticks: {
            callback: value => value.toLocaleString('ru-RU') + ' ₽'
          }
        }
      }
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  loadCompaniesData();
  loadMonthlyChart('SBER', 'Сбербанк');
});