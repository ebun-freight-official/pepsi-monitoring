import { formatMoney, formatNumber, formatDate } from './inventory'
import { EMPTIES_RATES } from '../data/bottleSizes'
import ebunLogo from '../assets/EBUN_NO_SLOGAN.png'

const escapeHtml = str =>
  String(str ?? '').replace(
    /[&<>"']/g,
    ch =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[ch])
  )

/**
 * Generates the loadout sheet and opens the browser print dialog
 * using a hidden off-screen iframe.
 *
 * @param {{ truck: string, loadout: Array, stocks?: Array }} args
 * @returns {Promise<boolean>}
 */
export function printLoadoutSheet ({ truck, loadout, stocks = [] }) {
  return new Promise(resolve => {
    const enriched = loadout.map((item, idx) => {
      const stock = stocks.find(s => s.product_name === item.product_name)
      const price = stock ? Number(stock.price_per_case) || 0 : 0
      return {
        idx: idx + 1,
        product_name: item.product_name,
        cases: Number(item.cases) || 0,
        price
      }
    })

    const now = new Date()

    const productRowsHtml = enriched
      .map(
        item => `
          <tr>
            <td class="num">${item.idx}</td>
            <td class="right">${formatMoney(item.price)}</td>
            <td class="name">${escapeHtml(item.product_name)}</td>
            <td class="right">${formatNumber(item.cases)}</td>
            <td class="sign"></td>
          </tr>`
      )
      .join('')

    const emptiesRowsHtml = EMPTIES_RATES.fullCase
      .map(
        r => `
          <tr>
            <td class="name">${escapeHtml(r.label)}</td>
            <td class="sign"></td>
            <td class="sign"></td>
            <td class="sign"></td>
          </tr>`
      )
      .join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Loadout Sheet - ${escapeHtml(truck)}</title>
<style>
  @page {
    size: A4;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }
  body {
    padding: 15mm 12mm;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Header: logo centered, title centered below ── */
  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-bottom: 12px;
    border-bottom: 2px solid #000;
    margin-bottom: 14px;
  }
  .logo {
    height: 52px;
    max-width: 220px;
    object-fit: contain;
    margin-bottom: 6px;
  }
  .title {
    font-size: 18px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #000;
    margin-top: 6px;
  }

  /* ── Meta row: agent left · date right ── */
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 18px;
  }
  .meta-row .agent {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #000;
  }
  .meta-row .date {
    font-size: 12px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #333;
    margin-bottom: 6px;
  }

  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td {
    border: 1px solid #000;
    padding: 6px 8px;
    font-size: 12px;
    vertical-align: middle;
  }
  th {
    background: #eee;
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
  }
  td.num {
    width: 36px;
    color: #666;
    text-align: center;
  }
  td.name { font-weight: 500; }
  td.right {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
  td.sign { height: 32px; }

  /* ── Signatures: label centered under its line ── */
  .signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    margin-top: 32px;
    padding-top: 8px;
  }
  .sig-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .sig-line {
    width: 100%;
    height: 44px;
    border-bottom: 1px solid #000;
  }
  .sig-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #666;
    margin-top: 4px;
  }
</style>
</head>
<body>
  <!-- Centered logo + title -->
  <div class="header">
    <img src="${ebunLogo}" class="logo" alt="Ebun">
    <div class="title">Loadout Sheet</div>
  </div>

  <!-- Agent left · Date right -->
  <div class="meta-row">
    <div class="agent">${escapeHtml(truck)}</div>
    <div class="date">${formatDate(now)}</div>
  </div>

  <div class="section-title">Products</div>
  <table>
    <thead>
      <tr>
        <th style="width: 36px;">#</th>
        <th style="width: 100px; text-align: right;">Price</th>
        <th>Product</th>
        <th style="width: 90px; text-align: right;">Qty</th>
        <th style="width: 130px; text-align: center;">Return</th>
      </tr>
    </thead>
    <tbody>
      ${productRowsHtml}
    </tbody>
  </table>

  <div class="section-title">Empties Received</div>
  <table>
    <thead>
      <tr>
        <th>Bottle Size</th>
        <th style="width: 120px; text-align: center;">Full Case</th>
        <th style="width: 120px; text-align: center;">Case Only</th>
        <th style="width: 120px; text-align: center;">Bottles Only</th>
      </tr>
    </thead>
    <tbody>
      ${emptiesRowsHtml}
    </tbody>
  </table>

  <!-- Signatures: label centered under line -->
  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Prepared By / Signature</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Agent Signature</div>
    </div>
  </div>
</body>
</html>`

    // ── Render into hidden off-screen iframe ───────────────────────
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.setAttribute('title', 'Loadout print')
    Object.assign(iframe.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
      width: '800px',
      height: '1000px',
      border: '0',
      opacity: '0',
      pointerEvents: 'none'
    })
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()

    let fired = false

    const fire = () => {
      if (fired) return
      fired = true
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      } catch (err) {
        console.error('Print failed:', err)
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
        resolve(true)
      }, 500)
    }

    const imgs = doc.images
    if (imgs.length === 0) {
      setTimeout(fire, 150)
      return
    }

    let loaded = 0
    const onOne = () => {
      loaded++
      if (loaded >= imgs.length) fire()
    }

    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i]
      if (img.complete && img.naturalWidth > 0) {
        onOne()
      } else {
        img.addEventListener('load', onOne, { once: true })
        img.addEventListener('error', onOne, { once: true })
      }
    }

    setTimeout(fire, 3000)
  })
}
