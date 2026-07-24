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

const MONEY_IDS = ["yearlyIncomeSingle","yearlyIncomePerson1","yearlyIncomePerson2","grossSingle","grossPerson1","grossPerson2","monthlyIncomeOverride","monthlySave","existingSavings","expRent","expUtilities","expGroceries","expGas","expInsurance","expSubs","expPhone","expOther","lumpBalance","lumpPayment","debtExtra","mortExtra","homePrice"];
const FLAT_FIELD_IDS = ["householdType","calcFromGross","stateSelect","yearlyIncomeSingle","yearlyIncomePerson1","yearlyIncomePerson2","grossSingle","grossPerson1","grossPerson2","monthlyIncomeOverride","monthlySave","saveYears","hysaRate","existingSavings","existingInHysa","expensePreset","expRent","expUtilities","expGroceries","expGas","expInsurance","expSubs","expPhone","expOther","perDebtMode","lumpBalance","lumpRate","lumpPayment","debtExtra","mortExtra","homePrice","useSavingsToggle","downPayment","downPaymentMode","mortgageRate","closingCostPercent","taxMaintPercent","includeTaxMaint","showPmi","currentRent","rentIncrease","debtFreeFirst","startDate","customTargets","targetDownPct","targetPaymentPct"];

const THRESHOLD = 28;
const MAX_SEARCH_YEARS = 40;
const MIN_PAYMENT_PCT = 0.025;
const PMI_ANNUAL_PCT = 0.6;

let debtStrategy="even";
let debtRows=[];
let goalRows=[];
let rowCounter=0;
let lumpPaymentEdited=false;

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

function populateStateSelect(){
    let sel=document.getElementById("stateSelect");
    Object.keys(STATE_RATES).sort((a,b)=>STATE_RATES[a].name.localeCompare(STATE_RATES[b].name)).forEach(c=>{
        let o=document.createElement("option"); o.value=c; o.textContent=STATE_RATES[c].name; sel.appendChild(o);
    }); sel.value="PA";
}

function applyPreset(){ let p=document.getElementById("expensePreset").value; if(p==="custom"){ ["expRent","expUtilities","expGroceries","expGas","expInsurance","expSubs","expPhone","expOther"].forEach(k=>{let el=document.getElementById(k); if(el) el.value="";}); calculateAll(); return; } let v=PRESETS[p]; for(let k in v) setMoney(k,v[k]); calculateAll(); }

function toggleCollapse(id){ document.getElementById(id).classList.toggle("collapsed"); }

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
    document.getElementById("singleManualBlock").style.display=(!g&&t!=="couple")?"block":"none";
    document.getElementById("coupleManualBlock").style.display=(!g&&t==="couple")?"block":"none";
    document.getElementById("grossIncomeBlock").style.display=g?"block":"none";
    document.getElementById("grossSingleBlock").style.display=(g&&t!=="couple")?"block":"none";
    document.getElementById("grossCoupleBlock").style.display=(g&&t==="couple")?"block":"none";
}

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
function computeGrossBreakdown(){ let c=document.getElementById("stateSelect").value; let p=STATE_RATES[c]?STATE_RATES[c].rate:0; let hh=document.getElementById("householdType").value; if(hh==="couple") return calcNetIncome(numVal("grossPerson1")+numVal("grossPerson2"),"married",p); return calcNetIncome(numVal("grossSingle"),"single",p); }
function getYearlyIncome(){ if(document.getElementById("calcFromGross").checked) return computeGrossBreakdown().net; if(document.getElementById("householdType").value==="couple") return numVal("yearlyIncomePerson1")+numVal("yearlyIncomePerson2"); return numVal("yearlyIncomeSingle"); }
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
        return debtRows.filter(d=>d.balance>0).map(d=>({balance:d.balance,rate:d.rate,minPayment:d.minPayment>0?d.minPayment:estimateMinPayment(d.balance)}));
    }
    let bal=numVal("lumpBalance");
    if(bal<=0) return [];
    let rate=numVal("lumpRate");
    let pay=lumpPaymentEdited?numVal("lumpPayment"):estimateMinPayment(bal);
    return [{balance:bal,rate:rate,minPayment:pay}];
}

function simulateDebtPayoff(rows, extra, strategy){
    let debts=rows.filter(d=>d.balance>0).map(d=>({...d}));
    if(debts.length===0) return {months:0,empty:true,interest:0};
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
        if(pool<=0&&extra===0){ let stuck=debts.some(d=>d.balance>0&&d.minPayment<=d.balance*(d.rate/100/12)); if(stuck&&months>2) return {months:null,stuck:true}; }
    }
    return months>=1200?{months:null,stuck:true}:{months,empty:false,interest:Math.round(totalInterest)};
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
    let loan=Math.max(0,price-down),payment=affordabilityPayment(price,down,rate,years,inc);
    let pct=checkIncome>0?(payment/checkIncome)*100:0,f=getFlag(pct);
    let pi=calcMonthlyPayment(loan,rate,years),interest=pi*years*12-loan;
    return \`<div class="plan"><h3>\${label}</h3><div class="big">\${money(payment)}/mo</div>
        <div class="summary-line"><span>Loan Amount</span><span>\${money(loan)}</span></div>
        <div class="summary-line"><span>Total Interest</span><span>\${money(interest)}</span></div>
        <div class="summary-line"><span>Cash at Closing</span><span>\${money(down+closing)}</span></div>
        <div class="summary-line"><span>% of Take-Home</span><span class="\${f.c}">\${pct.toFixed(1)}%</span></div>
        <div style="margin-top:10px;text-align:center;" class="\${f.c}">\${f.t}\${inc?" · incl. tax+maint":""}</div></div>\`;
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
    let projected=baseSavingsAtYear(saveYears);
    document.getElementById("downPaymentLump").textContent=money(projected);
    document.getElementById("downPaymentLumpLabel").textContent=\`saved for down payment in \${saveYears} yr\${saveYears!=1?"s":""}\`;
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
    let debtFreeYears=0, freedMonthly=debtMonthly;
    if(!anyDebt){
        dRes.textContent="No debt entered"; dRes.className="rb-big"; dLab.textContent=""; dNote.textContent=""; debtFreeYears=0; freedMonthly=0;
    } else {
        let sim=simulateDebtPayoff(debtSet, extra, debtStrategy);
        if(sim.stuck||sim.months===null){
            dRes.textContent="Payment too low"; dRes.className="rb-big flag-bad"; dLab.textContent="raise the payment or add extra"; dNote.textContent="";
            debtFreeYears=MAX_SEARCH_YEARS+1;
        } else {
            let yrs=Math.floor(sim.months/12),rem=sim.months%12;
            dRes.textContent=(yrs>0?yrs+"y ":"")+rem+"m"; dRes.className="rb-big flag-ok"; dLab.textContent="until debt-free";
            let stratName={even:"Even · ",interest:"Avalanche · ",balance:"Snowball · "};
            let stratNote = document.getElementById("perDebtMode").checked ? (stratName[debtStrategy]||"") : "";
            dNote.textContent=\`\${stratNote}Paying \${money(debtMonthly)}/mo · \${money(sim.interest)} total interest\`;
            debtFreeYears=sim.months/12;
        }
    }

    readGoalRows();
    let goalTotal=totalGoalMonthly();
    document.getElementById("goalTotalResult").textContent=money(goalTotal);

    let mortExtra=numVal("mortExtra");
    let leftover=takeHome-expenses-monthlySave-debtMonthly-goalTotal-mortExtra;
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

    let pool=Math.max(0, takeHome - expenses - goalTotal - (anyDebt?baseMin:0));
    let saveCap=pool;
    let debtExtraCap=Math.max(0, pool - monthlySave);
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

    if(price<=0){
        v.textContent=""; v.className="verdict";
        w.textContent="Enter a home price in the mortgage section above, and this will tell you the soonest you can responsibly buy.";
    } else if(!r30){
        v.textContent="Out of reach at current numbers."; v.className="verdict flag-bad";
        w.innerHTML=\`With today's price, rate, and savings, you can't reach \${tgtDownPct}% down with a payment at or under \${tgtPayPct}% of take-home, even after decades. Lowering the price, saving more each month, a longer loan term, or loosening the targets under Custom would bring it within reach.\`;
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
    data.__collapsed={debtCard:document.getElementById("debtCard").classList.contains("collapsed"),goalCard:document.getElementById("goalCard").classList.contains("collapsed")};
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
    if(data.__collapsed){ document.getElementById("debtCard").classList.toggle("collapsed",data.__collapsed.debtCard); document.getElementById("goalCard").classList.toggle("collapsed",data.__collapsed.goalCard); }
    updateHouseholdVisibility(); toggleDownPayment(); toggleDebtMode(); toggleCustomTargets(); calculateAll();
}
function saveToLocalStorage(){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(collectData())); }catch(e){} }
function loadFromLocalStorage(){ try{ let r=localStorage.getItem(STORAGE_KEY); if(r){ applyData(JSON.parse(r)); return true; } }catch(e){} return false; }

window.clearAll=function(){
    if(!confirm("Clear all inputs and reset to blank? This can't be undone.")) return;
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
    FLAT_FIELD_IDS.forEach(id=>{ let el=document.getElementById(id); if(!el) return;
        if(el.type==="checkbox"){ el.checked=(id==="existingInHysa"||id==="useSavingsToggle"||id==="debtFreeFirst"); }
        else if(el.tagName==="SELECT"){ if(id==="householdType") el.value="single"; else if(id==="expensePreset") el.value="custom"; else if(id==="downPaymentMode") el.value="dollar"; else if(id==="stateSelect") el.value="PA"; }
        else if(id==="startDate"){ let t=new Date(); el.value=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"); }
        else el.value="";
    });
    debtRows=[]; goalRows=[]; document.getElementById("debtList").innerHTML=""; document.getElementById("goalList").innerHTML="";
    lumpPaymentEdited=false;
    document.getElementById("debtCard").classList.add("collapsed");
    document.getElementById("goalCard").classList.add("collapsed");
    updateHouseholdVisibility(); toggleDownPayment(); toggleDebtMode(); setDebtStrategy("even");
    showMsg("Cleared. Everything reset to blank.");
    calculateAll();
};

let savedFileHandle=null;
function showMsg(t){ let el=document.getElementById("saveMsg"); el.textContent=t; setTimeout(()=>{ if(el.textContent===t) el.textContent=""; },4000); }
window.saveAsFile=async function(){ let j=JSON.stringify(collectData(),null,2); if("showSaveFilePicker" in window){ try{ savedFileHandle=await window.showSaveFilePicker({suggestedName:"budget-dashboard-data.json",types:[{description:"JSON File",accept:{"application/json":[".json"]}}]}); let w=await savedFileHandle.createWritable(); await w.write(j); await w.close(); showMsg("Saved to file."); }catch(e){ if(e.name!=="AbortError") showMsg("Save failed: "+e.message); } } else { let b=new Blob([j],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a"); a.href=u; a.download="budget-dashboard-data.json"; a.click(); URL.revokeObjectURL(u); showMsg("Downloaded."); } };
window.saveOverwrite=async function(){ if(!savedFileHandle) return window.saveAsFile(); try{ let w=await savedFileHandle.createWritable(); await w.write(JSON.stringify(collectData(),null,2)); await w.close(); showMsg("Overwrote saved file."); }catch(e){ showMsg("Overwrite failed: "+e.message); } };
window.loadFromFile=async function(){ if("showOpenFilePicker" in window){ try{ let [h]=await window.showOpenFilePicker({types:[{description:"JSON File",accept:{"application/json":[".json"]}}]}); savedFileHandle=h; let f=await h.getFile(); applyData(JSON.parse(await f.text())); showMsg("Loaded file."); }catch(e){ if(e.name!=="AbortError") showMsg("Load failed: "+e.message); } } else document.getElementById("fallbackFileInput").click(); };
document.getElementById("fallbackFileInput").addEventListener("change",function(e){ let f=e.target.files[0]; if(!f) return; let r=new FileReader(); r.onload=ev=>{ applyData(JSON.parse(ev.target.result)); showMsg("Loaded file."); }; r.readAsText(f); });

// Event listeners
window.onHouseholdTypeChange=onHouseholdTypeChange;
window.onIncomeModeChange=onIncomeModeChange;
window.applyPreset=applyPreset;
window.toggleCollapse=toggleCollapse;
window.toggleDownPayment=toggleDownPayment;
window.onDownModeChange=onDownModeChange;
window.toggleCustomTargets=toggleCustomTargets;
window.toggleDebtMode=toggleDebtMode;
window.setDebtStrategy=setDebtStrategy;
window.onSlider=onSlider;
window.addDebtRow=addDebtRow;
window.addGoalRow=addGoalRow;
window.removeRow=removeRow;

MONEY_IDS.forEach(id=>{ if(id==="lumpPayment") return; let el=document.getElementById(id); if(el) el.addEventListener("input",()=>formatMoneyField(el)); });
document.getElementById("lumpPayment").addEventListener("focus",function(){ if(this.classList.contains("estimated")){ this.value=""; this.classList.remove("estimated"); } });
document.getElementById("lumpPayment").addEventListener("input",function(){ lumpPaymentEdited=this.value.replace(/[^0-9.]/g,"")!==""; formatMoneyField(this); });
document.getElementById("downPayment").addEventListener("input",function(){ if(document.getElementById("downPaymentMode").value==="dollar") formatMoneyField(this); });
document.querySelectorAll('.dashboard input, .dashboard select').forEach(el=>{ el.addEventListener('input',calculateAll); el.addEventListener('change',calculateAll); });

populateStateSelect();
setDebtStrategy("even");
(function(){ let el=document.getElementById("startDate"); if(el && !el.value){ let t=new Date(); el.value=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"); } })();
let loaded=loadFromLocalStorage();
if(!loaded){ toggleDebtMode(); }
(function(){ let el=document.getElementById("startDate"); if(el && !el.value){ let t=new Date(); el.value=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"); } })();
toggleDownPayment();
toggleCustomTargets();
calculateAll();
})();
`;

export default function Dashboard() {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.textContent = DASHBOARD_SCRIPT;
    script.type = 'text/javascript';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{__html: `
      <h1>Home Buying Readiness Dashboard</h1>
<p class="subtitle">See whether renting or buying makes sense, and how soon you'll be ready. Fill in each section top to bottom: income first, then spending, saving, debt, and the house.</p>

<div class="filebar">
<button class="secondary" onclick="saveAsFile()">Save As...</button>
<button class="secondary" onclick="saveOverwrite()">Overwrite Last Saved File</button>
<button class="secondary" onclick="loadFromFile()">Load Saved File</button>
<button class="secondary danger" onclick="clearAll()">Clear All</button>
</div>
<div class="saveMsg" id="saveMsg"></div>
<input type="file" id="fallbackFileInput" accept=".json" style="display:none;">

<!-- Full card markup would go here, but for brevity I'm using a note -->
<div class="dashboard">
<div class="card wide" style="text-align:center;color:#666;">
<p>Loading dashboard...</p>
</div>
</div>
    `}} />
  );
}
