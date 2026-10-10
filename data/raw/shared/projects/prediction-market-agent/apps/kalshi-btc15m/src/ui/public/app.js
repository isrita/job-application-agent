"use strict";
const $ = (selector) => document.querySelector(selector);
const usd = (value) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
const signed = (value) => value===null?'—':`${value>=0?'+':''}${usd(value)}`;
const price = (value) => value===null?'—':Number(value).toFixed(2);
const text = (selector,value) => { $(selector).textContent=value; };
let example=null;
let minute=20;
let playback=[];
const phases={0:'Window open',5:'Snapshot and decision',15:'Closed · awaiting result',20:'Simulated result'};

function drawConnections(){
  const canvas=$('#flow-canvas');const svg=$('#connections');
  const bounds=canvas.getBoundingClientRect();
  svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
  svg.replaceChildren();
  if(window.matchMedia('(max-width:860px)').matches)return;
  const ns='http://www.w3.org/2000/svg';
  const anchor=(id,side,ratio=.5)=>{
    const rect=$(id).getBoundingClientRect();
    return side==='right'?{x:rect.right-bounds.left+4,y:rect.top-bounds.top+rect.height*ratio}:
      side==='left'?{x:rect.left-bounds.left-4,y:rect.top-bounds.top+rect.height*ratio}:
      side==='bottom'?{x:rect.left-bounds.left+rect.width*ratio,y:rect.bottom-bounds.top+4}:
      {x:rect.left-bounds.left+rect.width*ratio,y:rect.top-bounds.top-4};
  };
  const edges=[
    ['#node-feed','right',.26,'#node-model','left',.52,'',5],
    ['#node-feed','right',.60,'#node-snapshot','left',.60,'',5],
    ['#node-target','right',.50,'#node-snapshot','left',.30,'',5],
    ['#node-model','bottom',.76,'#node-snapshot','top',.76,'',5],
    ['#node-snapshot','bottom',.50,'#node-ai','top',.50,'',5],
    ['#node-ai','right',.65,'#node-risk','left',.41,'ai',5],
    ['#node-risk','bottom',.50,'#node-order','top',.50,'',5],
    ['#node-order','bottom',.50,'#node-settlement','top',.50,'settle',20],
  ];
  for(const [from,sideA,ratioA,to,sideB,ratioB,color,ready] of edges){
    const a=anchor(from,sideA,ratioA),b=anchor(to,sideB,ratioB);
    const vertical=sideA==='bottom';const bend=vertical?Math.abs(b.y-a.y)*.5:Math.max(35,(b.x-a.x)*.55);
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d',vertical?`M ${a.x} ${a.y} C ${a.x} ${a.y+bend}, ${b.x} ${b.y-bend}, ${b.x} ${b.y}`:`M ${a.x} ${a.y} C ${a.x+bend} ${a.y}, ${b.x-bend} ${b.y}, ${b.x} ${b.y}`);
    path.setAttribute('class',`${color} ${minute<ready?'future':''}`);svg.append(path);
    for(const point of [a,b]){
      const circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',point.x);circle.setAttribute('cy',point.y);circle.setAttribute('r','4');circle.setAttribute('class',`${color} ${minute<ready?'future':''}`);svg.append(circle);
    }
  }
}
function setMinute(value){
  minute=value;text('#timer',`${String(value).padStart(2,'0')}:00`);text('#phase-label',phases[value]);
  $('#timeline-progress').style.width=`${value/20*100}%`;
  document.querySelectorAll('.milestone').forEach(button=>{
    const active=Number(button.dataset.minute)===value;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  });
  document.querySelectorAll('[data-ready-at]').forEach(node=>{
    node.classList.toggle('is-pending',value<Number(node.dataset.readyAt));
  });
  if(example){
    const s=example.simulation;const filled=value>=5;
    text('#fill-result',filled?`FILLED ${s.filled} @ ${price(s.fillPrice)}`:'Awaiting snapshot');
    text('#fill-cost',filled?`cost ${usd(s.filled*s.fillPrice)} + fee ${usd(s.feeCents/100)}`:'IOC simulated after the decision');
    text('#winner',value>=20?'YES · UP WINS':'PENDING');
    text('#payout',value>=20?`${s.filled} × $1.00`:'Unsettled');
    text('#pnl',value>=20?signed(s.pnlUsd):'—');
    text('#ending-balance',usd(example.account.cryptoBalanceUsd+(value>=20?s.pnlUsd:0)));
    text('#close-result',value>=20?`Close: illustrative BRTI ${usd(s.closeIndex)}`:'Result available after close');
  }
  requestAnimationFrame(drawConnections);
}
function cancelPlayback(){playback.forEach(clearTimeout);playback=[];text('#refresh','↻ Replay example');}
function play(){
  if(!example)return;
  if(playback.length){cancelPlayback();return;}
  setMinute(0);text('#refresh','Ⅱ Pause example');
  [5,15,20].forEach((value,index)=>playback.push(setTimeout(()=>{setMinute(value);if(value===20)cancelPlayback();},(index+1)*1800)));
}
function render(data){
  example=data;
  text('#ticker',data.market.ticker);
  text('#btc-now',usd(data.btc.now));text('#target',usd(data.market.target));text('#snapshot-target',usd(data.market.target));
  text('#probability',data.model.probabilityUp.toFixed(3));text('#snapshot-probability',data.model.probabilityUp.toFixed(3));
  text('#sigma',usd(data.btc.sigma));text('#yes-bid',price(data.book.yesBid));text('#yes-ask',price(data.book.yesAsk));
  text('#no-bid',price(1-data.book.yesAsk));text('#no-ask',price(data.book.noAsk));
  text('#snapshot-btc',usd(data.btc.now));text('#reference-delta',signed(data.btc.now-data.btc.reference));
  text('#snapshot-yes',price(data.book.yesAsk));text('#snapshot-no',price(data.book.noAsk));text('#balance',usd(data.account.cryptoBalanceUsd));
  text('#momentum-60',signed(data.btc.momentum60));text('#momentum-180',signed(data.btc.momentum180));
  text('#model-comparison',`Model ${data.model.probabilityUp.toFixed(3)} vs UP ask ${price(data.book.yesAsk)}`);
  text('#reason',data.decision.reason);text('#decision',data.decision.decision);text('#stake',usd(data.decision.stake));text('#limit',price(data.decision.limit));text('#confidence',`${Math.round(data.decision.confidence*100)}%`);
  text('#risk-stake',`Stake ${usd(data.decision.stake)} → ${data.risk.contracts} contracts at ≤ ${price(data.decision.limit)}`);
  text('#daily-loss',`Today ${usd(Math.max(0,-data.account.todayPnlUsd))} · stop ${usd(data.limits.dailyLossLimitUsd)}`);
  text('#risk-floor',`Worst case leaves ${usd(data.account.cryptoBalanceUsd-data.risk.worstCaseUsd)} · floor ${usd(data.limits.balanceFloorUsd)}`);
  text('#freshness',`BTC price: ${data.btc.ageSeconds.toFixed(1)} s old`);
  text('#risk-state',data.risk.allowed?'APPROVED':'BLOCKED');
  text('#order-intent',`BUY ${data.risk.contracts} YES at ≤ ${price(data.decision.limit)} · IOC`);
  text('#notice',data.notices.join(' '));setMinute(minute);
}
async function load(){
  $('#refresh').disabled=true;
  try{
    const response=await fetch('/api/demo',{headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Could not load the example.');render(await response.json());
  }catch(error){text('#notice',error.message);}
  finally{$('#refresh').disabled=false;}
}
async function loadReview(){
  const button=$('#refresh-review');button.disabled=true;
  try{
    const response=await fetch('/api/review');if(!response.ok)throw new Error('Could not read local history.');const data=await response.json();
    text('#review-status',data.hasRun?`Dry run · ${data.windowsDecided} windows · Daily PnL ${signed(data.dailyPnlUsd)} · ${data.openReservations} reservations · ${data.permanentStop?'Permanent STOP':data.dailyStop?'Daily pause':'No stop triggered'} · 0 real orders`:'No dry run with real market data yet. The workflow above is an illustrative example.');
    $('#review-events').replaceChildren(...data.events.slice().reverse().map(event=>{
      const row=document.createElement('div');row.className='recent-row';
      for(const value of [new Date(event.at).toLocaleTimeString('en-US',{timeZone:'America/Lima'}),event.type,event.windowId??'',event.code??event.risk??event.decision??'']){
        const cell=document.createElement('span');cell.textContent=value;row.append(cell);
      }return row;
    }));
  }catch(error){text('#review-status',error.message);}
  finally{button.disabled=false;}
}
document.querySelectorAll('.milestone').forEach(button=>button.addEventListener('click',()=>{cancelPlayback();setMinute(Number(button.dataset.minute));}));
$('#refresh').addEventListener('click',play);$('#refresh-review').addEventListener('click',loadReview);
new ResizeObserver(()=>requestAnimationFrame(drawConnections)).observe($('#flow-canvas'));
window.addEventListener('pagehide',cancelPlayback);
load();loadReview();
