import { Ledger, type Reservation } from './ledger.ts';

type Fill = {filled:number;fillPrice:number;costCents:number;feeCents:number};
function validNumber(value:unknown){return typeof value==='number'&&Number.isFinite(value);}

export function responseFill(row:any,direction:'UP'|'DOWN'):Fill|null {
  if(!Number.isSafeInteger(row?.fillCount)||row.fillCount<0)return null;
  if(row.fillCount===0)return {filled:0,fillPrice:0,costCents:0,feeCents:0};
  if(!validNumber(row.averageFillPrice)||row.averageFillPrice<=0||row.averageFillPrice>=1||
    !validNumber(row.averageFeePaid)||row.averageFeePaid<0)return null;
  const fillPrice=Number((direction==='UP'?row.averageFillPrice:1-row.averageFillPrice).toFixed(4));
  return {filled:row.fillCount,fillPrice,costCents:Math.ceil(fillPrice*row.fillCount*100-1e-9),feeCents:Math.ceil(row.averageFeePaid*row.fillCount*100-1e-9)};
}

export function fillSummary(rows:any[],orderId:string,direction:'UP'|'DOWN'):Fill|null {
  const seen=new Set<string>();let filled=0,cost=0,fees=0;
  for(const row of rows){
    if(row.order_id!==orderId)continue;
    const id=row.fill_id??row.trade_id;
    if(!id)return null;if(seen.has(id))continue;seen.add(id);
    const quantity=Number(row.count_fp??row.count);
    const yes=Number(row.yes_price_dollars??(row.yes_price===undefined?NaN:Number(row.yes_price)/100));
    const price=direction==='UP'?yes:1-yes;
    const fee=row.fee_cost===undefined?NaN:Number(row.fee_cost);
    if(!Number.isSafeInteger(quantity)||quantity<=0||!Number.isFinite(price)||price<=0||price>=1||!Number.isFinite(fee)||fee<0)return null;
    filled+=quantity;cost+=quantity*price;fees+=fee;
  }
  if(!filled)return null;
  return {filled,fillPrice:cost/filled,costCents:Math.ceil(cost*100-1e-9),feeCents:Math.ceil(fees*100-1e-9)};
}

async function pages(method:(params:any)=>Promise<any>,params:any,key:string):Promise<any[]> {
  const rows:any[]=[];let cursor: string|undefined;const seen=new Set<string>();
  for(let count=0;count<20;count++){
    const page=await method({...params,limit:100,...(cursor?{cursor}:{})});
    if(!Array.isArray(page[key]))throw new Error('Invalid reconciliation response.');
    rows.push(...page[key]);if(!page.cursor)return rows;
    if(seen.has(page.cursor))throw new Error('Repeated reconciliation cursor.');
    seen.add(page.cursor);cursor=page.cursor;
  }
  throw new Error('Incomplete reconciliation: page limit reached.');
}

export async function settleReservations(
  ledger:Ledger,account:{fetchOpenOrders:Function;fetchFills:Function},
  marketResult:(ticker:string)=>Promise<'yes'|'no'|null>,
) {
  for(const original of Object.values((await ledger.readState()).openReservations)){
    let row:Reservation=original;
    if(!row.ticker||!row.direction)continue;
    if(row.status!=='simulated'){
      const orders=await pages(p=>account.fetchOpenOrders(p),{ticker:row.ticker,status:undefined},'orders');
      const order=orders.find(o=>o.client_order_id===row.clientOrderId||(row.orderId&&o.order_id===row.orderId));
      if(!order||!['executed','canceled','expired','rejected'].includes(order.status))continue;
      const count=Number(order.fill_count_fp??order.fill_count);
      if(!Number.isSafeInteger(count)||count<0)continue;
      if(count===0){await ledger.release(row.windowId,'TERMINAL_ZERO_FILL_CONFIRMED');continue;}
      const fills=await pages(p=>account.fetchFills(p),{ticker:row.ticker},'fills');
      const summary=fillSummary(fills,order.order_id,row.direction);
      if(!summary||summary.filled!==count||(row.contracts!==undefined&&summary.filled>row.contracts))continue;
      await ledger.updateReservation(row.windowId,{...summary,orderId:order.order_id,status:'submitted'});
      row={...row,...summary,status:'submitted'};
    }
    if(row.filled===undefined||row.costCents===undefined||row.feeCents===undefined)continue;
    const result=await marketResult(row.ticker!);if(!result)continue;
    const won=(row.direction==='UP'&&result==='yes')||(row.direction==='DOWN'&&result==='no');
    await ledger.settle(row.windowId,(won?row.filled*100:0)-row.costCents-row.feeCents,result);
  }
}
