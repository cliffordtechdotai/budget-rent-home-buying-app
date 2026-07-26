/**
 * Automated checks for the calculator.
 *
 * Run them with:   npm test
 *
 * Each `test(...)` below puts known numbers in and checks the answer that comes out.
 * If one fails you get the expected value, the actual value, and the line it broke on.
 *
 * How this works: the dashboard's maths lives inside app/dashboard/Dashboard.js as one
 * big block of JavaScript that normally only runs in a browser. These tests load that
 * exact block and run it against a pretend page, so they check the real shipped code
 * rather than a copy that could drift out of sync with it.
 *
 * Several of these exist because that exact bug actually happened - they are here so it
 * cannot come back unnoticed.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'app', 'dashboard', 'Dashboard.js');

// ---------------------------------------------------------------------------
// Pretend browser: just enough of a web page for the dashboard code to run.
// ---------------------------------------------------------------------------
function loadDashboard() {
  // Git rewrites this file with Windows line endings on checkout, so normalise before
  // looking for anything - otherwise the markers below silently miss and we end up
  // running the page markup as if it were code.
  const src = fs.readFileSync(SOURCE, 'utf-8').replace(/\r\n/g, '\n');

  const hs = src.lastIndexOf('__html: `') + 9;
  const he = src.indexOf('`}} />', hs);
  const html = src.slice(hs, he);

  const ss = src.indexOf('const DASHBOARD_SCRIPT = `') + 'const DASHBOARD_SCRIPT = `'.length;
  const se = src.indexOf('`;\n\nexport default function Dashboard', ss);
  if (ss < 30 || se < 0) throw new Error("Could not find the dashboard script inside Dashboard.js - the markers this test relies on have moved.");
  const raw = src.slice(ss, se);

  // The script is stored inside backticks, so backticks and $ within it are escaped.
  // Undo that to recover the code the browser actually receives.
  let code = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\\' && (raw[i + 1] === '`' || raw[i + 1] === '$')) { code += raw[i + 1]; i++; }
    else code += raw[i];
  }

  const REG = {};
  class El {
    constructor(id, tag, type, value, checked, cls) {
      this.id = id; this.tagName = (tag || 'div').toUpperCase(); this.type = type || '';
      this.value = value || ''; this.checked = !!checked;
      this._cls = new Set((cls || '').split(/\s+/).filter(Boolean));
      this.textContent = ''; this._html = ''; this.style = {}; this.placeholder = '';
      this.readOnly = false; this.disabled = false; this.title = ''; this.children = [];
      this.max = ''; this.min = '';
      const self = this;
      this.classList = {
        add: c => self._cls.add(c), remove: c => self._cls.delete(c),
        contains: c => self._cls.has(c),
        toggle: (c, f) => { const on = f === undefined ? !self._cls.has(c) : !!f; on ? self._cls.add(c) : self._cls.delete(c); return on; },
      };
    }
    // A real browser creates elements when innerHTML is set; the debt and goal rows
    // rely on that, so register any inputs the markup declares.
    get innerHTML() { return this._html; }
    set innerHTML(v) {
      this._html = String(v);
      for (const m of this._html.matchAll(/<(input|select)\b([^>]*)>/g)) {
        const a = m[2];
        const id = (a.match(/id="([^"]+)"/) || [])[1];
        if (!id || REG[id]) continue;
        REG[id] = new El(id, m[1], (a.match(/type="([^"]+)"/) || [])[1] || 'text',
          (a.match(/value="([^"]*)"/) || [])[1], /\bchecked\b/.test(a),
          (a.match(/class="([^"]+)"/) || [])[1]);
      }
    }
    get className() { return [...this._cls].join(' '); }
    set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
    addEventListener() {} removeEventListener() {} click() {}
    appendChild(c) { this.children.push(c); if (c.id) REG[c.id] = c; return c; }
    querySelectorAll() { return []; }
    remove() {}
  }

  for (const m of html.matchAll(/<(input|select|div|span|button|p)\b([^>]*)>/g)) {
    const tag = m[1], a = m[2];
    const id = (a.match(/id="([^"]+)"/) || [])[1];
    if (!id) continue;
    REG[id] = new El(id, tag,
      (a.match(/type="([^"]+)"/) || [])[1] || (tag === 'select' ? 'select-one' : 'text'),
      (a.match(/value="([^"]*)"/) || [])[1], /\bchecked\b/.test(a),
      (a.match(/class="([^"]+)"/) || [])[1]);
  }

  const store = {};
  const sandbox = {
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    document: {
      getElementById: id => REG[id] || null,
      createElement: t => new El(null, t),
      querySelectorAll: () => Object.values(REG).filter(e => e.tagName === 'INPUT' || e.tagName === 'SELECT'),
      addEventListener: () => {},
    },
    confirm: () => false,
    lastDownload: null,
  };
  sandbox.window = sandbox;
  sandbox.Blob = function (parts) { sandbox.lastDownload = parts[0]; };
  sandbox.URL = { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} };

  // Run the dashboard code with our pretend browser in place of the real one.
  const keys = Object.keys(sandbox);
  new Function(...keys, code)(...keys.map(k => sandbox[k]));

  const set = (id, v) => { if (REG[id]) REG[id].value = v; };
  const check = (id, v) => { if (REG[id]) REG[id].checked = v; };
  const text = id => (REG[id] ? REG[id].textContent : null);
  const num = id => Number(String(text(id) || '').replace(/[$,]/g, ''));

  return { REG, win: sandbox, set, check, text, num, html, src };
}

// A realistic starting point: a couple earning $120k in Pennsylvania.
function baseScenario(d) {
  d.check('calcFromGross', true);
  d.REG.householdType.value = 'couple';
  d.check('jointIncomeMode', true);
  d.set('grossJoint', '$120,000');
  d.set('stateSelect', 'PA');
  d.set('expRent', '$1,600'); d.set('expUtilities', '$200'); d.set('expGroceries', '$700');
  d.set('expGas', '$300'); d.set('expInsurance', '$300'); d.set('expSubs', '$70');
  d.set('expPhone', '$100'); d.set('expOther', '$200');
  d.set('monthlySave', '$1,500'); d.set('saveYears', '3'); d.set('hysaRate', '3');
  d.set('mortgageRate', '6.5'); d.set('closingCostPercent', '3'); d.set('taxMaintPercent', '1.5');
  d.check('includeTaxMaint', true); d.check('debtFreeFirst', true); d.check('existingInHysa', true);
  d.set('startDate', '2026-01-01');
  d.REG.affordModeSelect.value = 'max';
  d.win.calculateAll();
  return d;
}

// ---------------------------------------------------------------------------
// The maths
// ---------------------------------------------------------------------------

// Pulls a labelled figure out of one of the dark result cards, e.g. "Principal & Interest".
function figureFrom(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = html.match(new RegExp(escaped + '<\\/span><span[^>]*>\\$([\\d,]+)'));
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

test('a $400,000 loan at 6.5% over 30 years costs about $2,528/month', () => {
  // The reference figure from the project notes. If this moves, the mortgage
  // formula changed and every payment in the app is affected.
  // Checked through the rendered card, so it tests what a user actually sees.
  const d = baseScenario(loadDashboard());
  d.REG.affordModeSelect.value = 'custom';
  d.win.onAffordModeChange();
  d.set('homePrice', '$400,000');
  d.check('useSavingsToggle', false);
  d.REG.downPaymentMode.value = 'dollar';
  d.set('downPayment', '$0');       // borrow the whole $400,000
  d.set('mortgageRate', '6.5');
  d.win.calculateAll();

  const pi = figureFrom(d.REG.compareResult.innerHTML, 'Principal & Interest');
  assert.ok(pi !== null, 'could not find the Principal & Interest figure on the card');
  assert.ok(Math.abs(pi - 2528) <= 1, `expected about $2,528/mo, the card shows $${pi}`);
});

test('$120,000 joint income in Pennsylvania nets $8,059/month', () => {
  const d = baseScenario(loadDashboard());
  assert.strictEqual(d.text('monthlyIncomeResult'), '$8,059');
});

test('clearing the mortgage rate is caught instead of quietly pricing a free loan', () => {
  // A blank rate once produced $1,111/mo instead of $2,528 - a 56% understatement
  // presented with total confidence. It must be flagged, not silently accepted.
  const d = baseScenario(loadDashboard());
  d.set('mortgageRate', '');
  d.win.calculateAll();
  assert.match(d.text('stageHouseSum'), /mortgage rate/i,
    'a missing mortgage rate should raise a warning');
});

test('the most expensive affordable house lands exactly on the payment limit', () => {
  // The whole point of "max affordable" is that it spends the budget precisely.
  const d = baseScenario(loadDashboard());
  const total = figureFrom(d.REG.maxAffordResult.innerHTML, 'Total Payment');
  const takeHome = d.num('incomeStat');
  const ceiling = takeHome * 0.28;
  assert.ok(total !== null, 'could not find the Total Payment figure');
  assert.ok(Math.abs(total - ceiling) <= 2,
    `payment $${total} should equal the 28% limit $${ceiling.toFixed(0)}`);
});

// ---------------------------------------------------------------------------
// The monthly budget
// ---------------------------------------------------------------------------

test('the monthly overview columns add up', () => {
  // These six figures are shown side by side, so they have to reconcile on screen.
  const d = baseScenario(loadDashboard());
  const income = d.num('incomeStat'), expenses = d.num('expenseStat');
  const savings = d.num('saveStat'), debt = d.num('debtStat');
  const goals = d.num('goalStat'), left = d.num('leftoverStat');
  assert.strictEqual(income - expenses - savings - debt - goals, left);
});

test("extra mortgage principal is not charged against today's budget", () => {
  // It only starts after you buy, by which point the house saving has stopped.
  // Counting both at once once reported being $1,535 over budget when the real
  // figure was $17 spare.
  const d = baseScenario(loadDashboard());
  const before = d.num('leftoverStat');
  d.set('mortExtra', '$1,000');
  d.win.calculateAll();
  assert.strictEqual(d.num('leftoverStat'), before,
    'adding extra mortgage principal must not change money left over today');
});

// ---------------------------------------------------------------------------
// Debt
// ---------------------------------------------------------------------------

test('paying more each month clears debt sooner', () => {
  const d = baseScenario(loadDashboard());
  d.set('lumpBalance', '$20,000'); d.set('lumpRate', '18');
  d.win.calculateAll();
  const slow = d.text('debtPayoffResult');
  d.set('debtExtra', '$800');
  d.win.calculateAll();
  const fast = d.text('debtPayoffResult');
  assert.notStrictEqual(slow, fast, 'paying more should change the payoff time');
});

test('a debt with no interest rate entered is flagged, not quietly assumed to be 0%', () => {
  const d = baseScenario(loadDashboard());
  d.set('lumpBalance', '$20,000');
  d.set('lumpRate', '');            // left blank
  d.win.calculateAll();
  assert.match(d.text('stageObligationsSum'), /interest rate/i);
});

test('a deliberate 0% promotional rate is accepted without complaint', () => {
  const d = baseScenario(loadDashboard());
  d.set('lumpBalance', '$20,000');
  d.set('lumpRate', '0');           // genuinely 0%, typed on purpose
  d.win.calculateAll();
  assert.doesNotMatch(d.text('stageObligationsSum'), /interest rate/i);
});

// ---------------------------------------------------------------------------
// Exported files
// ---------------------------------------------------------------------------

test('the spreadsheet export has real line breaks', () => {
  // It once exported as a single unopenable line because the newline was written
  // literally instead of as an actual line break.
  const d = baseScenario(loadDashboard());
  d.win.exportCSV();
  const csv = d.win.lastDownload;
  assert.ok(csv, 'nothing was exported');
  assert.ok(!csv.includes('\\r\\n'), 'line breaks were written as text instead of real breaks');
  assert.ok(csv.split('\r\n').length > 20, 'the spreadsheet should have many rows');
});

test('every spreadsheet row has exactly four columns', () => {
  const d = baseScenario(loadDashboard());
  d.win.exportCSV();
  const rows = d.win.lastDownload.split('\r\n');
  const columns = line => {
    let n = 1, quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (quoted && line[i + 1] === '"') i++; else quoted = !quoted; }
      else if (c === ',' && !quoted) n++;
    }
    return n;
  };
  const wrong = rows.map((r, i) => ({ i, n: columns(r) })).filter(x => x.n !== 4);
  assert.strictEqual(wrong.length, 0, `these rows have the wrong column count: ${JSON.stringify(wrong)}`);
});

test('everything you typed is captured in the saved file', () => {
  // The app writes this same structure to the browser on every keystroke and to disk
  // when you use Save As, so if a field goes missing here it is missing from backups too.
  const d = baseScenario(loadDashboard());
  const raw = d.win.localStorage.getItem('budgetDashboardData_v5');
  assert.ok(raw, 'nothing was saved at all');

  const saved = JSON.parse(raw);
  const expected = {
    grossJoint: '$120,000',
    stateSelect: 'PA',
    expRent: '$1,600',
    expOther: '$200',
    monthlySave: '$1,500',
    saveYears: '3',
    hysaRate: '3',
    mortgageRate: '6.5',
    jointIncomeMode: true,
    calcFromGross: true,
  };
  for (const [field, value] of Object.entries(expected)) {
    assert.strictEqual(saved[field], value, `the saved file lost "${field}"`);
  }
  // the open/closed state of each section rides along too
  assert.ok(saved.__collapsed && typeof saved.__collapsed === 'object', 'section layout was not saved');
});

test('a saved file can be read back and reproduces the same take-home figure', () => {
  // Round trip: capture the save, wipe every field, load it back, recalculate.
  const d = baseScenario(loadDashboard());
  const before = d.text('monthlyIncomeResult');
  const saved = JSON.parse(d.win.localStorage.getItem('budgetDashboardData_v5'));

  // wipe the form the way Clear All would
  ['grossJoint', 'expRent', 'expUtilities', 'expGroceries', 'expGas', 'expInsurance',
   'expSubs', 'expPhone', 'expOther', 'monthlySave'].forEach(id => d.set(id, ''));
  d.win.calculateAll();
  assert.notStrictEqual(d.text('monthlyIncomeResult'), before, 'wiping the form should change the result');

  // put the saved values back exactly as the loader does, then recalculate
  Object.entries(saved).forEach(([field, value]) => {
    if (field.startsWith('__')) return;
    const el = d.REG[field];
    if (!el) return;
    if (typeof value === 'boolean') el.checked = value; else el.value = value;
  });
  d.win.calculateAll();
  assert.strictEqual(d.text('monthlyIncomeResult'), before,
    'reloading a saved file should reproduce the original take-home figure');
});

// ---------------------------------------------------------------------------
// Page wiring - these catch crashes before they reach the browser
// ---------------------------------------------------------------------------

test('every button on the page points at a function that exists', () => {
  // Clicking "Show PMI detail" once crashed the page because its function was not
  // reachable from the markup.
  const d = loadDashboard();
  const used = new Set();
  for (const m of d.html.matchAll(/on(?:click|change|input)="([a-zA-Z0-9_]+)\(/g)) used.add(m[1]);
  const available = new Set();
  for (const m of d.src.matchAll(/window\.([a-zA-Z0-9_]+)\s*=/g)) available.add(m[1]);
  const missing = [...used].filter(f => !available.has(f));
  assert.deepStrictEqual(missing, [], `these buttons would crash: ${missing.join(', ')}`);
});

test('no two elements share the same id', () => {
  const d = loadDashboard();
  const counts = {};
  for (const m of d.html.matchAll(/id="([a-zA-Z0-9_]+)"/g)) counts[m[1]] = (counts[m[1]] || 0) + 1;
  const dupes = Object.entries(counts).filter(([, n]) => n > 1);
  assert.deepStrictEqual(dupes, [], `duplicated ids: ${JSON.stringify(dupes)}`);
});

test('the page markup is not missing a closing tag', () => {
  const d = loadDashboard();
  let depth = 0;
  for (const m of d.html.matchAll(/<(\/?)div\b[^>]*?(\/)?>/g)) {
    if (m[2] === '/') continue;
    depth += m[1] === '' ? 1 : -1;
  }
  assert.strictEqual(depth, 0, 'the number of opening and closing tags does not match');
});

test('every figure the code tries to display has somewhere to go', () => {
  const d = loadDashboard();
  const wanted = new Set();
  for (const m of d.src.matchAll(/getElementById\("([a-zA-Z0-9_]+)"\)/g)) wanted.add(m[1]);
  const present = new Set();
  for (const m of d.html.matchAll(/id="([a-zA-Z0-9_]+)"/g)) present.add(m[1]);
  const missing = [...wanted].filter(id => !present.has(id));
  assert.deepStrictEqual(missing, [], `no place on the page for: ${missing.join(', ')}`);
});
