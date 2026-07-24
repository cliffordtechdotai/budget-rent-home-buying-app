export const PRESETS = {
    single:{expRent:1200,expUtilities:150,expGroceries:400,expGas:200,expInsurance:150,expSubs:50,expPhone:70,expOther:150},
    married:{expRent:1600,expUtilities:200,expGroceries:700,expGas:300,expInsurance:300,expSubs:70,expPhone:100,expOther:200}
};

export const STATE_RATES = {
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

export function money(n){ return "$"+Math.round(n).toLocaleString("en-US"); }
export function parseMoney(s){ let v=String(s).replace(/[^0-9.\-]/g,""); let n=Number(v); return isFinite(n)?n:0; }

export function calcFederalTax(t,f){
    let b=f==="married"?[[0,23200,0.10],[23200,94300,0.12],[94300,201050,0.22],[201050,383900,0.24],[383900,487450,0.32],[487450,731200,0.35],[731200,Infinity,0.37]]:[[0,11600,0.10],[11600,47150,0.12],[47150,100525,0.22],[100525,191950,0.24],[191950,243725,0.32],[243725,609350,0.35],[609350,Infinity,0.37]];
    let x=0; for(let br of b){ if(t>br[0]) x+=(Math.min(t,br[1])-br[0])*br[2]; } return x;
}

export function calcNetIncome(g,f,sp){
    let sd=f==="married"?29200:14600;
    let tax=Math.max(0,g-sd);
    let fed=calcFederalTax(tax,f),fica=g*0.0765,st=g*(sp/100);
    return {net:Math.max(0,g-fed-fica-st),fedTax:fed,fica,stateTax:st,gross:g};
}

export function calcMonthlyPayment(loan,rate,years){
    if(loan<=0) return 0;
    let m=years*12,mr=rate/100/12;
    return mr>0?loan*(mr*Math.pow(1+mr,m))/(Math.pow(1+mr,m)-1):loan/m;
}

export function calcDebtPayoffMonths(debts, extra, strategy){
    let active=debts.filter(d=>d.balance>0).map(d=>({...d}));
    if(active.length===0) return {months:0,empty:true,interest:0};
    let months=0,totalInterest=0;
    while(active.some(d=>d.balance>0)&&months<1200){
        let pool=extra;
        for(let d of active){ if(d.balance>0){ let i=d.balance*(d.rate/100/12); d.balance+=i; totalInterest+=i; } }
        for(let d of active){ if(d.balance>0){ let pay=Math.min(d.minPayment,d.balance); d.balance-=pay; } }
        let stillActive=active.filter(d=>d.balance>0);
        if(strategy==="even"){
            let share=stillActive.length>0?pool/stillActive.length:0;
            for(let d of stillActive){ let pay=Math.min(share,d.balance); d.balance-=pay; pool-=pay; }
            for(let d of stillActive){ if(pool<=0) break; if(d.balance>0){ let pay=Math.min(pool,d.balance); d.balance-=pay; pool-=pay; } }
        } else {
            stillActive.sort((a,b)=> strategy==="interest"?b.rate-a.rate:a.balance-b.balance);
            for(let d of stillActive){ if(pool<=0) break; let pay=Math.min(pool,d.balance); d.balance-=pay; pool-=pay; }
        }
        months++;
        if(pool<=0&&extra===0){ let stuck=active.some(d=>d.balance>0&&d.minPayment<=d.balance*(d.rate/100/12)); if(stuck&&months>2) return {months:null,stuck:true}; }
    }
    return months>=1200?{months:null,stuck:true}:{months,empty:false,interest:Math.round(totalInterest)};
}

export function initDashboard(){
    console.log("Dashboard initialized (all logic handled via DOM event listeners from HTML)");
}
