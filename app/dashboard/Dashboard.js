'use client';

import { useEffect, useRef } from 'react';

// Inline the entire dashboard script so it runs on mount
const DASHBOARD_SCRIPT = `
(function() {
const PRESETS = {
    single:{expRent:1200,expUtilities:150,expGroceries:400,expGas:200,expInsurance:150,expSubs:50,expPhone:70,expOther:150},
    married:{expRent:1600,expUtilities:200,expGroceries:700,expGas:300,expInsurance:300,expSubs:70,expPhone:100,expOther:200}
};
const STATE_RATES = {
 AL:{name:"Alabama",rate:4.5},AK:{name:"Alaska",rate:0},AZ:{name:"Arizona",rate:2.5},AR:{name:"Arkansas",rate:4.5},
 CA:{name:"California",rate:6.0},CO:{name:"Colorado",rate:4.4},CT:{name:"Connecticut",rate:5.0},DE:{name:"Delaware",rate:4.5},
 DC:{name:"Washington DC",rate:7.0},FL:{name:"Florida",rate:0},GA:{name:"Georgia",rate:5.4},HI:{name:"Hawaii",rate:6.5},
 ID:{name:"Idaho",rate:5.8},IL:{name:"Illinois",rate:4.95},IN:{name:"Indiana",rate:3.05},IA:{name:"Iowa",rate:4.0},
 KS:{name:"Kansas",rate:5.0},KY:{name:"Kentucky",rate:4.0},LA:{name:"Louisiana",rate:3.5},ME:{name:"Maine",rate:6.0},
 MD:{name:"Maryland",rate:4.75},MA:{name:"Massachusetts",rate:5.0},MI:{name:"Michigan",rate:4.25},MN:{name:"Minnesota",rate:6.0},
 MS:{name:"Mississippi",rate:4.7},MO:{name:"Missouri",rate:4.0},MT:{name:"Montana",rate:5.5},NE:{name:"Nebraska",rate:5.0},
 NV:{name:"Nevada",rate:0},NH:{name:"New Hampshire",rate:0},NJ:{name:"New Jersey",rate:4.0},NM:{name:"New Mexico",rate:4.0},
 NY:{name:"New York",rate:5.5},NC:{name:"North Carolina",rate:4.5},ND:{name:"North Dakota",rate:1.5},OH:{name:"Ohio",rate:2.5},
 OK:{name:"Oklahoma",rate:4.0},OR:{name:"Oregon",rate:8.0},PA:{name:"Pennsylvania",rate:3.07},RI:{name:"Rhode Island",rate:4.5},
 SC:{name:"South Carolina",rate:5.0},SD:{name:"South Dakota",rate:0},TN:{name:"Tennessee",rate:0},TX:{name:"Texas",rate:0},
 UT:{name:"Utah",rate:4.65},VT:{name:"Vermont",rate:6.0},VA:{name:"Virginia",rate:5.0},WA:{name:"Washington",rate:0},
 WV:{name:"West Virginia",rate:4.5},WI:{name:"Wisconsin",rate:5.5},WY:{name:"Wyoming",rate:0}
};

const MONEY_IDS = ["yearlyIncomeSingle","yearlyIncomePerson1","yearlyIncomePerson2","yearlyIncomeJoint","grossSingle","grossPerson1","grossPerson2","grossJoint","monthlyIncomeOverride","monthlySave","existingSavings","expRent","expUtilities","expGroceries","expGas","expInsurance","expSubs","expPhone","expOther","lumpBalance","lumpPayment","debtExtra","mortExtra","homePrice"];
const FLAT_FIELD_IDS = ["householdType","calcFromGross","stateSelect","yearlyIncomeSingle","yearlyIncomePerson1","yearlyIncomePerson2","yearlyIncomeJoint","grossSingle","grossPerson1","grossPerson2","jointIncomeMode","grossJoint","monthlyIncomeOverride","monthlySave","saveYears","hysaRate","existingSavings","existingInHysa","expensePreset","expRent","expUtilities","expGroceries","expGas","expInsurance","expSubs","expPhone","expOther","perDebtMode","lumpBalance","lumpRate","lumpPayment","debtExtra","mortExtra","homePrice","useSavingsToggle","downPayment","downPaymentMode","mortgageRate","closingCostPercent","taxMaintPercent","includeTaxMaint","showPmi","currentRent","rentIncrease","debtFreeFirst","startDate","customTargets","targetDownPct","targetPaymentPct","affordModeSelect"];

// Every collapsible section, in page order. Cards that share a row with a sibling are
// NOT in here on purpose: their stage owns the collapse. A collapsed card sitting beside
// an expanded one would stretch to the row height and render as a tall empty box, and a
// second collapse level next to the stage's earns nothing. Only stages and full-width
// cards that own their row collapse.
const COLLAPSIBLE_IDS = ["stageMoney","stageObligations","stageHouse","mortgageResultsCard","customPayoffCard","overviewCard"];

const DEFAULT_STATE = "PA";
const THRESHOLD = 28;
const MAX_SEARCH_YEARS = 40;
const MIN_PAYMENT_PCT = 0.025;
const PMI_ANNUAL_PCT = 0.6;

let debtStrategy="even";
let debtRows=[];
let goalRows=[];
let rowCounter=0;
let lumpPaymentEdited=false;
let lastSaveCap=0;
let lastLeftover=0;

function money(n){ return "$"+Math.round(n).toLocaleString("en-US"); }
function getStartDate(){
    let v=document.getElementById("startDate").value;
    if(v){ let d=new Date(v+"T00:00:00"); if(!isNaN(d)) return d; }
    return new Date();
}
function addMonths(date, months){ let d=new Date(date.getTime()); d.setMonth(d.getMonth()+Math.round(months)); return d; }
function fmtDate(d){ return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }
function dateFromMonths(months){
    if(months===null||months===undefined) return "—";
    let end=addMonths(getStartDate(),months);
    return \`\${fmtDate(end)} · \${fmtMonths(months)} from now\`;
}
function parseMoney(s){ let v=String(s).replace(/[^0-9.\\-]/g,""); let n=Number(v); return isFinite(n)?n:0; }
function numVal(id){ let el=document.getElementById(id); return el?parseMoney(el.value):0; }
function formatMoneyField(el){
    let raw=String(el.value).replace(/[^0-9.]/g,""); let parts=raw.split(".");
    let intPart=parts[0].replace(/^0+(?=\\d)/,""); let dec=parts.length>1?"."+parts.slice(1).join("").slice(0,2):"";
    if(intPart===""&&dec===""){ el.value=""; return; } if(intPart==="") intPart="0";
    el.value="$"+Number(intPart).toLocaleString("en-US")+dec;
}
function setMoney(id,v){ let el=document.getElementById(id); if(el) el.value="$"+Math.round(v).toLocaleString("en-US"); }

// Idempotent on purpose: React Strict Mode runs this init twice in dev, and appending
// without clearing produced a duplicated 102-entry state list.
function populateStateSelect(){
    let sel=document.getElementById("stateSelect");
    if(!sel) return;
    let prev=sel.value;
    sel.innerHTML="";
    Object.keys(STATE_RATES).sort((a,b)=>STATE_RATES[a].name.localeCompare(STATE_RATES[b].name)).forEach(c=>{
        let o=document.createElement("option"); o.value=c; o.textContent=STATE_RATES[c].name; sel.appendChild(o);
    });
    sel.value = STATE_RATES[prev] ? prev : DEFAULT_STATE;
}

// A select whose value isn't one of its options renders blank, which silently drops the
// state tax to 0%. Called after any restore to make sure that can't stick.
function ensureValidState(){
    let sel=document.getElementById("stateSelect");
    if(sel && !STATE_RATES[sel.value]) sel.value=DEFAULT_STATE;
}

function applyPreset(){ let p=document.getElementById("expensePreset").value; if(p==="custom"){ ["expRent","expUtilities","expGroceries","expGas","expInsurance","expSubs","expPhone","expOther"].forEach(k=>{let el=document.getElementById(k); if(el) el.value="";}); calculateAll(); return; } let v=PRESETS[p]; for(let k in v) setMoney(k,v[k]); calculateAll(); }

function toggleCollapse(id){ document.getElementById(id).classList.toggle("collapsed"); saveToLocalStorage(); }

function toggleAllSections(expand){
    COLLAPSIBLE_IDS.forEach(id=>{ let el=document.getElementById(id); if(el) el.classList.toggle("collapsed", !expand); });
    saveToLocalStorage();
}

function toggleDownPayment(){
    let u=document.getElementById("useSavingsToggle").checked;
    let d=document.getElementById("downPayment"),m=document.getElementById("downPaymentMode");
    d.readOnly=u; d.classList.toggle("locked",u); m.disabled=u; m.style.opacity=u?0.5:1;
    updateDownPlaceholder();
    calculateAll();
}

function onDownModeChange(){
    let d=document.getElementById("downPayment");
    if(!document.getElementById("useSavingsToggle").checked) d.value="";
    updateDownPlaceholder();
    calculateAll();
}

function toggleCustomTargets(){
    let on=document.getElementById("customTargets").checked;
    document.getElementById("customTargetsBlock").style.display=on?"block":"none";
    calculateAll();
}

function onAffordModeChange(){
    let mode=document.getElementById("affordModeSelect").value;
    document.getElementById("maxAffordBlock").style.display = mode==="max" ? "block" : "none";
    document.getElementById("customPriceBlock").style.display = mode==="custom" ? "block" : "none";
    calculateAll();
}

function getTargetDownPct(){
    if(document.getElementById("customTargets").checked){ let v=numVal("targetDownPct"); return v>0?v:20; }
    return 20;
}

function getTargetPaymentPct(){
    if(document.getElementById("customTargets").checked){ let v=numVal("targetPaymentPct"); return v>0?v:28; }
    return 28;
}

function updateDownPlaceholder(){
    let mode=document.getElementById("downPaymentMode").value;
    let d=document.getElementById("downPayment");
    d.placeholder = mode==="percent" ? "e.g. 20" : "$0";
}

function toggleDebtMode(){
    let per=document.getElementById("perDebtMode").checked;
    document.getElementById("debtLumpBlock").style.display=per?"none":"block";
    document.getElementById("debtListBlock").style.display=per?"block":"none";
    document.getElementById("strategyBlock").style.display=per?"block":"none";
    if(per){
        if(debtRows.length===0) addDebtRow();
    } else {
        readDebtRows();
        let active=debtRows.filter(d=>d.balance>0);
        if(active.length>0){
            let totalBal=active.reduce((s,d)=>s+d.balance,0);
            let totalMin=active.reduce((s,d)=>s+(d.minPayment>0?d.minPayment:estimateMinPayment(d.balance)),0);
            let wAvgRate=active.reduce((s,d)=>s+d.rate*d.balance,0)/totalBal;
            setMoney("lumpBalance",totalBal);
            document.getElementById("lumpRate").value=wAvgRate.toFixed(2);
            setMoney("lumpPayment",totalMin);
            lumpPaymentEdited=true;
        }
    }
    calculateAll();
}

function updateHouseholdVisibility(){
    let t=document.getElementById("householdType").value, g=document.getElementById("calcFromGross").checked;
    let joint=document.getElementById("jointIncomeMode").checked;
    document.getElementById("jointIncomeToggleBlock").style.display=(t==="couple")?"block":"none";
    document.getElementById("singleManualBlock").style.display=(!g&&t!=="couple")?"block":"none";
    document.getElementById("coupleManualBlock").style.display=(!g&&t==="couple")?"block":"none";
    document.getElementById("coupleSplitBlock").style.display=(!g&&t==="couple"&&!joint)?"block":"none";
    document.getElementById("coupleJointBlock").style.display=(!g&&t==="couple"&&joint)?"block":"none";
    document.getElementById("grossIncomeBlock").style.display=g?"block":"none";
    document.getElementById("grossSingleBlock").style.display=(g&&t!=="couple")?"block":"none";
    document.getElementById("grossCoupleBlock").style.display=(g&&t==="couple")?"block":"none";
    document.getElementById("grossSplitBlock").style.display=(g&&t==="couple"&&!joint)?"block":"none";
    document.getElementById("grossJointBlock").style.display=(g&&t==="couple"&&joint)?"block":"none";
}

function onJointIncomeModeChange(){ updateHouseholdVisibility(); calculateAll(); }

function onHouseholdTypeChange(){ updateHouseholdVisibility(); let t=document.getElementById("householdType").value; document.getElementById("expensePreset").value=t==="couple"?"married":"single"; applyPreset(); }
function onIncomeModeChange(){ updateHouseholdVisibility(); calculateAll(); }

function setDebtStrategy(s){
    debtStrategy=s;
    document.getElementById("pillEven").classList.toggle("active",s==="even");
    document.getElementById("pillHighInterest").classList.toggle("active",s==="interest");
    document.getElementById("pillSmallBalance").classList.toggle("active",s==="balance");
    calculateAll();
}

function onSlider(inputId, sliderId){
    let slider=document.getElementById(sliderId), input=document.getElementById(inputId);
    setMoney(inputId, Number(slider.value));
    input.classList.remove("over");
    calculateAll();
}

// Tax functions (from original)
function calcFederalTax(t,f){
    let b=f==="married"?[[0,23200,0.10],[23200,94300,0.12],[94300,201050,0.22],[201050,383900,0.24],[383900,487450,0.32],[487450,731200,0.35],[731200,Infinity,0.37]]:[[0,11600,0.10],[11600,47150,0.12],[47150,100525,0.22],[100525,191950,0.24],[191950,243725,0.32],[243725,609350,0.35],[609350,Infinity,0.37]];
    let x=0; for(let br of b){ if(t>br[0]) x+=(Math.min(t,br[1])-br[0])*br[2]; } return x;
}
function calcNetIncome(g,f,sp){ let sd=f==="married"?29200:14600; let tax=Math.max(0,g-sd); let fed=calcFederalTax(tax,f),fica=g*0.0765,st=g*(sp/100); return {net:Math.max(0,g-fed-fica-st),fedTax:fed,fica,stateTax:st,gross:g}; }
function computeGrossBreakdown(){
    let c=document.getElementById("stateSelect").value; let p=STATE_RATES[c]?STATE_RATES[c].rate:0;
    let hh=document.getElementById("householdType").value;
    if(hh==="couple"){
        let joint=document.getElementById("jointIncomeMode").checked;
        let combined = joint ? numVal("grossJoint") : numVal("grossPerson1")+numVal("grossPerson2");
        return calcNetIncome(combined,"married",p);
    }
    return calcNetIncome(numVal("grossSingle"),"single",p);
}
function getYearlyIncome(){
    if(document.getElementById("calcFromGross").checked) return computeGrossBreakdown().net;
    if(document.getElementById("householdType").value==="couple"){
        let joint=document.getElementById("jointIncomeMode").checked;
        return joint ? numVal("yearlyIncomeJoint") : numVal("yearlyIncomePerson1")+numVal("yearlyIncomePerson2");
    }
    return numVal("yearlyIncomeSingle");
}
function getMonthlyTakeHome(){ let o=numVal("monthlyIncomeOverride"); return o>0?o:getYearlyIncome()/12; }

// Savings
function baseSavingsAtYear(years){
    let monthly=numVal("monthlySave"),rate=numVal("hysaRate")/100,existing=numVal("existingSavings");
    let inHysa=document.getElementById("existingInHysa").checked;
    let bal=inHysa?existing:0,months=Math.round(years*12);
    for(let i=0;i<months;i++){ bal=(bal+monthly)*(1+rate/12); }
    if(!inHysa) bal+=existing;
    return bal;
}
function calcTotalExpenses(){ return ["expRent","expUtilities","expGroceries","expGas","expInsurance","expSubs","expPhone","expOther"].reduce((s,id)=>s+numVal(id),0); }

// Debt
function estimateMinPayment(balance){ return balance>0 ? Math.max(25, balance*MIN_PAYMENT_PCT) : 0; }

function getDebtSet(){
    if(document.getElementById("perDebtMode").checked){
        readDebtRows();
        return debtRows.filter(d=>d.balance>0).map(d=>({name:d.name||"Debt",balance:d.balance,rate:d.rate,minPayment:d.minPayment>0?d.minPayment:estimateMinPayment(d.balance)}));
    }
    let bal=numVal("lumpBalance");
    if(bal<=0) return [];
    let rate=numVal("lumpRate");
    let pay=lumpPaymentEdited?numVal("lumpPayment"):estimateMinPayment(bal);
    return [{name:"Total Debt",balance:bal,rate:rate,minPayment:pay}];
}

// Core simulation: same payoff math as before, plus tracks the month each individual
// debt's balance first reaches zero, so payoff order/timing is visible per-debt.
function simulateDebtPayoffDetailed(rows, extra, strategy){
    let debts=rows.filter(d=>d.balance>0).map(d=>({...d, payoffMonth:null}));
    if(debts.length===0) return {months:0,empty:true,interest:0,perDebt:[]};
    let months=0,totalInterest=0;
    while(debts.some(d=>d.balance>0)&&months<1200){
        let pool=extra;
        for(let d of debts){ if(d.balance>0){ let i=d.balance*(d.rate/100/12); d.balance+=i; totalInterest+=i; } }
        for(let d of debts){ if(d.balance>0){ let pay=Math.min(d.minPayment,d.balance); d.balance-=pay; } }
        let active=debts.filter(d=>d.balance>0);
        if(strategy==="even"){
            let share=active.length>0?pool/active.length:0;
            for(let d of active){ let pay=Math.min(share,d.balance); d.balance-=pay; pool-=pay; }
            for(let d of active){ if(pool<=0) break; if(d.balance>0){ let pay=Math.min(pool,d.balance); d.balance-=pay; pool-=pay; } }
        } else {
            active.sort((a,b)=> strategy==="interest"?b.rate-a.rate:a.balance-b.balance);
            for(let d of active){ if(pool<=0) break; let pay=Math.min(pool,d.balance); d.balance-=pay; pool-=pay; }
        }
        months++;
        for(let d of debts){ if(d.balance<=0.005 && d.payoffMonth===null){ d.payoffMonth=months; } }
        if(pool<=0&&extra===0){ let stuck=debts.some(d=>d.balance>0&&d.minPayment<=d.balance*(d.rate/100/12)); if(stuck&&months>2) return {months:null,stuck:true,perDebt:[]}; }
    }
    if(months>=1200) return {months:null,stuck:true,perDebt:[]};
    let perDebt=debts.map(d=>({name:d.name||"Debt",payoffMonth:d.payoffMonth})).sort((a,b)=>a.payoffMonth-b.payoffMonth);
    return {months,empty:false,interest:Math.round(totalInterest),perDebt};
}


function totalMinPayments(set){ return set.reduce((s,d)=>s+d.minPayment,0); }

// Goals
function readGoalRows(){ goalRows.forEach(r=>{ r.amount=parseMoney(document.getElementById(r.id+"_amt").value); r.years=parseMoney(document.getElementById(r.id+"_yrs").value)||1; r.rate=parseMoney(document.getElementById(r.id+"_rate").value); r.name=document.getElementById(r.id+"_name").value; }); }
function goalMonthly(g){ let m=g.years*12,mr=g.rate/100/12; if(m<=0) return 0; return mr>0?g.amount*mr/(Math.pow(1+mr,m)-1):g.amount/m; }
function totalGoalMonthly(){ return goalRows.reduce((s,g)=>s+goalMonthly(g),0); }

// Mortgage
function calcMonthlyPayment(loan,rate,years){ if(loan<=0) return 0; let m=years*12,mr=rate/100/12; return mr>0?loan*(mr*Math.pow(1+mr,m))/(Math.pow(1+mr,m)-1):loan/m; }
function monthlyPMI(price, down){
    if(price<=0) return 0;
    let ltv=(price-down)/price;
    if(ltv<=0.80) return 0;
    let loan=price-down;
    return loan*(PMI_ANNUAL_PCT/100)/12;
}
function monthsToDropPMI(price, down, rate, termYears){
    if(price<=0) return null;
    if((price-down)/price<=0.80) return 0;
    let loan=price-down, mr=rate/100/12, pay=calcMonthlyPayment(loan,rate,termYears);
    let target=price*0.80;
    let bal=loan, months=0;
    while(bal>target && months<termYears*12){ bal+=bal*mr; bal-=pay; months++; }
    return months;
}
function payoffMonthsWithExtra(loan,rate,termYears,extra){
    if(loan<=0) return 0;
    let basePayment=calcMonthlyPayment(loan,rate,termYears);
    let mr=rate/100/12, bal=loan, months=0, pay=basePayment+extra;
    while(bal>0.5 && months<termYears*12+1){
        bal+=bal*mr; bal-=pay; months++;
        if(pay<=loan*mr && months>2) return null;
    }
    return months;
}
function fmtMonths(m){ if(m===null) return "—"; let y=Math.floor(m/12),r=m%12; return (y>0?y+"y ":"")+r+"m"; }
function monthlyTaxMaint(price){ return price*(numVal("taxMaintPercent")/100)/12; }
function affordabilityPayment(price,down,rate,term,inc){ let loan=Math.max(0,price-down),p=calcMonthlyPayment(loan,rate,term); if(inc) p+=monthlyTaxMaint(price); return p; }
function getFlag(pct){ if(pct<=28) return {c:"flag-ok",t:"Within the 28% guideline"}; if(pct<=36) return {c:"flag-warn",t:"Above 28%, under 36%, watch it"}; return {c:"flag-bad",t:"Above 36%, stretched"}; }
function getDownPayment(price,saved){
    let useSavings=document.getElementById("useSavingsToggle").checked;
    let mode=document.getElementById("downPaymentMode").value;
    let down;
    if(useSavings){
        down=saved;
        setMoney("downPayment",saved);
    } else if(mode==="percent"){
        down=price*numVal("downPayment")/100;
    } else {
        down=numVal("downPayment");
    }
    return down;
}

function updateDownReadout(price,down,saved,closing){
    let el=document.getElementById("downReadout");
    if(price<=0){ el.textContent="Enter a home price to see the numbers."; return; }
    let pct=price>0?(down/price)*100:0;
    let cashNeeded=down+closing;
    let useSavings=document.getElementById("useSavingsToggle").checked;
    let lines=[];
    lines.push(\`Down payment: <b>\${money(down)}</b>, that's <b>\${pct.toFixed(1)}%</b> of the \${money(price)} home price.\`);
    lines.push(\`Cash needed at closing (down payment + \${money(closing)} closing costs): <b>\${money(cashNeeded)}</b>.\`);
    if(!useSavings){
        let gap=saved-cashNeeded;
        if(gap>=0) lines.push(\`<span style="color:var(--ok);">Your projected savings of \${money(saved)} cover this, with \${money(gap)} to spare.</span>\`);
        else lines.push(\`<span style="color:var(--bad);">You'd have \${money(saved)} saved, short by \${money(-gap)}.</span>\`);
    } else {
        lines.push(\`This is auto-filled from your projected savings of \${money(saved)}.\`);
    }
    el.innerHTML=lines.join("<br>");
}

function buildPlanHTML(label,price,down,rate,years,checkIncome,closing,inc){
    let loan=Math.max(0,price-down);
    let pi=calcMonthlyPayment(loan,rate,years),interest=pi*years*12-loan;
    let escrow=monthlyTaxMaint(price);
    let pmi=monthlyPMI(price,down);
    let totalPayment=pi+escrow+pmi;
    // the checkbox controls whether escrow+PMI count toward the affordability guideline,
    // not whether they're shown - the dollar breakdown below is always complete
    let checkAmount=inc?totalPayment:pi;
    let pct=checkIncome>0?(checkAmount/checkIncome)*100:0,f=getFlag(pct);
    let taxMaintPct=numVal("taxMaintPercent");
    let downPct=price>0?(down/price)*100:0;
    let escrowTitle=\`Escrow: property tax + homeowners insurance + a maintenance reserve, collected monthly and set aside for these costs. Estimated as Home Price x \${taxMaintPct}%/yr div 12: \${money(price)} x \${taxMaintPct}% / 12 = \${money(escrow)}/mo.\`;
    let pmiTitle="PMI (Private Mortgage Insurance) protects the lender, not you. It only applies when your down payment is under 20% of the home price, and drops off automatically once you reach 20% equity. Estimated here as 0.6%/yr of your loan balance.";
    let pmiLine = pmi>0
        ? \`<div class="summary-line"><span>PMI <span class="info" title="\${pmiTitle}">i</span></span><span>\${money(pmi)}</span></div>\`
        : (price>0 ? \`<div class="summary-line"><span>PMI</span><span class="flag-ok">None (\${downPct.toFixed(0)}%+ down)</span></div>\` : "");
    return \`<div class="plan"><h3>\${label}</h3><div class="big">\${money(totalPayment)}/mo</div>
        <div class="summary-line"><span>Principal & Interest</span><span>\${money(pi)}</span></div>
        <div class="summary-line"><span>Escrow (Tax/Ins/Maint) <span class="info" title="\${escrowTitle}">i</span></span><span>\${money(escrow)}</span></div>
        \${pmiLine}
        <div class="summary-line"><span>Loan Amount</span><span>\${money(loan)}</span></div>
        <div class="summary-line"><span>Total Interest (P&I only)</span><span>\${money(interest)}</span></div>
        <div class="summary-line"><span>Cash at Closing</span><span>\${money(down+closing)}</span></div>
        <div class="summary-line"><span>% of Take-Home</span><span class="\${f.c}">\${pct.toFixed(1)}%</span></div>
        <div style="margin-top:10px;text-align:center;" class="\${f.c}">\${f.t}\${inc?" · incl. escrow"+(pmi>0?"+PMI":""):" · P&I only"}</div></div>\`;
}

function buildMaxAffordColumn(label, term, downAmount, rate, monthlyCeiling, closingPct){
    if(monthlyCeiling<=0) return \`<div class="plan"><h3>\${label}</h3><div class="big flag-bad">—</div><div style="text-align:center;font-size:13px;color:#ff8f88;">Enter your take-home pay above to see what you can afford.</div></div>\`;
    let maxPrice=maxAffordablePrice(downAmount,rate,term,monthlyCeiling);
    let loan=Math.max(0,maxPrice-downAmount);
    let pi=calcMonthlyPayment(loan,rate,term);
    let escrow=monthlyTaxMaint(maxPrice);
    let pmi=monthlyPMI(maxPrice,downAmount);
    let totalPayment=pi+escrow+pmi;
    let closing=maxPrice*closingPct/100;
    let downPct=maxPrice>0?(downAmount/maxPrice)*100:0;
    let pmiLine = pmi>0
        ? \`<div class="summary-line"><span>PMI</span><span>\${money(pmi)}</span></div>\`
        : \`<div class="summary-line"><span>PMI</span><span class="flag-ok">None (\${downPct.toFixed(0)}%+ down)</span></div>\`;
    return \`<div class="plan"><h3>\${label}</h3><div class="big">\${money(maxPrice)}</div>
        <div class="summary-line"><span>Total Payment</span><span>\${money(totalPayment)}/mo</span></div>
        <div class="summary-line"><span>Principal & Interest</span><span>\${money(pi)}</span></div>
        <div class="summary-line"><span>Escrow (Tax/Ins/Maint)</span><span>\${money(escrow)}</span></div>
        \${pmiLine}
        <div class="summary-line"><span>Down Payment</span><span>\${money(downAmount)} (\${downPct.toFixed(1)}%)</span></div>
        <div class="summary-line"><span>Est. Closing Costs</span><span>\${money(closing)}</span></div>
        <div style="margin-top:10px;text-align:center;" class="flag-ok">Max price at your \${getTargetPaymentPct()}% payment target</div></div>\`;
}

// Solve for the highest home price affordable given a fixed down payment and a monthly
// payment ceiling. Binary search: raising price grows the loan (more P&I) AND grows
// escrow AND shrinks down% (more/bigger PMI) - all three push payment up, so payment(price)
// is monotonic and a plain binary search converges.
function maxAffordablePrice(downAmount, rate, term, monthlyCeiling){
    if(monthlyCeiling<=0) return 0;
    let lo=Math.max(0,downAmount), hi=Math.max(downAmount*10, 2000000);
    for(let i=0;i<60;i++){
        let mid=(lo+hi)/2;
        let loan=Math.max(0,mid-downAmount);
        let payment=calcMonthlyPayment(loan,rate,term)+monthlyTaxMaint(mid)+monthlyPMI(mid,downAmount);
        if(payment<=monthlyCeiling) lo=mid; else hi=mid;
    }
    return lo;
}

// Inverse of maxAffordablePrice: for a FIXED price, solve for the minimum down payment
// that brings the payment under the ceiling. Raising down shrinks the loan and shrinks/
// removes PMI, so payment(down) is monotonic the other way - down search still converges.
function requiredDownForPayment(price, rate, term, monthlyCeiling){
    if(price<=0) return 0;
    let lo=0, hi=price;
    for(let i=0;i<60;i++){
        let mid=(lo+hi)/2;
        let loan=Math.max(0,price-mid);
        let payment=calcMonthlyPayment(loan,rate,term)+monthlyTaxMaint(price)+monthlyPMI(price,mid);
        if(payment<=monthlyCeiling) hi=mid; else lo=mid;
    }
    return hi;
}

// Inverts baseSavingsAtYear()'s exact compounding order to solve for the monthly
// contribution needed to reach targetAmount by "years", given the current
// hysaRate/existingSavings/existingInHysa state. Mirrors that function's math exactly so
// plugging the result back into monthlySave reproduces targetAmount.
function requiredMonthlySavingsForTarget(targetAmount, years){
    let rate=numVal("hysaRate")/100, mr=rate/12, existing=numVal("existingSavings");
    let inHysa=document.getElementById("existingInHysa").checked;
    let months=Math.round(years*12);
    if(months<=0) return Math.max(0, targetAmount-existing);
    let fvExisting=(inHysa?existing:0)*Math.pow(1+mr,months);
    let remainder=targetAmount-fvExisting-(inHysa?0:existing);
    if(remainder<=0) return 0;
    let annuityFactor = mr>0 ? (1+mr)*((Math.pow(1+mr,months)-1)/mr) : months;
    return remainder/annuityFactor;
}

function rentPaidOverYears(years){ let rent=numVal("currentRent"),inc=numVal("rentIncrease")/100,t=0,y=rent*12; for(let i=0;i<years;i++){ t+=y; y*=(1+inc); } return t; }

function savingsWithDebtPlan(years, debtFreeYears, freedMonthly){
    let monthly=numVal("monthlySave"),rate=numVal("hysaRate")/100,existing=numVal("existingSavings");
    let inHysa=document.getElementById("existingInHysa").checked;
    let bal=inHysa?existing:0, months=Math.round(years*12), debtFreeMonth=Math.round(debtFreeYears*12);
    for(let i=0;i<months;i++){
        let contrib=monthly;
        if(i>=debtFreeMonth) contrib+=freedMonthly;
        bal=(bal+contrib)*(1+rate/12);
    }
    if(!inHysa) bal+=existing;
    return bal;
}

function findOptimalYear(price,rate,term,takeHome,inc,opts){
    let targetDownPct=opts.targetDownPct||20;
    let targetPct=opts.targetPaymentPct||THRESHOLD;
    let requiredDown=price*targetDownPct/100;
    for(let y=0;y<=MAX_SEARCH_YEARS;y++){
        let down;
        if(opts.carryDebt){
            down=baseSavingsAtYear(y);
        } else {
            if(y < opts.debtFreeYears) continue;
            down=savingsWithDebtPlan(y, opts.debtFreeYears, opts.freedMonthly);
        }
        if(down>=price) return {year:y,down,paidOff:true};
        if(down < requiredDown) continue;
        let payment=affordabilityPayment(price,down,rate,term,inc);
        let pmi=monthlyPMI(price,down);
        payment+=pmi;
        let effective=payment + (opts.carryDebt?opts.debtMonthlyDuringWait:0);
        let pct=takeHome>0?(effective/takeHome)*100:Infinity;
        if(pct<=targetPct) return {year:y,down,payment,percent:pct,paidOff:false,effective,pmi};
    }
    return null;
}

function findOptimalYearWithSave(price,rate,term,takeHome,inc,opts,overrideMonthlySave){
    let targetDownPct=opts.targetDownPct||20;
    let targetPct=opts.targetPaymentPct||THRESHOLD;
    let requiredDown=price*targetDownPct/100;
    let hysaRate=numVal("hysaRate")/100, existing=numVal("existingSavings");
    let inHysa=document.getElementById("existingInHysa").checked;
    function balAt(years){
        let bal=inHysa?existing:0, months=Math.round(years*12), dfm=Math.round((opts.debtFreeYears||0)*12);
        for(let i=0;i<months;i++){ let c=overrideMonthlySave; if(!opts.carryDebt && i>=dfm) c+=(opts.freedMonthly||0); bal=(bal+c)*(1+hysaRate/12); }
        if(!inHysa) bal+=existing;
        return bal;
    }
    for(let y=0;y<=MAX_SEARCH_YEARS;y++){
        if(!opts.carryDebt && y<(opts.debtFreeYears||0)) continue;
        let down=balAt(y);
        if(down>=price) return {year:y,down,paidOff:true};
        if(down<requiredDown) continue;
        let payment=affordabilityPayment(price,down,rate,term,inc)+monthlyPMI(price,down);
        let effective=payment+(opts.carryDebt?opts.debtMonthlyDuringWait:0);
        let pct=takeHome>0?(effective/takeHome)*100:Infinity;
        if(pct<=targetPct) return {year:y,down,payment,percent:pct,paidOff:false};
    }
    return null;
}

function buildOptimalColumn(label,term,price,rate,takeHome,inc,opts){
    let r=findOptimalYear(price,rate,term,takeHome,inc,opts);
    let tgtPct=opts.targetPaymentPct||THRESHOLD;
    if(!r) return \`<div class="plan"><h3>\${label}</h3><div class="big flag-bad">—</div><div style="text-align:center;font-size:13px;color:#ff8f88;">Even after \${MAX_SEARCH_YEARS} years you can't reach the targets. Try a lower price, more savings, or a longer term.</div></div>\`;
    if(r.paidOff) return \`<div class="plan"><h3>\${label}</h3><div class="big flag-ok">Pay cash</div><div class="summary-line"><span>Savings reach price in</span><span>\${r.year} yr</span></div><div style="text-align:center;margin-top:8px;font-size:13px;" class="flag-ok">Enough to buy outright, no mortgage needed.</div></div>\`;
    let headline=r.year===0?"Buy now":\`Rent \${r.year} yr\${r.year>1?"s":""}\`;
    return \`<div class="plan"><h3>\${label}</h3><div class="big flag-ok">\${headline}</div>
        <div class="summary-line"><span>Buy around</span><span>\${r.year===0?"now":fmtDate(addMonths(getStartDate(),Math.round(r.year*12)))}</span></div>
        <div class="summary-line"><span>Down payment then</span><span>\${money(r.down)}</span></div>
        <div class="summary-line"><span>Mortgage payment</span><span>\${money(r.payment)}/mo</span></div>
        <div class="summary-line"><span>% of take-home</span><span class="flag-ok">\${r.percent.toFixed(1)}%</span></div>
        \${r.year>0?\`<div class="summary-line"><span>Rent paid while waiting</span><span>\${money(rentPaidOverYears(r.year))}</span></div>\`:""}</div>\`;
}

// Dynamic rows
function addDebtRow(data){
    let id="debt"+(rowCounter++); let d=data||{name:"",balance:0,rate:0,minPayment:0};
    debtRows.push({id,...d});
    let div=document.createElement("div"); div.className="list-row"; div.id=id;
    div.innerHTML=\`
        <div class="lf" style="flex:1.2"><input id="\${id}_name" type="text" placeholder="e.g. Visa"><div class="cap">Name</div></div>
        <div class="lf"><input id="\${id}_bal" class="rowmoney" type="text" placeholder="$0" value="\${d.balance?money(d.balance):''}"><div class="cap">Balance</div></div>
        <div class="lf" style="flex:0.7"><input id="\${id}_rate" type="number" placeholder="0" value="\${d.rate||''}"><div class="cap">Rate %</div></div>
        <div class="lf"><input id="\${id}_min" class="rowmoney" type="text" placeholder="~$0" value="\${d.minPayment?money(d.minPayment):''}"><div class="cap">Min Payment</div></div>
        <button class="remove-x" onclick="removeRow('debtRows','\${id}')">×</button>\`;
    document.getElementById("debtList").appendChild(div);
    div.querySelectorAll(".rowmoney").forEach(el=>el.addEventListener("input",()=>formatMoneyField(el)));
    div.querySelectorAll("input").forEach(i=>i.addEventListener("input",calculateAll));
    calculateAll();
}

function addGoalRow(data){
    let id="goal"+(rowCounter++); let g=data||{name:"",amount:0,years:5,rate:5};
    goalRows.push({id,...g});
    let div=document.createElement("div"); div.className="list-row"; div.id=id;
    div.innerHTML=\`
        <div class="lf" style="flex:1.2"><input id="\${id}_name" type="text" placeholder="e.g. Car"><div class="cap">Goal</div></div>
        <div class="lf"><input id="\${id}_amt" class="rowmoney" type="text" placeholder="$0" value="\${g.amount?money(g.amount):''}"><div class="cap">Target</div></div>
        <div class="lf" style="flex:0.6"><input id="\${id}_yrs" type="number" placeholder="5" value="\${g.years||''}"><div class="cap">Years</div></div>
        <div class="lf" style="flex:0.6"><input id="\${id}_rate" type="number" placeholder="5" value="\${g.rate||''}"><div class="cap">Return %</div></div>
        <button class="remove-x" onclick="removeRow('goalRows','\${id}')">×</button>\`;
    document.getElementById("goalList").appendChild(div);
    div.querySelectorAll(".rowmoney").forEach(el=>el.addEventListener("input",()=>formatMoneyField(el)));
    div.querySelectorAll("input").forEach(i=>i.addEventListener("input",calculateAll));
    calculateAll();
}

function readDebtRows(){ debtRows.forEach(r=>{ r.balance=parseMoney(document.getElementById(r.id+"_bal").value); r.rate=parseMoney(document.getElementById(r.id+"_rate").value); r.minPayment=parseMoney(document.getElementById(r.id+"_min").value); r.name=document.getElementById(r.id+"_name").value; }); }
function removeRow(listName,id){ let list=listName==="debtRows"?debtRows:goalRows; let i=list.findIndex(r=>r.id===id); if(i>=0) list.splice(i,1); let el=document.getElementById(id); if(el) el.remove(); calculateAll(); }

// Main calculation
function calculateAll(){
    let takeHome=getMonthlyTakeHome();
    let calcGross=document.getElementById("calcFromGross").checked;
    let hh=document.getElementById("householdType").value;

    document.getElementById("incomeTotalLine").textContent=(calcGross||hh==="couple")?"Combined take-home: "+money(getYearlyIncome())+"/yr":"";
    let taxEl=document.getElementById("taxBreakdown");
    if(calcGross){ let b=computeGrossBreakdown(); taxEl.textContent="Est. Federal "+money(b.fedTax)+" · FICA "+money(b.fica)+" · State "+money(b.stateTax); } else taxEl.textContent="";
    document.getElementById("monthlyIncomeResult").textContent=money(takeHome);

    let gnEl=document.getElementById("grossNetCompare");
    if(calcGross){
        let b=computeGrossBreakdown();
        let grossMonthly=b.gross/12;
        gnEl.innerHTML=\`before tax: \${money(grossMonthly)}/mo · after tax: \${money(takeHome)}/mo · tax takes \${money(grossMonthly-takeHome)}/mo\`;
    } else {
        gnEl.textContent="";
    }

    let expenses=calcTotalExpenses();
    document.getElementById("expenseResult").textContent=money(expenses);
    setMoney("currentRent", numVal("expRent"));
    let expPct=takeHome>0?(expenses/takeHome)*100:0;
    let expPctEl=document.getElementById("expensePctSub");
    expPctEl.textContent=\`\${expPct.toFixed(1)}% of take-home\`;
    expPctEl.className="rb-sub num "+(expPct>100?"flag-bad":"");
    let rentPctEl=document.getElementById("rentPct");
    let rentAmt=numVal("expRent");
    rentPctEl.textContent = (takeHome>0 && rentAmt>0) ? \`\${((rentAmt/takeHome)*100).toFixed(1)}% of take-home\` : "";

    let saveYears=numVal("saveYears")||0;
    let monthlySave=numVal("monthlySave");
    let savePct=takeHome>0?(monthlySave/takeHome)*100:0;
    document.getElementById("savePercentSub").textContent=\`\${money(monthlySave)}/mo · \${savePct.toFixed(1)}% of take-home\`;

    let lumpBal=numVal("lumpBalance");
    let lumpPayEl=document.getElementById("lumpPayment");
    let lumpHint=document.getElementById("lumpPayHint");
    if(!document.getElementById("perDebtMode").checked){
        if(!lumpPaymentEdited && lumpBal>0){
            let est=estimateMinPayment(lumpBal);
            lumpPayEl.value="~"+money(est);
            lumpPayEl.classList.add("estimated");
            lumpHint.textContent="(estimated, click to change)";
        } else if(!lumpPaymentEdited){
            lumpPayEl.value=""; lumpPayEl.classList.remove("estimated"); lumpHint.textContent="";
        } else {
            lumpPayEl.classList.remove("estimated"); lumpHint.textContent="";
        }
    }

    let debtSet=getDebtSet();
    let extra=numVal("debtExtra");
    let anyDebt=debtSet.length>0;
    let baseMin=totalMinPayments(debtSet);
    let debtMonthly = anyDebt ? baseMin+extra : 0;

    let dRes=document.getElementById("debtPayoffResult"),dLab=document.getElementById("debtPayoffLabel"),dNote=document.getElementById("debtExtraNote");
    let timelineEl=document.getElementById("debtTimeline");
    let cmpEl=document.getElementById("strategyCompare");
    let perDebtOn=document.getElementById("perDebtMode").checked;
    let debtFreeYears=0, freedMonthly=debtMonthly;
    if(!anyDebt){
        dRes.textContent="No debt entered"; dRes.className="rb-big"; dLab.textContent=""; dNote.textContent=""; debtFreeYears=0; freedMonthly=0;
        timelineEl.innerHTML=""; cmpEl.innerHTML="";
        ["pillEven","pillHighInterest","pillSmallBalance"].forEach(id=>document.getElementById(id).title="");
    } else {
        let sim=simulateDebtPayoffDetailed(debtSet, extra, debtStrategy);
        if(sim.stuck||sim.months===null){
            dRes.textContent="Payment too low"; dRes.className="rb-big flag-bad"; dLab.textContent="raise the payment or add extra"; dNote.textContent="";
            debtFreeYears=MAX_SEARCH_YEARS+1;
            timelineEl.innerHTML="";
        } else {
            let yrs=Math.floor(sim.months/12),rem=sim.months%12;
            dRes.textContent=(yrs>0?yrs+"y ":"")+rem+"m"; dRes.className="rb-big flag-ok"; dLab.textContent="until debt-free";
            let stratName={even:"Even · ",interest:"Avalanche · ",balance:"Snowball · "};
            let stratNote = perDebtOn ? (stratName[debtStrategy]||"") : "";
            dNote.textContent=\`\${stratNote}Paying \${money(debtMonthly)}/mo · \${money(sim.interest)} total interest\`;
            debtFreeYears=sim.months/12;

            if(perDebtOn && sim.perDebt.length>0){
                timelineEl.innerHTML="<b>Payoff order:</b><br>" + sim.perDebt.map(d=>\`\${d.name}: \${dateFromMonths(d.payoffMonth)}\`).join("<br>");
            } else {
                timelineEl.innerHTML="";
            }
        }

        // strategy comparison: only meaningful with 2+ debts to actually prioritize between
        if(perDebtOn && debtSet.length>=2){
            let names={even:"Even",interest:"Avalanche",balance:"Snowball"};
            let pillIds={even:"pillEven",interest:"pillHighInterest",balance:"pillSmallBalance"};
            let results={};
            ["even","interest","balance"].forEach(s=>{ results[s]=simulateDebtPayoffDetailed(debtSet, extra, s); });
            ["even","interest","balance"].forEach(s=>{
                let r=results[s], el=document.getElementById(pillIds[s]);
                el.title = (r.months===null||r.stuck)
                    ? \`\${names[s]}: payment too low to pay off.\`
                    : \`\${names[s]}: debt-free \${dateFromMonths(r.months)} · \${money(r.interest)} total interest\`;
            });
            let valid=["even","interest","balance"].filter(s=>results[s].months!==null && !results[s].stuck);
            if(valid.length===3){
                let fastest=valid.reduce((a,b)=>results[a].months<results[b].months?a:b);
                let cheapest=valid.reduce((a,b)=>results[a].interest<results[b].interest?a:b);
                cmpEl.innerHTML = ["even","interest","balance"].map(s=>{
                    let r=results[s];
                    let tags=[];
                    if(s===fastest) tags.push("fastest");
                    if(s===cheapest) tags.push("least interest");
                    let tag=tags.length?\` <span class="flag-ok">(\${tags.join(" & ")})</span>\`:"";
                    return \`<b>\${names[s]}</b>: \${fmtMonths(r.months)} · \${money(r.interest)} interest\${tag}\`;
                }).join("<br>");
            } else {
                cmpEl.innerHTML="";
            }
        } else {
            cmpEl.innerHTML="";
            ["pillEven","pillHighInterest","pillSmallBalance"].forEach(id=>document.getElementById(id).title="");
        }
    }

    // Down payment projection: once debt is paid off, that freed-up payment rolls into
    // house savings (same "debt-free-first" rollover the Custom Price mode's optimal
    // search already uses) - applied consistently here so Section 5's own number and
    // the Max-Afford price both reflect it too, not just the Custom mode search.
    let debtFreeFirst=document.getElementById("debtFreeFirst").checked;
    let projected = (anyDebt && debtFreeFirst)
        ? savingsWithDebtPlan(saveYears, debtFreeYears, freedMonthly)
        : baseSavingsAtYear(saveYears);
    document.getElementById("downPaymentLump").textContent=money(projected);
    document.getElementById("downPaymentLumpLabel").textContent=\`saved for down payment in \${saveYears} yr\${saveYears!=1?"s":""}\`;

    readGoalRows();
    let goalTotal=totalGoalMonthly();
    document.getElementById("goalTotalResult").textContent=money(goalTotal);

    let mortExtra=numVal("mortExtra");
    let leftover=takeHome-expenses-monthlySave-debtMonthly-goalTotal-mortExtra;
    lastLeftover=leftover;
    document.getElementById("incomeStat").textContent=money(takeHome);
    document.getElementById("expenseStat").textContent=money(expenses);
    document.getElementById("saveStat").textContent=money(monthlySave);
    document.getElementById("debtStat").textContent=money(debtMonthly);
    document.getElementById("goalStat").textContent=money(goalTotal);
    let lo=document.getElementById("leftoverStat"); lo.textContent=money(leftover); lo.className="big num "+(leftover<0?"flag-bad":"flag-ok");
    let pctOf=(x)=> takeHome>0 ? ((x/takeHome)*100).toFixed(1)+"%" : "—";
    document.getElementById("expenseStatPct").textContent=pctOf(expenses);
    document.getElementById("saveStatPct").textContent=pctOf(monthlySave);
    document.getElementById("debtStatPct").textContent=pctOf(debtMonthly);
    document.getElementById("goalStatPct").textContent=pctOf(goalTotal);
    let loPctEl=document.getElementById("leftoverStatPct");
    loPctEl.textContent=pctOf(leftover);
    loPctEl.className="subpct "+(leftover<0?"flag-bad":"");

    let incLabel = document.getElementById("calcFromGross").checked ? "take-home (after tax)" : "take-home";
    let bd=[\`\${money(takeHome)} \${incLabel}\`];
    if(expenses>0) bd.push(\`− \${money(expenses)} expenses\`);
    if(monthlySave>0) bd.push(\`− \${money(monthlySave)} house savings\`);
    if(debtMonthly>0) bd.push(\`− \${money(debtMonthly)} debt payment\`);
    if(goalTotal>0) bd.push(\`− \${money(goalTotal)} goals\`);
    if(mortExtra>0) bd.push(\`− \${money(mortExtra)} extra to mortgage\`);
    bd.push(\`= \${money(leftover)} left over\`);
    let breakdownText=bd.join("  ");
    let noteEl=document.getElementById("overviewNote");
    noteEl.innerHTML = (leftover<0
        ? \`<span class="flag-bad">You're over budget by \${money(-leftover)}. Trim expenses or lower a target.</span>\`
        : \`Left over is money not yet assigned. Slide it into savings, debt, or extra mortgage payments to put it to work.\`)
        + \` <span class="info" title="\${breakdownText}">i</span>\`;

    // Debt payoff gets priority over house savings: debt extra draws from the full pool
    // first, and house savings only gets whatever's left over after that.
    let pool=Math.max(0, takeHome - expenses - goalTotal - (anyDebt?baseMin:0));
    let debtExtraCap=pool;
    let saveCap=Math.max(0, pool - extra);
    lastSaveCap=saveCap;
    let mortExtraCap=Math.max(0, pool - extra);
    function applyCap(inputId, sliderId, capId, value, cap, label){
        let slider=document.getElementById(sliderId), input=document.getElementById(inputId), capEl=document.getElementById(capId);
        slider.max=Math.max(10, Math.round(cap));
        slider.value=Math.min(value, cap);
        input.classList.toggle("over", value>cap+0.5);
        if(capEl) capEl.innerHTML = value>cap+0.5
            ? \`<span style="color:var(--bad);">Over your available \${money(cap)} by \${money(value-cap)}.</span>\`
            : \`\${label}. Up to \${money(cap)} available.\`;
    }
    applyCap("monthlySave","monthlySaveSlider","monthlySaveCap",monthlySave,saveCap,"Drag to set house savings");
    applyCap("debtExtra","debtExtraSlider","debtExtraCap",extra,debtExtraCap,"Extra kills debt faster");
    applyCap("mortExtra","mortExtraSlider","mortExtraCap",mortExtra,mortExtraCap,"Extra principal pays the house off sooner");

    // ---- Max-Afford mode: what price can they afford at their current savings pace ----
    // "Be debt-free before buying" checked: full payment budget, since debt is gone by
    // the time you buy (and the projection above already grew faster from the rollover).
    // Unchecked: you're modeling buying while still carrying debt, so that ongoing debt
    // payment has to come out of the same take-home before the mortgage does - shrinking
    // the ceiling here is what actually makes the checkbox change the max price shown.
    let maxCeiling = takeHome * getTargetPaymentPct()/100;
    if(anyDebt && !debtFreeFirst){ maxCeiling = Math.max(0, maxCeiling - debtMonthly); }
    document.getElementById("maxAffordResult").innerHTML =
        buildMaxAffordColumn("30 Year",30,projected,numVal("mortgageRate"),maxCeiling,numVal("closingCostPercent"))
      + buildMaxAffordColumn("15 Year",15,projected,numVal("mortgageRate"),maxCeiling,numVal("closingCostPercent"));
    let leftoverNoteEl=document.getElementById("leftoverApplyNote");
    if(leftover>0.5){
        leftoverNoteEl.innerHTML=\`You have \${money(leftover)}/month left over. <button type="button" style="width:auto;display:inline;padding:6px 12px;font-size:12px;margin-left:6px;" onclick="applyLeftoverToSavings()">Apply to Savings</button>\`;
    } else {
        leftoverNoteEl.innerHTML="";
    }

    let price=numVal("homePrice"),rate=numVal("mortgageRate");
    let down=getDownPayment(price,projected);
    let closing=price*numVal("closingCostPercent")/100;
    updateDownReadout(price,down,projected,closing);

    let pmiMonthly=monthlyPMI(price,down);
    let pmiBox=document.getElementById("pmiBox");
    let showPmi=document.getElementById("showPmi").checked;
    if(showPmi){
        pmiBox.style.display="block";
        if(price<=0){ document.getElementById("pmiReadout").textContent="Enter a home price to see PMI detail."; }
        else if(pmiMonthly<=0){ document.getElementById("pmiReadout").innerHTML=\`<span style="color:var(--ok);">You're putting down 20% or more, so no PMI. That's the cleanest path.</span>\`; }
        else {
            let dropMonths=monthsToDropPMI(price,down,rate,30);
            let dpct=(down/price)*100;
            document.getElementById("pmiReadout").innerHTML=\`At \${dpct.toFixed(1)}% down you'd pay PMI of about <b>\${money(pmiMonthly)}/month</b> (est. \${PMI_ANNUAL_PCT}% of the loan per year). On a 30-year loan you'd reach 20% equity and could drop it in about <b>\${dateFromMonths(dropMonths)}</b>, roughly <b>\${money(pmiMonthly*dropMonths)}</b> in PMI total. Putting 20% down avoids it entirely.\`;
        }
    } else {
        pmiBox.style.display="none";
    }

    let inc=document.getElementById("includeTaxMaint").checked;
    document.getElementById("compareResult").innerHTML=buildPlanHTML("30 Year",price,down,rate,30,takeHome,closing,inc)+buildPlanHTML("15 Year",price,down,rate,15,takeHome,closing,inc);

    let carryDebt=!document.getElementById("debtFreeFirst").checked;
    let opts={ debtFreeYears:anyDebt?debtFreeYears:0, freedMonthly:anyDebt?freedMonthly:0, debtMonthlyDuringWait:anyDebt?debtMonthly:0, carryDebt, targetDownPct:getTargetDownPct(), targetPaymentPct:getTargetPaymentPct() };
    document.getElementById("optimalResult").innerHTML=buildOptimalColumn("30 Year",30,price,rate,takeHome,inc,opts)+buildOptimalColumn("15 Year",15,price,rate,takeHome,inc,opts);

    let r30=findOptimalYear(price,rate,30,takeHome,inc,opts);
    let v=document.getElementById("optimalVerdict");
    let w=document.getElementById("optimalWriteup");
    let tgtDownPct=getTargetDownPct();
    let tgtPayPct=getTargetPaymentPct();

    let gapEl=document.getElementById("gapNote");
    let btnRow=document.getElementById("targetButtonsRow");

    if(price<=0){
        v.textContent=""; v.className="verdict";
        w.textContent="Enter a home price in the mortgage section above, and this will tell you the soonest you can responsibly buy.";
        gapEl.innerHTML=""; btnRow.innerHTML="";
    } else if(!r30){
        v.textContent="Out of reach at current numbers."; v.className="verdict flag-bad";
        w.innerHTML=\`With today's price, rate, and savings, you can't reach \${tgtDownPct}% down with a payment at or under \${tgtPayPct}% of take-home, even after decades. Lowering the price, saving more each month, a longer loan term, or loosening the targets under Custom would bring it within reach.\`;
        gapEl.innerHTML=""; btnRow.innerHTML="";
    } else {
        let rentAmt=numVal("currentRent");
        let buyMonths=Math.round(r30.year*12);
        let parts=[];

        if(r30.year===0||r30.paidOff){
            v.textContent="You can responsibly buy now."; v.className="verdict flag-ok";
        } else {
            v.innerHTML=\`Soonest you can responsibly buy: <span style="color:var(--ink);">\${dateFromMonths(buyMonths)}</span>\`;
            v.className="verdict";
        }

        parts.push(\`<b>Your targets:</b> at least <b>\${tgtDownPct}% down</b>\${tgtDownPct>=20?" (avoids PMI)":" (adds PMI until you reach 20% equity)"} and a payment at or under <b>\${tgtPayPct}%</b> of take-home.\`);

        if(anyDebt && !carryDebt && debtFreeYears>0 && debtFreeYears<=MAX_SEARCH_YEARS){
            let dMonths=Math.round(debtFreeYears*12);
            parts.push(\`<b>Step 1, clear your debt.</b> Paying \${money(debtMonthly)}/month, you'd be debt-free around <b>\${dateFromMonths(dMonths)}</b>. After that, that \${money(debtMonthly)} rolls straight into your house savings, so the down payment grows faster.\`);
        } else if(anyDebt && carryDebt){
            parts.push(\`<b>You've chosen to buy while still carrying debt.</b> That's allowed, but the affordability check below counts your mortgage <i>and</i> your \${money(debtMonthly)}/month debt payment, so it takes a bigger down payment to qualify.\`);
        }

        if(r30.year===0||r30.paidOff){
            parts.push(\`<b>You're already in range.</b> Buying now keeps your 30-year payment at or below \${tgtPayPct}% of take-home.\`);
        } else {
            let pmiNote = r30.pmi>0 ? \` That includes about \${money(r30.pmi)}/month of PMI, since you're under 20% down.\` : "";
            parts.push(\`<b>Step \${anyDebt&&!carryDebt?"2":"1"}, save the down payment.</b> Keep renting while your down payment grows to about <b>\${money(r30.down)}</b> (\${tgtDownPct}% of the price). You'd hit the buy point around <b>\${dateFromMonths(buyMonths)}</b>, when a 30-year mortgage lands at \${money(r30.payment)}/month, <b>\${r30.percent.toFixed(1)}%</b> of take-home.\${pmiNote}\`);
            let totalRent=rentPaidOverYears(r30.year);
            parts.push(\`<b>The cost of waiting:</b> over those \${r30.year} year\${r30.year>1?"s":""} you'd pay about <b>\${money(totalRent)}</b> in rent at \${money(rentAmt)}/month. That's money spent, not saved. If rent is eating your budget, that's what's pushing the buy date out.\`);
        }

        if(leftover>0.5 && !(r30.year===0||r30.paidOff)){
            let origSave=numVal("monthlySave");
            let rFast=findOptimalYearWithSave(price,rate,30,takeHome,inc,opts,origSave+leftover);
            if(rFast && rFast.year<r30.year){
                let diff=r30.year-rFast.year;
                parts.push(\`<b>You have \${money(leftover)}/month sitting unused.</b> If you slid all of it into house savings, you'd hit the buy point about <b>\${diff} year\${diff>1?"s":""} sooner</b>, around \${dateFromMonths(Math.round(rFast.year*12))}. Drag the Down Payment Savings slider up to put it to work.\`);
            }
        }

        if(anyDebt && !carryDebt){
            let optsCarry={ debtFreeYears, freedMonthly, debtMonthlyDuringWait:debtMonthly, carryDebt:true, targetDownPct:getTargetDownPct(), targetPaymentPct:getTargetPaymentPct() };
            let rCarry=findOptimalYear(price,rate,30,takeHome,inc,optsCarry);
            if(rCarry && rCarry.year<r30.year){
                let diff=r30.year-rCarry.year;
                parts.push(\`If you were willing to carry debt into the mortgage, you could buy about <b>\${diff} year\${diff>1?"s":""} sooner</b> (around \${dateFromMonths(Math.round(rCarry.year*12))}), but you'd be juggling both payments. Uncheck "Be debt-free before buying" above to model that.\`);
            }
        }

        w.innerHTML=parts.join("<br><br>");

        // gap analysis: does the actual soonest-year match the Years Saving the user
        // originally typed in Section 5's Down Payment Savings?
        if(r30.paidOff){
            gapEl.innerHTML=""; btnRow.innerHTML="";
        } else if(r30.year<=saveYears){
            gapEl.innerHTML=\`<span class="flag-ok">You're on track - at this pace you'll be ready by your \${saveYears}-year target (actually \${dateFromMonths(buyMonths)}).</span>\`;
            btnRow.innerHTML="";
        } else {
            let requiredDown=Math.max(price*tgtDownPct/100, requiredDownForPayment(price,rate,30,maxCeiling));
            let requiredMonthly=requiredMonthlySavingsForTarget(requiredDown, saveYears);
            let extraNeeded=requiredMonthly-monthlySave;
            if(extraNeeded>0.5){
                gapEl.innerHTML=\`At your current pace, this takes \${r30.year} years instead of your \${saveYears}-year target. To hit \${saveYears} years instead, you'd need to save about <b>\${money(requiredMonthly)}/mo</b> (\${money(extraNeeded)} more than now).\`;
                let affordable=requiredMonthly<=saveCap;
                btnRow.innerHTML=\`<button type="button" onclick="acceptMaxAffordable()">Save the Max I Can Afford</button>\`
                  + (affordable
                      ? \`<button type="button" onclick="acceptTargetTimeline()">Hit My \${saveYears}-Year Target</button>\`
                      : \`<button type="button" disabled style="opacity:0.5;cursor:not-allowed;" title="That's more than you can currently afford (max \${money(saveCap)}/mo)">Hit My \${saveYears}-Year Target</button>\`);
            } else {
                gapEl.innerHTML=""; btnRow.innerHTML="";
            }
        }
    }

    let loanAmt=Math.max(0, price-down);
    function payoffCol(label, term){
        let baseMonths=payoffMonthsWithExtra(loanAmt,rate,term,0);
        let fastMonths=payoffMonthsWithExtra(loanAmt,rate,term,mortExtra);
        let basePay=calcMonthlyPayment(loanAmt,rate,term);
        let baseInterest=basePay*term*12-loanAmt;
        let fastInterest=fastMonths!==null?((basePay+mortExtra)*fastMonths-loanAmt):0;
        let saved=baseInterest-fastInterest;
        return \`<div class="plan"><h3>\${label} + Extra</h3>
            <div class="big">\${fmtMonths(fastMonths)}</div>
            <div class="summary-line"><span>Normal payoff</span><span>\${fmtMonths(baseMonths)}</span></div>
            <div class="summary-line"><span>Monthly payment</span><span>\${money(basePay+mortExtra)}</span></div>
            <div class="summary-line"><span>Interest saved</span><span class="flag-ok">\${mortExtra>0?money(Math.max(0,saved)):"$0"}</span></div></div>\`;
    }
    if(loanAmt>0){
        document.getElementById("customPayoffResult").innerHTML=payoffCol("30 Year",30)+payoffCol("15 Year",15);
    } else {
        document.getElementById("customPayoffResult").innerHTML=\`<div class="plan"><h3>—</h3><div style="text-align:center;font-size:13px;color:rgba(255,255,255,0.7);">Enter a home price and down payment above to model an accelerated payoff.</div></div>\`;
    }

    let mile=[];
    if(anyDebt && debtFreeYears<=MAX_SEARCH_YEARS){ mile.push(\`Debt-free: \${dateFromMonths(Math.round(debtFreeYears*12))}\`); }
    goalRows.filter(g=>g.amount>0).forEach(g=>{ mile.push(\`\${g.name||"Goal"} funded: \${dateFromMonths(Math.round(g.years*12))}\`); });
    if(loanAmt>0){ let fm=payoffMonthsWithExtra(loanAmt,rate,30,mortExtra); mile.push(\`House paid off: \${dateFromMonths(fm)}\${mortExtra>0?\` (with \${money(mortExtra)}/mo extra)\`:" on a 30-year loan"}\`); }
    document.getElementById("milestoneWriteup").innerHTML = mile.length ? "<b>Your milestones</b><br>" + mile.join("<br>") : "Add debt, goals, or a home price to see your milestone timeline.";

    // ---- header summaries + sticky bar ----
    // Every collapsible header carries its own headline number, so collapsing a section
    // hides the inputs but never hides the answer.
    let setSum=(id,txt)=>{ let el=document.getElementById(id); if(el) el.textContent=txt||""; };
    let debtSummary = !anyDebt ? "No debt"
        : (debtFreeYears>MAX_SEARCH_YEARS ? "Payment too low"
        : fmtMonths(Math.round(debtFreeYears*12))+" to debt-free");
    let max30 = takeHome>0 ? maxAffordablePrice(projected,rate,30,maxCeiling) : 0;

    setSum("mortgageResultsSum", document.getElementById("affordModeSelect").value==="max"
        ? (max30>0 ? "up to "+money(max30) : "")
        : (price>0 ? money(price) : ""));
    setSum("customPayoffSum", mortExtra>0 ? "+"+money(mortExtra)+"/mo extra" : "");
    setSum("overviewSum", takeHome>0 ? money(leftover)+" left over" : "");

    // ---- trust checks ----
    // A tick means "this number can be relied on", not "these fields aren't empty".
    // The traps below all produce a confident but badly wrong answer rather than an
    // error, which is the dangerous kind of wrong for someone planning around it.
    // A field left untouched reads as "" while a deliberate 0 reads as "0", so a real
    // 0%-promo debt is never mistaken for a neglected one.
    let isUntouched=(id)=>{ let el=document.getElementById(id); return !el || String(el.value).trim()===""; };
    let debtRateMissing = anyDebt && (perDebtOn
        ? debtRows.some(r=>r.balance>0 && isUntouched(r.id+"_rate"))
        : isUntouched("lumpRate"));
    // a blank/zero mortgage rate silently prices the loan as interest-free
    let mortgageRateMissing = isUntouched("mortgageRate") || numVal("mortgageRate")<=0;
    let customMode = document.getElementById("affordModeSelect").value==="custom";

    let warnMoney = takeHome<=0 ? "enter your take-home pay"
        : (expenses<=0 ? "add your monthly expenses" : null);
    let warnObligations = !anyDebt ? null
        : (debtFreeYears>MAX_SEARCH_YEARS ? "payment too low to pay this off"
        : (debtRateMissing ? "add an interest rate" : null));
    let warnHouse = takeHome<=0 ? "needs take-home pay"
        : (mortgageRateMissing ? "add a mortgage rate"
        : (monthlySave<=0 ? "set a monthly savings amount"
        : (customMode && price<=0 ? "enter a home price" : null)));

    let setStageSum=(id,warning,normal)=>{
        let el=document.getElementById(id); if(!el) return;
        el.textContent = warning ? "⚠ "+warning : normal;
        el.classList.toggle("warn", !!warning);
    };
    setStageSum("stageMoneySum", warnMoney, money(takeHome)+" in · "+money(expenses)+" out");
    setStageSum("stageObligationsSum", warnObligations, debtSummary+(goalTotal>0?" · "+money(goalTotal)+"/mo goals":""));
    setStageSum("stageHouseSum", warnHouse, (monthlySave>0?money(projected)+" saved · ":"")+(max30>0?"up to "+money(max30):""));

    document.getElementById("sbTakeHome").textContent = takeHome>0 ? money(takeHome) : "$0";
    let sbLo=document.getElementById("sbLeftover");
    sbLo.textContent = money(leftover);
    sbLo.className = "sb-val num "+(leftover<0?"flag-bad":(takeHome>0?"flag-ok":""));
    document.getElementById("sbMaxPrice").textContent = max30>0 ? money(max30) : "—";

    // Guided state: dim the later stages until the numbers they depend on exist
    document.getElementById("stageObligations").classList.toggle("needs-input", takeHome<=0);
    document.getElementById("stageHouse").classList.toggle("needs-input", takeHome<=0);

    // Completion ticks ride on the same trust checks as the warnings above, so a tick and
    // a warning can never disagree. Debt and goals stay optional: having neither is a
    // complete answer, it just has to be a trustworthy one.
    let s1Done = !warnMoney;
    let s2Done = s1Done && !warnObligations;
    let s3Done = s1Done && !warnHouse && max30>0;
    document.getElementById("stageMoney").classList.toggle("is-complete", s1Done);
    document.getElementById("stageObligations").classList.toggle("is-complete", s2Done);
    document.getElementById("stageHouse").classList.toggle("is-complete", s3Done);

    saveToLocalStorage();
}

const STORAGE_KEY="budgetDashboardData_v5";
function collectData(){
    let data={};
    FLAT_FIELD_IDS.forEach(id=>{ let el=document.getElementById(id); if(el) data[id]=el.type==="checkbox"?el.checked:el.value; });
    readDebtRows(); readGoalRows();
    data.__debtRows=debtRows.map(r=>({name:r.name,balance:r.balance,rate:r.rate,minPayment:r.minPayment}));
    data.__goalRows=goalRows.map(r=>({name:r.name,amount:r.amount,years:r.years,rate:r.rate}));
    data.__debtStrategy=debtStrategy;
    data.__lumpPaymentEdited=lumpPaymentEdited;
    data.__collapsed={};
    COLLAPSIBLE_IDS.forEach(id=>{ let el=document.getElementById(id); if(el) data.__collapsed[id]=el.classList.contains("collapsed"); });
    return data;
}
function applyData(data){
    FLAT_FIELD_IDS.forEach(id=>{ if(!(id in data)) return; let el=document.getElementById(id); if(!el) return; if(el.type==="checkbox") el.checked=data[id]; else el.value=data[id]; });
    lumpPaymentEdited=!!data.__lumpPaymentEdited;
    MONEY_IDS.forEach(id=>{ let el=document.getElementById(id); if(el&&el.value!==""&&id!=="lumpPayment") formatMoneyField(el); });
    debtRows=[]; goalRows=[];
    document.getElementById("debtList").innerHTML=""; document.getElementById("goalList").innerHTML="";
    if(data.__debtRows) data.__debtRows.forEach(r=>addDebtRow(r));
    if(data.__goalRows) data.__goalRows.forEach(r=>addGoalRow(r));
    if(data.__debtStrategy) setDebtStrategy(data.__debtStrategy);
    // tolerant of older saves that only recorded debtCard/goalCard
    if(data.__collapsed){ COLLAPSIBLE_IDS.forEach(id=>{ let el=document.getElementById(id); if(el && (id in data.__collapsed)) el.classList.toggle("collapsed",data.__collapsed[id]); }); }
    ensureValidState(); updateHouseholdVisibility(); onAffordModeChange(); toggleDownPayment(); toggleDebtMode(); toggleCustomTargets(); calculateAll();
}
function saveToLocalStorage(){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(collectData())); }catch(e){} }
function loadFromLocalStorage(){ try{ let r=localStorage.getItem(STORAGE_KEY); if(r){ applyData(JSON.parse(r)); return true; } }catch(e){} return false; }

window.clearAll=function(){
    if(!confirm("Clear all inputs and reset to blank? This can't be undone.")) return;
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
    FLAT_FIELD_IDS.forEach(id=>{ let el=document.getElementById(id); if(!el) return;
        if(el.type==="checkbox"){ el.checked=(id==="existingInHysa"||id==="useSavingsToggle"||id==="debtFreeFirst"); }
        else if(el.tagName==="SELECT"){ if(id==="householdType") el.value="single"; else if(id==="expensePreset") el.value="custom"; else if(id==="downPaymentMode") el.value="dollar"; else if(id==="stateSelect") el.value=DEFAULT_STATE; else if(id==="affordModeSelect") el.value="max"; }
        else if(id==="startDate"){ let t=new Date(); el.value=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"); }
        else el.value="";
    });
    debtRows=[]; goalRows=[]; document.getElementById("debtList").innerHTML=""; document.getElementById("goalList").innerHTML="";
    lumpPaymentEdited=false;
    // back to the guided first-run view: only the first stage open
    document.getElementById("stageMoney").classList.remove("collapsed");
    ["stageObligations","stageHouse"].forEach(id=>document.getElementById(id).classList.add("collapsed"));
    updateHouseholdVisibility(); toggleDownPayment(); toggleDebtMode(); setDebtStrategy("even");
    showMsg("Cleared. Everything reset to blank.");
    calculateAll();
};

let savedFileHandle=null;
function showMsg(t){ let el=document.getElementById("saveMsg"); el.textContent=t; setTimeout(()=>{ if(el.textContent===t) el.textContent=""; },4000); }
window.saveAsFile=async function(){ let j=JSON.stringify(collectData(),null,2); if("showSaveFilePicker" in window){ try{ savedFileHandle=await window.showSaveFilePicker({suggestedName:"budget-dashboard-data.json",types:[{description:"JSON File",accept:{"application/json":[".json"]}}]}); let w=await savedFileHandle.createWritable(); await w.write(j); await w.close(); showMsg("Saved to file."); }catch(e){ if(e.name!=="AbortError") showMsg("Save failed: "+e.message); } } else { let b=new Blob([j],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a"); a.href=u; a.download="budget-dashboard-data.json"; a.click(); URL.revokeObjectURL(u); showMsg("Downloaded."); } };
// The file handle lives only in memory - a page refresh clears it and the browser can't
// hand it back without asking again, so this falls back to Save As and says so.
window.saveOverwrite=async function(){ if(!savedFileHandle){ showMsg("No file picked yet this visit - choose where to save."); return window.saveAsFile(); } try{ let w=await savedFileHandle.createWritable(); await w.write(JSON.stringify(collectData(),null,2)); await w.close(); showMsg("Overwrote saved file."); }catch(e){ showMsg("Overwrite failed: "+e.message); } };
window.loadFromFile=async function(){ if("showOpenFilePicker" in window){ try{ let [h]=await window.showOpenFilePicker({types:[{description:"JSON File",accept:{"application/json":[".json"]}}]}); savedFileHandle=h; let f=await h.getFile(); applyData(JSON.parse(await f.text())); showMsg("Loaded file."); }catch(e){ if(e.name!=="AbortError") showMsg("Load failed: "+e.message); } } else document.getElementById("fallbackFileInput").click(); };
document.getElementById("fallbackFileInput").addEventListener("change",function(e){ let f=e.target.files[0]; if(!f) return; let r=new FileReader(); r.onload=ev=>{ applyData(JSON.parse(ev.target.result)); showMsg("Loaded file."); }; r.readAsText(f); });

// Event listeners
window.onHouseholdTypeChange=onHouseholdTypeChange;
window.onIncomeModeChange=onIncomeModeChange;
window.onJointIncomeModeChange=onJointIncomeModeChange;
window.applyPreset=applyPreset;
// Everything reachable from an inline on*= attribute must live on window: the whole
// script runs inside an IIFE, and inline handlers resolve against global scope only.
// calculateAll is wired directly to several checkboxes (Show PMI, Count escrow,
// Be debt-free), so omitting it threw ReferenceError on click.
window.calculateAll=calculateAll;
window.toggleCollapse=toggleCollapse;
window.toggleAllSections=toggleAllSections;
window.toggleDownPayment=toggleDownPayment;
window.onDownModeChange=onDownModeChange;
window.toggleCustomTargets=toggleCustomTargets;
window.onAffordModeChange=onAffordModeChange;
window.acceptMaxAffordable=function(){
    setMoney("monthlySave", lastSaveCap);
    calculateAll();
    showMsg(\`Set Monthly Amount Set Aside to \${money(lastSaveCap)} (your max affordable).\`);
};
window.applyLeftoverToSavings=function(){
    if(lastLeftover>0.5){
        let newAmt=numVal("monthlySave")+lastLeftover;
        setMoney("monthlySave", newAmt);
        calculateAll();
        showMsg(\`Added \${money(lastLeftover)} leftover - Monthly Amount Set Aside is now \${money(newAmt)}.\`);
    }
};
window.acceptTargetTimeline=function(){
    let price=numVal("homePrice"), rate=numVal("mortgageRate");
    let takeHome=getMonthlyTakeHome();
    let saveYears=numVal("saveYears")||0;
    let ceiling=takeHome*getTargetPaymentPct()/100;
    let requiredDown=Math.max(price*getTargetDownPct()/100, requiredDownForPayment(price,rate,30,ceiling));
    let requiredMonthly=requiredMonthlySavingsForTarget(requiredDown, saveYears);
    setMoney("monthlySave", requiredMonthly);
    calculateAll();
    showMsg(\`Set Monthly Amount Set Aside to \${money(requiredMonthly)} to hit your \${saveYears}-year target.\`);
};
window.toggleDebtMode=toggleDebtMode;
window.setDebtStrategy=setDebtStrategy;
window.onSlider=onSlider;
window.addDebtRow=addDebtRow;
window.addGoalRow=addGoalRow;
window.removeRow=removeRow;
window.resetStartDateToToday=function(){
    let el=document.getElementById("startDate");
    let t=new Date();
    el.value=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0");
    calculateAll();
};

MONEY_IDS.forEach(id=>{ if(id==="lumpPayment") return; let el=document.getElementById(id); if(el) el.addEventListener("input",()=>formatMoneyField(el)); });
document.getElementById("lumpPayment").addEventListener("focus",function(){ if(this.classList.contains("estimated")){ this.value=""; this.classList.remove("estimated"); } });
document.getElementById("lumpPayment").addEventListener("input",function(){ lumpPaymentEdited=this.value.replace(/[^0-9.]/g,"")!==""; formatMoneyField(this); });
document.getElementById("downPayment").addEventListener("input",function(){ if(document.getElementById("downPaymentMode").value==="dollar") formatMoneyField(this); });
document.querySelectorAll('.dashboard input, .dashboard select').forEach(el=>{ el.addEventListener('input',calculateAll); el.addEventListener('change',calculateAll); });

populateStateSelect();
setDebtStrategy("even");
(function(){ let el=document.getElementById("startDate"); if(el && !el.value){ let t=new Date(); el.value=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"); } })();
let loaded=loadFromLocalStorage();
if(!loaded){
    toggleDebtMode();
    // Guided first run: open only the first stage so there's one obvious starting point
    // instead of a full page of empty fields. Once anything is saved, the user's own
    // open/closed state is restored instead.
    ["stageObligations","stageHouse"].forEach(id=>document.getElementById(id).classList.add("collapsed"));
}
(function(){ let el=document.getElementById("startDate"); if(el && !el.value){ let t=new Date(); el.value=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"); } })();
toggleDownPayment();
toggleCustomTargets();
calculateAll();
})();
`;

export default function Dashboard() {
  useEffect(() => {
    // useEffect already runs after the DOM (including the dangerouslySetInnerHTML
    // markup below) has been committed, so no delay is needed here. Guard against
    // double-init (React Strict Mode's dev double-invoke, or a Fast Refresh remount
    // while a previous run's listeners are still attached) with a flag that's reset
    // on cleanup, instead of leaving orphaned script tags/listeners piled up.
    if (window.__dashboardInitialized) return;
    window.__dashboardInitialized = true;

    const run = new Function(DASHBOARD_SCRIPT);
    run();

    return () => {
      window.__dashboardInitialized = false;
    };
  }, []);

  return (
    <div dangerouslySetInnerHTML={{__html: `
      <h1>Home Buying Readiness Dashboard</h1>
<p class="subtitle">See whether renting or buying makes sense, and how soon you'll be ready. Work top to bottom in three steps: your money first, then debt and goals, then the house.</p>

<div class="filebar">
<button class="secondary" onclick="saveAsFile()" title="Saves everything to a budget-dashboard-data.json file on your computer. Your entries are also kept automatically in this browser, but that copy is tied to this device only - use this for a real backup.">Save As...</button>
<button class="secondary" onclick="saveOverwrite()" title="Writes back to the file you picked earlier in this visit. Refreshing the page makes the browser forget which file that was, so after a reload this asks you where to save again.">Overwrite Last Saved File</button>
<button class="secondary" onclick="loadFromFile()" title="Loads a budget-dashboard-data.json file you saved earlier.">Load Saved File</button>
<button class="secondary danger" onclick="clearAll()">Clear All</button>
</div>
<div class="saveMsg" id="saveMsg"></div>
<input type="file" id="fallbackFileInput" accept=".json" style="display:none;">

<div class="summary-bar" id="summaryBar">
<div class="sb-item"><span class="sb-label">Take-Home</span><span class="sb-val num" id="sbTakeHome">$0</span></div>
<div class="sb-item"><span class="sb-label">Left Over</span><span class="sb-val num" id="sbLeftover">$0</span></div>
<div class="sb-item"><span class="sb-label">Max Home Price</span><span class="sb-val num" id="sbMaxPrice">—</span></div>
</div>

<div class="bulkbar">
<button type="button" onclick="toggleAllSections(true)">Expand All</button>
<button type="button" onclick="toggleAllSections(false)">Collapse All</button>
</div>

<!-- STAGE 1: money in / money out -->
<div class="stage" id="stageMoney">
<h2 class="stage-header" onclick="toggleCollapse('stageMoney')"><span class="step">1</span>Your Money <span class="info hinfo" title="What comes in and what goes out. Everything further down is measured against what's left after these two, so this is the foundation for the whole plan.">i</span><span class="stage-check" id="stageMoneyCheck">✓</span><span class="hdr-sum" id="stageMoneySum"></span><span class="chevron">⌄</span></h2>
<div class="stage-body">
<div class="dashboard">

<!-- 1 TAKE HOME -->
<div class="card" id="takeHomeCard">
<h2>Take-Home Pay <span class="info hinfo" title="Your actual take-home pay after taxes. Everything else is measured against this number. Enter it directly, or check the box to estimate it from a gross salary.">i</span></h2>
<div class="collapse-body" id="takeHomeBody">
<label>Household</label>
<select id="householdType" onchange="onHouseholdTypeChange()">
<option value="single">Single</option>
<option value="couple">Couple</option>
</select>
<div id="jointIncomeToggleBlock" style="display:none;">
<div class="toggle-row">
<input type="checkbox" id="jointIncomeMode" onchange="onJointIncomeModeChange()">
<label style="font-weight:normal;margin:0;">Enter as one combined household income instead of splitting by person</label>
</div>
</div>
<div class="toggle-row">
<input type="checkbox" id="calcFromGross" onchange="onIncomeModeChange()">
<label style="font-weight:normal;margin:0;">Estimate take-home from gross salary + state</label>
</div>
<div id="singleManualBlock">
<label>Yearly Take-Home Pay</label>
<input id="yearlyIncomeSingle" class="money" type="text" placeholder="$0">
</div>
<div id="coupleManualBlock" style="display:none;">
<div id="coupleSplitBlock">
<div class="row2">
<div><label>Person 1 Take-Home</label><input id="yearlyIncomePerson1" class="money" type="text" placeholder="$0"></div>
<div><label>Person 2 Take-Home</label><input id="yearlyIncomePerson2" class="money" type="text" placeholder="$0"></div>
</div>
</div>
<div id="coupleJointBlock" style="display:none;">
<label>Combined Household Take-Home</label>
<input id="yearlyIncomeJoint" class="money" type="text" placeholder="$0">
</div>
</div>
<div id="grossIncomeBlock" style="display:none;">
<label>State</label>
<select id="stateSelect"></select>
<div id="grossSingleBlock">
<label>Gross Yearly Salary</label>
<input id="grossSingle" class="money" type="text" placeholder="$0">
</div>
<div id="grossCoupleBlock" style="display:none;">
<div id="grossSplitBlock">
<div class="row2">
<div><label>Person 1 Gross Salary</label><input id="grossPerson1" class="money" type="text" placeholder="$0"></div>
<div><label>Person 2 Gross Salary</label><input id="grossPerson2" class="money" type="text" placeholder="$0"></div>
</div>
</div>
<div id="grossJointBlock" style="display:none;">
<label>Combined Household Gross Salary</label>
<input id="grossJoint" class="money" type="text" placeholder="$0">
</div>
</div>
<div id="taxBreakdown" class="hint" style="margin-top:-4px;margin-bottom:12px;"></div>
</div>
<div id="incomeTotalLine" class="hint" style="margin-top:-6px;margin-bottom:12px;"></div>
<label>Monthly Take-Home (optional, overrides yearly ÷ 12)</label>
<input id="monthlyIncomeOverride" class="money" type="text" placeholder="$0">
<div class="result-box">
<div class="rb-big num" id="monthlyIncomeResult">$0</div>
<div class="rb-label">take-home per month</div>
<div class="rb-sub num" id="grossNetCompare"></div>
</div>
<div class="hint" style="margin-top:10px;">Tax estimate is approximate, not tax advice. Toggle the box above to compare your numbers with and without estimated tax; both are kept as you switch.</div>
</div>
</div>

<!-- 2 EXPENSES -->
<div class="card" id="expensesCard">
<h2>Monthly Expenses <span class="info hinfo" title="Your regular monthly bills and spending. Use a preset to start from typical averages, then adjust. This is subtracted from take-home first.">i</span></h2>
<div class="collapse-body" id="expensesBody">
<label>Quick-Fill Preset</label>
<select id="expensePreset" onchange="applyPreset()">
<option value="custom">Custom (enter your own)</option>
<option value="single">Average Single Person</option>
<option value="married">Average Married / Couple</option>
</select>
<div class="row2">
<div><label>Rent / Housing</label><input id="expRent" class="money" type="text" placeholder="$0"><div class="minipct" id="rentPct"></div></div>
<div><label>Utilities</label><input id="expUtilities" class="money" type="text" placeholder="$0"></div>
</div>
<div class="row2">
<div><label>Groceries</label><input id="expGroceries" class="money" type="text" placeholder="$0"></div>
<div><label>Gas / Transport</label><input id="expGas" class="money" type="text" placeholder="$0"></div>
</div>
<div class="row2">
<div><label>Insurance</label><input id="expInsurance" class="money" type="text" placeholder="$0"></div>
<div><label>Subscriptions</label><input id="expSubs" class="money" type="text" placeholder="$0"></div>
</div>
<div class="row2">
<div><label>Phone</label><input id="expPhone" class="money" type="text" placeholder="$0"></div>
<div><label>Other / Misc</label><input id="expOther" class="money" type="text" placeholder="$0"></div>
</div>
<div class="result-box">
<div class="rb-big num" id="expenseResult">$0</div>
<div class="rb-label">total monthly expenses</div>
<div class="rb-sub num" id="expensePctSub"></div>
</div>
</div>
</div>

</div>
</div>
</div>

<!-- STAGE 2: what competes for the leftover (debt + other goals) -->
<div class="stage" id="stageObligations">
<h2 class="stage-header" onclick="toggleCollapse('stageObligations')"><span class="step">2</span>Obligations <span class="info hinfo" title="Debt payments and other savings goals draw from the same leftover money as your house fund, so they're settled before the house budget. Both are optional - if you have neither, this stage is already satisfied.">i</span><span class="stage-check" id="stageObligationsCheck">✓</span><span class="hdr-sum" id="stageObligationsSum"></span><span class="chevron">⌄</span></h2>
<div class="stage-body">
<div class="dashboard">

<!-- 3/4 DEBT + GOALS side by side (moved earlier - affect what's left over for house savings) -->
<div class="card" id="debtCard">
<h2>Debt Payoff <span class="info hinfo" title="Any debt you carry. The tool figures out how long to pay it off.">i</span></h2>
<div class="collapse-body" id="debtBody">
<div style="padding-top:4px;"></div>
<div id="debtLumpBlock">
<div class="row2">
<div class="lf"><input id="lumpBalance" class="money" type="text" placeholder="$0"><div class="cap">Total Debt Balance</div></div>
<div class="lf"><input id="lumpRate" type="number" placeholder="0"><div class="cap">Avg Interest Rate %</div></div>
</div>
<div style="height:14px;"></div>
<div class="lf" style="margin-bottom:14px;">
<input id="lumpPayment" class="money" type="text" placeholder="~$0">
<div class="cap">Monthly Payment <span id="lumpPayHint"></span></div>
</div>
</div>
<div id="debtListBlock" style="display:none;">
<div id="debtList"></div>
<button class="add-btn" onclick="addDebtRow()">+ Add a debt</button>
</div>
<div class="toggle-row" style="margin-top:6px;">
<input type="checkbox" id="perDebtMode" onchange="toggleDebtMode()">
<label style="font-weight:normal;margin:0;">Break into individual debts</label>
</div>
<div id="strategyBlock" style="display:none;">
<label>Payoff Strategy <span class="info" title="Hover Even/Avalanche/Snowball below for each strategy's debt-free date and total interest.">i</span></label>
<div class="pillset">
<div class="pill" id="pillEven" title="" onclick="setDebtStrategy('even')">Even <span class="info" title="Even: split your extra money equally across every debt.">i</span></div>
<div class="pill" id="pillHighInterest" title="" onclick="setDebtStrategy('interest')">Avalanche <span class="info" title="Avalanche: pay the highest interest rate first.">i</span></div>
<div class="pill" id="pillSmallBalance" title="" onclick="setDebtStrategy('balance')">Snowball <span class="info" title="Snowball: pay the smallest balance first.">i</span></div>
</div>
<div class="hint" id="strategyCompare" style="margin-bottom:14px;"></div>
</div>
<label>Extra Toward Debt Each Month (optional)</label>
<input id="debtExtra" class="money" type="text" placeholder="$0">
<input type="range" id="debtExtraSlider" class="slider" min="0" max="1000" value="0" oninput="onSlider('debtExtra','debtExtraSlider')">
<div class="hint" id="debtExtraCap" style="margin-top:2px;margin-bottom:14px;">Drag to use leftover money.</div>
<div class="result-box">
<div class="rb-big" id="debtPayoffResult">No debt entered</div>
<div class="rb-label" id="debtPayoffLabel"></div>
<div class="rb-sub" id="debtExtraNote"></div>
</div>
<div class="hint" id="debtTimeline" style="margin-top:10px;"></div>
</div>
</div>

<!-- 4 GOALS (moved earlier) -->
<div class="card" id="goalCard">
<h2>Other Savings Goals <span class="info hinfo" title="Other things you're saving toward (college, a car, a trip).">i</span></h2>
<div class="collapse-body" id="goalBody">
<div style="padding-top:4px;"></div>
<div id="goalList"></div>
<button class="add-btn" onclick="addGoalRow()">+ Add a goal</button>
<div class="result-box">
<div class="rb-big num" id="goalTotalResult">$0</div>
<div class="rb-label">total goal contributions / month</div>
</div>
</div>
</div>

</div>
</div>
</div>

<!-- STAGE 3: the house plan itself -->
<div class="stage" id="stageHouse">
<h2 class="stage-header" onclick="toggleCollapse('stageHouse')"><span class="step">3</span>House Plan <span class="info hinfo" title="How much you set aside each month, and what house that actually buys once escrow, PMI and closing costs are counted. Spends whatever is left after the two stages above.">i</span><span class="stage-check" id="stageHouseCheck">✓</span><span class="hdr-sum" id="stageHouseSum"></span><span class="chevron">⌄</span></h2>
<div class="stage-body">
<div class="dashboard">

<div class="card" id="downSavingsCard">
<h2>Down Payment Savings <span class="info hinfo" title="How much you set aside for a house each month, plus anything already saved.">i</span></h2>
<div class="collapse-body" id="downSavingsBody">
<label>Monthly Amount Set Aside for a House</label>
<input id="monthlySave" class="money" type="text" placeholder="$0">
<input type="range" id="monthlySaveSlider" class="slider" min="0" max="2000" value="0" oninput="onSlider('monthlySave','monthlySaveSlider')">
<div class="hint" id="monthlySaveCap" style="margin-top:2px;margin-bottom:12px;">Drag to set how much of your leftover goes to the house.</div>
<div class="row2">
<div><label>Years Saving</label><input id="saveYears" type="number" placeholder="3" value="3"></div>
<div><label>HYSA Rate (%)</label><input id="hysaRate" type="number" placeholder="3" value="3"></div>
</div>
<label>Money Already Saved (optional)</label>
<input id="existingSavings" class="money" type="text" placeholder="$0">
<div class="toggle-row">
<input type="checkbox" id="existingInHysa" checked>
<label style="font-weight:normal;margin:0;">This is already in the HYSA earning interest</label>
</div>
<div class="result-box">
<div class="rb-big num" id="downPaymentLump">$0</div>
<div class="rb-label" id="downPaymentLumpLabel">saved for down payment</div>
<div class="rb-sub num" id="savePercentSub"></div>
</div>
</div>
</div>

<div class="card" id="mortgageSettingsCard">
<h2>Mortgage & Affordability <span class="info hinfo" title="Shows what home price you can afford at your current savings pace, or how long it'll take to afford a specific price you have in mind.">i</span></h2>
<div class="collapse-body" id="mortgageSettingsBody">

<label>What do you want to see? <span class="info" title="Max Home Price I Can Afford: shows the priciest home you can afford at your current Down Payment Savings pace (Section 5) and the affordability target below - no price entry needed. How Long For a Specific Price: type an exact home price and see the soonest you could responsibly buy it, plus what to change if it's out of reach.">i</span></label>
<select id="affordModeSelect" onchange="onAffordModeChange()">
<option value="max">Max Home Price I Can Afford</option>
<option value="custom">How Long For a Specific Price</option>
</select>

<div class="row2" style="margin-top:14px;">
<div><label>Mortgage Interest Rate (%)</label><input id="mortgageRate" type="number" placeholder="6.5" value="6.5"></div>
<div><label>Closing Costs (% of price)</label><input id="closingCostPercent" type="number" placeholder="3" value="3"></div>
</div>
<div class="row2">
<div><label>Property Tax + Insurance + Maint. (%/yr, est.) <span class="info" title="A combined rough estimate: property tax + homeowners insurance + a maintenance/upkeep reserve, as a % of home price per year. Real lender escrow accounts only hold tax + insurance (+ PMI if under 20% down) — the maintenance portion here is a personal reserve baked into this one number for simplicity, not something the bank collects.">i</span></label><input id="taxMaintPercent" type="number" placeholder="1.5" value="1.5"></div>
<div style="display:flex;align-items:flex-end;">
<div class="toggle-row" style="margin-bottom:16px;">
<input type="checkbox" id="showPmi" onchange="calculateAll()">
<label style="font-weight:normal;margin:0;">Show PMI detail if under 20% down<span class="info" title="If your down payment is below 20%, this shows the estimated monthly PMI.">i</span></label>
</div>
</div>
</div>
<div class="result-box" id="pmiBox" style="display:none;text-align:left;padding:14px 16px;margin-bottom:16px;">
<div class="rb-sub" id="pmiReadout" style="margin-top:0;"></div>
</div>
<div class="toggle-row">
<input type="checkbox" id="includeTaxMaint" checked onchange="calculateAll()">
<label style="font-weight:normal;margin:0;">Count escrow (tax/insurance/PMI) toward the affordability guideline <span class="info" title="Escrow and PMI are always shown as their own line in the payment breakdown below. This only controls whether they count toward the 28%/36% affordability percentage — some guidelines quote Principal & Interest only, others quote the full payment.">i</span></label>
</div>
<div class="toggle-row">
<input type="checkbox" id="debtFreeFirst" checked onchange="calculateAll()">
<label style="font-weight:normal;margin:0;">Be debt-free before buying <span class="info" title="On (recommended): once your debt clears, that freed-up payment automatically rolls into house savings - this applies to your Down Payment Savings projection and the Max-Afford price too, not just the Custom Price search below. Off: model buying while still carrying debt.">i</span></label>
</div>
</div>
</div>

<div class="card wide" id="mortgageResultsCard">
<h2 class="collapsible" onclick="toggleCollapse('mortgageResultsCard')">30yr vs 15yr Results <span class="hdr-sum" id="mortgageResultsSum"></span><span class="chevron">⌄</span></h2>
<div class="collapse-body" id="mortgageResultsBody">
<div id="maxAffordBlock">
<div class="hint" style="margin-top:8px;margin-bottom:4px;">Based on your Down Payment Savings pace (Section 5) and the affordability target below.</div>
<div class="compare" id="maxAffordResult" style="margin-top:10px;"></div>
<button type="button" style="margin-top:10px;" onclick="acceptMaxAffordable()">Save the Max I Can Afford</button>
<div class="hint" id="leftoverApplyNote" style="margin-top:10px;"></div>
</div>

<div id="customPriceBlock" style="display:none;">
<div class="row2" style="margin-top:10px;">
<div><label>Home Price</label><input id="homePrice" class="money" type="text" placeholder="$0"></div>
<div>
<label>Down Payment (type a $ amount or a %)<span class="info" title="Put down 20% or more and you skip PMI.">i</span></label>
<div class="field-suffix">
<div><input id="downPayment" class="money locked" type="text" placeholder="$0" readonly></div>
<div><select id="downPaymentMode" onchange="onDownModeChange()"><option value="dollar">$</option><option value="percent">%</option></select></div>
</div>
</div>
</div>
<div class="toggle-row">
<input type="checkbox" id="useSavingsToggle" checked onchange="toggleDownPayment()">
<label style="font-weight:normal;margin:0;">Use my projected savings balance as the down payment</label>
</div>
<div class="result-box" id="downResultBox" style="margin-top:6px;margin-bottom:16px;text-align:left;padding:14px 16px;">
<div class="rb-sub num" id="downReadout" style="margin-top:0;"></div>
</div>
<div class="compare" id="compareResult"></div>

<div class="row2" style="margin-top:16px;">
<div><label>Plan Start Date <span class="info" title="Everything counts forward from this date. It's saved automatically, so if you entered a test date before, it'll keep loading that instead of today until you change it or click Reset.">i</span></label><div class="field-suffix"><div><input id="startDate" type="date"></div><div><button type="button" style="padding:10px 8px;font-size:12px;" onclick="resetStartDateToToday()">Reset</button></div></div></div>
<div><label>Current Monthly Rent</label><input id="currentRent" class="money locked" type="text" placeholder="$0" readonly></div>
</div>
<div><label>Annual Rent Increase (%)</label><input id="rentIncrease" type="number" placeholder="3" value="3"></div>
<div class="toggle-row">
<input type="checkbox" id="customTargets" onchange="toggleCustomTargets()">
<label style="font-weight:normal;margin:0;">Custom targets</label>
</div>
<div id="customTargetsBlock" style="display:none;">
<div class="row2">
<div><label>Target Down Payment (%)</label><input id="targetDownPct" type="number" placeholder="20"></div>
<div><label>Max Payment (% of take-home)</label><input id="targetPaymentPct" type="number" placeholder="28"></div>
</div>
</div>

<div class="compare" id="optimalResult" style="margin-top:14px;"></div>
<div class="writeup" id="optimalWriteup" style="font-size:14.5px;color:var(--ink);"></div>
<div class="verdict" id="optimalVerdict"></div>
<div class="hint" id="gapNote" style="margin-top:12px;"></div>
<div id="targetButtonsRow" style="display:flex;gap:10px;margin-top:10px;"></div>
<div class="hint" style="margin-top:12px;">Assumes today's price and rate hold steady.</div>
</div>
</div>
</div>

<div class="card wide collapsed" id="customPayoffCard">
<h2 class="collapsible" onclick="toggleCollapse('customPayoffCard')">Custom Payoff: Pay It Down Faster <span class="info hinfo" title="Models adding extra principal each month.">i</span><span class="hdr-sum" id="customPayoffSum"></span><span class="chevron">⌄</span></h2>
<div class="collapse-body" id="customPayoffBody">
<label>Extra Principal Toward the Mortgage Each Month</label>
<input id="mortExtra" class="money" type="text" placeholder="$0">
<input type="range" id="mortExtraSlider" class="slider" min="0" max="2000" value="0" oninput="onSlider('mortExtra','mortExtraSlider')">
<div class="hint" id="mortExtraCap" style="margin-top:2px;margin-bottom:14px;">Models life after buying.</div>
<div class="compare" id="customPayoffResult"></div>
<div class="writeup" id="milestoneWriteup"></div>
</div>
</div>

</div>
</div>
</div>

<!-- Monthly Overview stays outside the stages: it summarises all of them at once -->
<div class="dashboard">
<div class="card wide collapsed" id="overviewCard">
<h2 class="collapsible" onclick="toggleCollapse('overviewCard')">Monthly Overview: Where It All Goes <span class="info hinfo" title="A live snapshot of every dollar of take-home.">i</span><span class="hdr-sum" id="overviewSum"></span><span class="chevron">⌄</span></h2>
<div class="collapse-body" id="overviewBody">
<div class="stat-grid">
<div class="stat"><div class="big num" id="incomeStat">$0</div><div class="label">Take-Home</div></div>
<div class="stat"><div class="big num" id="expenseStat">$0</div><div class="label">Expenses</div><div class="subpct" id="expenseStatPct"></div></div>
<div class="stat"><div class="big num" id="saveStat">$0</div><div class="label">Down Pmt Savings</div><div class="subpct" id="saveStatPct"></div></div>
<div class="stat"><div class="big num" id="debtStat">$0</div><div class="label">Debt Payment</div><div class="subpct" id="debtStatPct"></div></div>
<div class="stat"><div class="big num" id="goalStat">$0</div><div class="label">Goals</div><div class="subpct" id="goalStatPct"></div></div>
<div class="stat"><div class="big num" id="leftoverStat">$0</div><div class="label">Left Over</div><div class="subpct" id="leftoverStatPct"></div></div>
</div>
<div class="hint" id="overviewNote" style="margin-top:14px;text-align:center;"></div>
</div>
</div>

</div>
    `}} />
  );
}
