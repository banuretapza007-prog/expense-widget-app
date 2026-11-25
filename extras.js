(()=>{
const $=id=>document.getElementById(id),K='wallet_extras_v1';
const I='w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm';
const BT='w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left text-sm font-semibold text-slate-700 block';
let ex={catBudgets:{},recurring:[],merchantMap:{}},pend={};
const loadEx=()=>{try{Object.assign(ex,JSON.parse(localStorage.getItem(K)||'{}'))}catch(e){}};
const saveEx=()=>{try{localStorage.setItem(K,JSON.stringify(ex))}catch(e){}};
const esc=s=>String(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const exCats=()=>state.categories.filter(c=>c.type==='expense');
const opts=ty=>state.categories.filter(c=>c.type===ty).map(c=>`<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
function modal(id,title){const d=document.createElement('div');d.id=id;d.className='fixed inset-0 bg-slate-900/50 z-40 hidden flex items-center justify-center p-4 overflow-y-auto';d.innerHTML=`<div class="bg-white rounded-3xl max-w-md w-full p-5 shadow-xl space-y-3 my-8"><div class="flex justify-between items-center"><h3 class="font-bold text-lg text-slate-900">${title}</h3><button onclick="closeModal('${id}')" class="p-1 text-slate-400 text-xl">✕</button></div><div id="${id}-b" class="space-y-3 text-sm"></div></div>`;document.body.appendChild(d)}

/* ---------- วันที่/เวลา, ชื่อร้าน, เดาหมวด ---------- */
const TH=['มค','กพ','มีค','เมย','พค','มิย','กค','สค','กย','ตค','พย','ธค'],EN=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function parseDT(raw){const t=raw.toLowerCase().replace(/\./g,'');let d='',tm='',dd,mm,yy,th=true;
 let m=t.match(/(\d{1,2})\s*(มีค|เมย|มิย|มค|กพ|พค|กค|สค|กย|ตค|พย|ธค|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-zก-๙]*\s*(\d{2,4})/);
 if(m){dd=+m[1];th=TH.indexOf(m[2])>=0;mm=(th?TH.indexOf(m[2]):EN.indexOf(m[2]))+1;yy=+m[3]}
 else{m=t.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);if(m){dd=+m[1];mm=+m[2];yy=+m[3]}}
 if(dd&&mm&&yy&&dd<=31&&mm<=12){if(yy<100)yy+=th?2500:2000;if(yy>2400)yy-=543;d=`${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`}
 const x=t.match(/(\d{1,2}):(\d{2})/);if(x&&+x[1]<24)tm=x[1].padStart(2,'0')+':'+x[2];
 return{date:d,time:tm}}
function merchantKey(raw){const L=raw.split(/\n/).map(s=>s.trim());
 for(let i=0;i<L.length;i++){const m=L[i].match(/(ไปยัง|ผู้รับ|ชื่อบัญชี|^to\b)\s*[:：]?\s*(.*)/i);
  if(m){const c=(m[2].length>=3?m[2]:L[i+1]||'');const k=c.replace(/[^ก-๙a-z]/gi,'').toLowerCase().slice(0,14);if(k.length>=3)return k}}return''}
const RULES=[['cat_bills',/การไฟฟ้า|mea|pea|ประปา|ais|dtac|true|ทรู|เอไอเอส|3bb|internet|อินเทอร์เน็ต/i],
['cat_health',/โรงพยาบาล|คลินิก|ร้านยา|boots|watsons|pharmacy|เภสัช|ทันต/i],
['cat_ent',/netflix|iqiyi|spotify|youtube|major|เมเจอร์|sf ?cinema|steam|เกม/i],
['cat_shop',/lazada|shopee|central|tops|big ?c|lotus|บิ๊กซี|โลตัส|uniqlo|makro|แม็คโคร|ห้าง/i],
['cat_travel',/bts|mrt|grab(?! ?food)|bolt|taxi|แท็กซี่|ปตท|ptt|shell|บางจาก|bangchak|ทางด่วน|easy ?pass|รถไฟ|airasia|วิน/i],
['cat_food',/7-?eleven|เซเว่น|kfc|mcdonald|starbucks|cafe|coffee|กาแฟ|อาหาร|ข้าว|ก๋วยเตี๋ยว|ชาบู|หมูกระทะ|บุฟเฟ่|ครัว|grab ?food|foodpanda|lineman|ชานม|เบเกอรี่|ร้าน/i]];
function guess(raw){const t=raw.toLowerCase().replace(/[^ก-๙a-z0-9\- ]/g,'');
 for(const k in ex.merchantMap)if(t.replace(/ /g,'').includes(k)&&state.categories.some(c=>c.id===ex.merchantMap[k]))return ex.merchantMap[k];
 for(const[r,re]of RULES)if(re.test(raw)&&state.categories.some(c=>c.id===r))return r;return''}

/* ---------- อ่านสลิป + popup ถามหมวด ---------- */
const oUp=window.handleSlipUpload;
window.handleSlipUpload=async function(e,share){await oUp(e);await post(share)};
async function post(share){
 if(!state.currentSlipDataUrl)return;
 const raw=$('ocr-raw-text').textContent||'',amt=parseFloat($('tx-amount').value)||0,dt=parseDT(raw);
 if(dt.date)$('tx-date').value=dt.date;
 const ref=(raw.match(/(?:อ้างอิง|ref\w*|เลขที่รายการ)[^A-Za-z0-9]{0,6}([A-Za-z0-9]{10,})/i)||[])[1]||'';
 const g=guess(raw);pend={time:dt.time,ref,mk:merchantKey(raw)};
 document.querySelector('input[name="tx-type"][value="expense"]').checked=true;onTxTypeChange();
 if(g){state.selectedCategoryId=g;renderCategoryPills()}
 if(ref&&state.transactions.some(t=>t.ref===ref))showToast('⚠️ สลิปนี้เคยบันทึกไว้แล้ว','error');
 if(share)showPick(amt,g,dt)}
function showPick(amt,g,dt){
 $('m-pick-b').innerHTML=`<p class="text-slate-500 text-xs">ตรวจยอดก่อน แล้วแตะหมวดเพื่อบันทึกทันที${dt.date?` • ${dt.date} ${dt.time||''}`:''}</p>
 <input id="p-amt" type="number" step="any" value="${amt||''}" placeholder="ใส่ยอดเงิน" class="${I} font-bold text-lg">
 <div class="grid grid-cols-3 gap-2">${exCats().map(c=>`<button type="button" onclick="exPick('${c.id}')" class="p-2.5 rounded-2xl flex flex-col items-center gap-1 ${c.id===g?'bg-slate-900 text-white':'bg-slate-50 border border-slate-200'}"><span class="text-xl">${c.emoji}</span><span class="text-[11px] font-semibold truncate w-full text-center">${c.name}</span></button>`).join('')}</div>
 <button type="button" onclick="closeModal('m-pick')" class="w-full py-2 text-slate-500 text-sm">ปิด (แก้ในฟอร์มเอง)</button>`;
 openModal('m-pick')}
window.exPick=id=>{const a=parseFloat($('p-amt').value);if(!(a>0)){showToast('กรุณาใส่ยอดเงิน','error');return}
 $('tx-amount').value=a;state.selectedCategoryId=id;closeModal('m-pick');window.handleAddTransaction({preventDefault(){}})};
async function handleShared(){
 if(!/[?&]shared=1/.test(location.search))return;history.replaceState(null,'',location.pathname);
 try{const c=await caches.open('shared'),r=await c.match('slip');if(!r)return;const b=await r.blob();await c.delete('slip');
  showToast('กำลังอ่านสลิป...');
  await window.handleSlipUpload({target:{files:[new File([b],'slip.jpg',{type:b.type||'image/jpeg'})]}},true)}catch(e){showToast('รับสลิปไม่สำเร็จ','error')}}

/* ---------- บันทึก + กันซ้ำ + แจ้งเตือนงบหมวด ---------- */
const oAdd=window.handleAddTransaction;
window.handleAddTransaction=function(e){e.preventDefault();
 const amt=parseFloat($('tx-amount').value),date=$('tx-date').value,type=document.querySelector('input[name="tx-type"]:checked').value;
 const dup=state.transactions.find(t=>(pend.ref&&t.ref===pend.ref)||(pend.time&&t.amount===amt&&t.date===date&&t.time===pend.time));
 const go=()=>{const p=pend,n=state.transactions.length;oAdd({preventDefault(){}});
  if(state.transactions.length===n)return;pend={};const t=state.transactions[0];
  if(p.time)t.time=p.time;if(p.ref)t.ref=p.ref;
  if(p.mk&&type==='expense'){ex.merchantMap[p.mk]=t.categoryId;saveEx()}
  saveState();alertBudget(t)};
 dup?showConfirm('พบรายการซ้ำ','รายการ/สลิปนี้ดูเหมือนบันทึกไว้แล้ว ต้องการบันทึกซ้ำหรือไม่?',go):go()};
function spent(cid,ym){return state.transactions.filter(t=>t.type==='expense'&&t.categoryId===cid&&(ym==='all'||(t.date||'').startsWith(ym))).reduce((s,t)=>s+Number(t.amount),0)}
function alertBudget(t){const b=ex.catBudgets[t.categoryId];if(t.type!=='expense'||!b)return;
 const p=spent(t.categoryId,t.date.slice(0,7))/b,c=state.categories.find(x=>x.id===t.categoryId);
 if(p>=1)showToast(`🚨 เกินงบหมวด ${c.name} แล้ว`,'error');else if(p>=.8)showToast(`⚠️ ใช้งบ ${c.name} ไป ${Math.round(p*100)}%`)}

/* ---------- แก้ไขรายการ ---------- */
const oH=window.renderHistoryList;
window.renderHistoryList=function(){oH();document.querySelectorAll('#transaction-list button[onclick^="confirmDeleteTx"]').forEach(b=>{
 const id=(b.getAttribute('onclick').match(/'(.+?)'/)||[])[1],e=document.createElement('button');e.type='button';e.className='p-2 rounded-xl hover:bg-emerald-50 text-sm';e.textContent='✏️';e.onclick=()=>openEdit(id);b.before(e)})};
window.exEType=cid=>{$('e-cat').innerHTML=opts($('e-type').value);if(typeof cid==='string')$('e-cat').value=cid};
function openEdit(id){const t=state.transactions.find(x=>x.id===id);if(!t)return;
 $('m-edit-b').innerHTML=`<select id="e-type" class="${I}" onchange="exEType()"><option value="expense">รายจ่าย (-)</option><option value="income">รายรับ (+)</option></select>
 <input id="e-amt" type="number" step="any" class="${I}" value="${t.amount}"><input id="e-date" type="date" class="${I}" value="${t.date}">
 <select id="e-cat" class="${I}"></select><input id="e-note" class="${I}" value="${esc(t.note)}" placeholder="บันทึกเพิ่มเติม">
 <button onclick="exSaveEdit('${id}')" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">บันทึกการแก้ไข</button>`;
 $('e-type').value=t.type;exEType(t.categoryId);openModal('m-edit')}
window.exSaveEdit=id=>{const t=state.transactions.find(x=>x.id===id),a=parseFloat($('e-amt').value);if(!t||!(a>0)||!$('e-date').value){showToast('ข้อมูลไม่ครบ','error');return}
 Object.assign(t,{type:$('e-type').value,amount:a,date:$('e-date').value,categoryId:$('e-cat').value,note:$('e-note').value.trim()});
 saveState();closeModal('m-edit');renderAll();showToast('แก้ไขรายการแล้ว')};

/* ---------- งบแยกหมวด ---------- */
function renderBudgetBox(){const b=$('cat-budget-box');if(!b)return;const ym=state.selectedMonthFilter;
 const rows=exCats().filter(c=>ex.catBudgets[c.id]>0).map(c=>{const s=spent(c.id,ym),lim=ex.catBudgets[c.id],p=Math.round(s/lim*100);
  return `<div><div class="flex justify-between text-xs"><span>${c.emoji} ${c.name}</span><span class="font-num ${p>=100?'text-rose-600 font-bold':'text-slate-500'}">${formatTHB(s)} / ${formatTHB(lim)}</span></div><div class="h-1.5 bg-slate-100 rounded-full mt-1"><div class="h-full rounded-full ${p>=100?'bg-rose-500':p>=80?'bg-amber-400':'bg-emerald-500'}" style="width:${Math.min(100,p)}%"></div></div></div>`}).join('');
 b.innerHTML=rows?`<p class="text-xs font-bold text-slate-500">งบแยกหมวด</p>${rows}`:''}
const oR=window.renderAll;window.renderAll=function(){oR();renderBudgetBox()};
function openBudgets(){closeModal('modal-settings');
 $('m-bud-b').innerHTML=`<p class="text-xs text-slate-500">ใส่วงเงินต่อเดือนของแต่ละหมวด (เว้นว่าง = ไม่จำกัด)</p>`+exCats().map(c=>`<div class="flex items-center gap-2"><span class="w-28 truncate">${c.emoji} ${c.name}</span><input id="b-${c.id}" type="number" min="0" class="${I}" value="${ex.catBudgets[c.id]||''}"></div>`).join('')+`<button onclick="exSaveBud()" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">บันทึกงบ</button>`;openModal('m-bud')}
window.exSaveBud=()=>{ex.catBudgets={};exCats().forEach(c=>{const v=parseFloat($('b-'+c.id).value);if(v>0)ex.catBudgets[c.id]=v});saveEx();closeModal('m-bud');renderAll();showToast('บันทึกงบแยกหมวดแล้ว')};

/* ---------- รายการประจำ ---------- */
function runRecurring(){const n=new Date(),cur=n.getFullYear()*12+n.getMonth();let add=0;
 ex.recurring.forEach(r=>{for(let m=(r.last==null?cur-1:r.last)+1;m<=cur;m++){const y=Math.floor(m/12),mo=m%12,d=Math.min(r.day,new Date(y,mo+1,0).getDate());if(m===cur&&n.getDate()<d)break;
  state.transactions.unshift({id:'tx_'+Date.now()+Math.random().toString(36).slice(2,6),type:r.type,amount:r.amount,categoryId:r.categoryId,date:`${y}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,note:(r.note||'')+' (ประจำ)',slipDataUrl:null});r.last=m;add++}});
 if(add){saveState();saveEx();showToast(`เพิ่มรายการประจำ ${add} รายการ`)}}
function openRec(){closeModal('modal-settings');renderRec();openModal('m-rec')}
function renderRec(){$('m-rec-b').innerHTML=(ex.recurring.map((r,i)=>{const c=state.categories.find(x=>x.id===r.categoryId);return `<div class="flex justify-between items-center border-b border-slate-100 pb-2"><span>${c?c.emoji:''} ${esc(r.note)||(c?c.name:'')} • ${r.type==='income'?'+':'-'}${formatTHB(r.amount)} • ทุกวันที่ ${r.day}</span><button onclick="exDelRec(${i})" class="text-rose-500">🗑</button></div>`}).join('')||'<p class="text-slate-400 text-xs">ยังไม่มีรายการประจำ</p>')+
 `<div class="space-y-2 pt-1"><select id="r-type" class="${I}" onchange="exRType()"><option value="expense">รายจ่าย</option><option value="income">รายรับ</option></select>
 <input id="r-amt" type="number" placeholder="จำนวนเงิน" class="${I}"><select id="r-cat" class="${I}">${opts('expense')}</select>
 <input id="r-day" type="number" min="1" max="31" placeholder="ทุกวันที่ (1-31)" class="${I}"><input id="r-note" placeholder="ชื่อ เช่น ค่าเน็ต" class="${I}">
 <button onclick="exAddRec()" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">เพิ่มรายการประจำ</button></div>`}
window.exRType=()=>{$('r-cat').innerHTML=opts($('r-type').value)};
window.exAddRec=()=>{const a=parseFloat($('r-amt').value),d=parseInt($('r-day').value);if(!(a>0)||!(d>=1&&d<=31)){showToast('ใส่ยอดและวันที่ให้ถูกต้อง','error');return}
 ex.recurring.push({id:'r'+Date.now(),type:$('r-type').value,amount:a,categoryId:$('r-cat').value,day:d,note:$('r-note').value.trim(),last:null});saveEx();runRecurring();renderAll();renderRec()};
window.exDelRec=i=>{ex.recurring.splice(i,1);saveEx();renderRec()};

/* ---------- สำรอง / กู้คืน ---------- */
window.exBackup=()=>{const b=new Blob([JSON.stringify({v:1,monthlyBudget:state.monthlyBudget,categories:state.categories,transactions:state.transactions,extras:ex})],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(b);a.download=`wallet-backup-${getTodayStr()}.json`;a.click();showToast('สำรองข้อมูลแล้ว')};
window.exRestore=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.transactions)||!Array.isArray(d.categories))throw 0;
 showConfirm('กู้คืนข้อมูล',`จะแทนที่ข้อมูลปัจจุบันด้วยไฟล์สำรอง (${d.transactions.length} รายการ) ยืนยันหรือไม่?`,()=>{state.monthlyBudget=d.monthlyBudget||15000;state.categories=d.categories;state.transactions=d.transactions;
  ex=Object.assign({catBudgets:{},recurring:[],merchantMap:{}},d.extras||{});saveState();saveEx();closeModal('modal-settings');renderAll();showToast('กู้คืนข้อมูลเรียบร้อย')})}catch(_){showToast('ไฟล์สำรองไม่ถูกต้อง','error')}};r.readAsText(f);e.target.value=''};

/* ---------- เริ่มต้น ---------- */
addEventListener('DOMContentLoaded',()=>{loadEx();
 [['m-pick','สลิปนี้ค่าอะไร?'],['m-edit','แก้ไขรายการ'],['m-bud','งบแยกหมวด'],['m-rec','รายการประจำรายเดือน']].forEach(a=>modal(...a));
 $('chart-legend-list').insertAdjacentHTML('afterend','<div id="cat-budget-box" class="space-y-2 pt-2 border-t border-slate-100"></div>');
 const box=document.querySelector('#modal-settings .border-t');
 box.insertAdjacentHTML('afterbegin',`<button onclick="exBackup()" class="${BT}">💾 สำรองข้อมูล (JSON)</button>
 <label class="${BT} cursor-pointer">📥 กู้คืนข้อมูล (JSON)<input type="file" accept=".json,application/json" class="sr-only" onchange="exRestore(event)"></label>
 <button onclick="exOpenBud()" class="${BT}">🎯 งบแยกตามหมวด</button><button onclick="exOpenRec()" class="${BT}">🔁 รายการประจำรายเดือน</button>`);
 window.exOpenBud=openBudgets;window.exOpenRec=openRec;
 runRecurring();renderAll();handleShared()});
})();
