'use client';

import { useState, useMemo } from 'react';

// Everything the reader does not set is fixed here and stated on the page, so the
// result can be reasoned about instead of taken on trust.
const ASSUMPTIONS = {
  downPct: 20,
  closingPct: 3,
  sellPct: 6,
  taxMaintPct: 1.5,
  rentGrowth: 3,
  savingsReturn: 3,
  appreciation: 3,
  years: 15,
};

function project(rent, price, rate) {
  const a = ASSUMPTIONS;
  const down = price * a.downPct / 100;
  const upfront = down + price * a.closingPct / 100;
  const loan0 = price - down;
  const mr = rate / 100 / 12;
  const pi = mr > 0
    ? loan0 * (mr * Math.pow(1 + mr, 360)) / (Math.pow(1 + mr, 360) - 1)
    : loan0 / 360;

  // The renter never spends the deposit, so it starts out invested.
  let renterCash = upfront, ownerCash = 0;
  let balance = loan0, homeValue = price, currentRent = rent;
  const sr = a.savingsReturn / 100 / 12;
  const ap = a.appreciation / 100 / 12;
  const rows = [];

  for (let m = 1; m <= a.years * 12; m++) {
    const escrow = homeValue * (a.taxMaintPct / 100) / 12;
    const ownCost = pi + escrow;
    // whoever pays less that month banks the difference
    if (ownCost > currentRent) renterCash += ownCost - currentRent;
    else ownerCash += currentRent - ownCost;
    renterCash *= 1 + sr;
    ownerCash *= 1 + sr;
    balance = Math.max(0, balance + balance * mr - pi);
    homeValue *= 1 + ap;
    if (m % 12 === 0) {
      currentRent *= 1 + a.rentGrowth / 100;
      rows.push({
        year: m / 12,
        renter: renterCash,
        owner: homeValue - balance - homeValue * (a.sellPct / 100) + ownerCash,
      });
    }
  }
  return {
    rows,
    pi,
    escrow: price * (a.taxMaintPct / 100) / 12,
    upfront,
    cross: rows.find(r => r.owner > r.renter) || null,
  };
}

const money = n => '$' + Math.round(n).toLocaleString('en-US');

// Axis labels get abbreviated: a full "$1,082,881" overflows the chart's left margin
// and renders clipped.
const shortMoney = n =>
  n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M'
  : n >= 1e3 ? '$' + Math.round(n / 1e3) + 'k'
  : '$' + Math.round(n);

export default function RentVsBuy() {
  const [rent, setRent] = useState(2200);
  const [price, setPrice] = useState(400000);
  const [rate, setRate] = useState(6.5);

  const { rows, pi, escrow, upfront, cross } = useMemo(
    () => project(rent, price, rate), [rent, price, rate]);

  const ownCost = pi + escrow;
  const gap = ownCost - rent;

  // chart geometry
  const W = 640, H = 260, PAD = { l: 58, r: 14, t: 14, b: 28 };
  const maxY = Math.max(...rows.map(r => Math.max(r.renter, r.owner))) * 1.05;
  const x = y => PAD.l + ((y - 1) / (rows.length - 1)) * (W - PAD.l - PAD.r);
  const y = v => H - PAD.b - (v / maxY) * (H - PAD.t - PAD.b);
  const line = key => rows.map((r, i) => (i ? 'L' : 'M') + x(r.year) + ' ' + y(r[key])).join(' ');

  return (
    <div>
      <h1>Rent or Buy: When Does Buying Pull Ahead?</h1>
      <p className="subtitle">
        Change the three numbers that matter most and watch where the lines cross.
      </p>

      <div className="dashboard">
        <div className="card wide">
          <div className="row2">
            <div>
              <label htmlFor="rvb-rent">Monthly rent</label>
              <input id="rvb-rent" type="range" className="slider" min="800" max="5000" step="50"
                value={rent} onChange={e => setRent(Number(e.target.value))} />
              <div className="rvb-val num">{money(rent)}<span> / month</span></div>
            </div>
            <div>
              <label htmlFor="rvb-price">Home price</label>
              <input id="rvb-price" type="range" className="slider" min="100000" max="1200000" step="10000"
                value={price} onChange={e => setPrice(Number(e.target.value))} />
              <div className="rvb-val num">{money(price)}</div>
            </div>
          </div>

          <label htmlFor="rvb-rate">Mortgage interest rate</label>
          <input id="rvb-rate" type="range" className="slider" min="2" max="10" step="0.25"
            value={rate} onChange={e => setRate(Number(e.target.value))} />
          <div className="rvb-val num">{rate.toFixed(2)}<span> %</span></div>

          <div className="rvb-verdict">
            {cross
              ? <>Buying pulls ahead in <strong>year {cross.year}</strong>. Before that, renting leaves you with more.</>
              : <>Renting stays ahead for the whole 15 years at these numbers.</>}
          </div>

          <div className="rvb-facts num">
            <span>Cash needed to buy: <b>{money(upfront)}</b></span>
            <span>Owning: <b>{money(ownCost)}</b>/mo</span>
            <span>{gap >= 0 ? 'Costs' : 'Saves'} <b>{money(Math.abs(gap))}</b>/mo vs renting</span>
          </div>

          <svg className="rvb-chart" viewBox={`0 0 ${W} ${H}`} role="img"
            aria-label={cross
              ? `Buying pulls ahead of renting in year ${cross.year}.`
              : 'Renting stays ahead for the whole fifteen years at these numbers.'}>
            {[0, 0.5, 1].map(f => (
              <g key={f}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(maxY * f)} y2={y(maxY * f)} stroke="#e4e4e4" />
                <text x={PAD.l - 8} y={y(maxY * f) + 4} textAnchor="end" className="rvb-axis">
                  {shortMoney(maxY * f)}
                </text>
              </g>
            ))}
            {[1, 5, 10, 15].map(yr => (
              <text key={yr} x={x(yr)} y={H - 8} textAnchor="middle" className="rvb-axis">yr {yr}</text>
            ))}
            <path d={line('renter')} fill="none" stroke="#8a8a8a" strokeWidth="2" strokeDasharray="5 4" />
            <path d={line('owner')} fill="none" stroke="#111111" strokeWidth="2.5" />
            {cross && (
              <g>
                <line x1={x(cross.year)} x2={x(cross.year)} y1={PAD.t} y2={H - PAD.b}
                  stroke="#1f7a3d" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={x(cross.year)} cy={y(cross.owner)} r="4" fill="#1f7a3d" />
              </g>
            )}
          </svg>

          <div className="rvb-key">
            <span><i className="rvb-swatch rvb-own" /> Owning: equity after selling costs</span>
            <span><i className="rvb-swatch rvb-rent" /> Renting: the deposit plus monthly savings, invested</span>
          </div>

          <p className="hint rvb-note">
            Both paths start with the same money. The renter invests the deposit and closing
            costs instead of spending them, plus whatever they save each month while owning
            costs more. The owner builds equity but pays selling costs at the end. Fixed
            assumptions: {ASSUMPTIONS.downPct}% down, 30 year loan,{' '}
            {ASSUMPTIONS.taxMaintPct}%/yr tax insurance and upkeep, {ASSUMPTIONS.rentGrowth}%
            rent rises, {ASSUMPTIONS.appreciation}% home growth,{' '}
            {ASSUMPTIONS.savingsReturn}% on savings, {ASSUMPTIONS.sellPct}% to sell. Estimates
            for planning, not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
