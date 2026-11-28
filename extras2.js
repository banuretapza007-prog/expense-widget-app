(()=>{
const $=id=>document.getElementById(id),K='wallet_extras2_v1';
const I='w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm',BT='px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700';
const TM=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
let x={quick:[],wallets:[{id:'w_cash',name:'เงินสด',emoji:'💵'},{id:'w_bank',name:'บัญชีธนาคาร',emoji:'🏦'}],debts:[],goals:[],pin:'',dark:false},lastN=0,chart=null;
try{Object.assign(x,JSON.parse(localStorage.getItem(K)||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(x))}catch(e){}};
const esc=s=>String(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;'),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('w'+s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const catOpts=()=>state.categories.filter(c=>c.type==='expense').map(c=>`<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
function mk(id,title){const d=document.createElement('div');d.id=id;d.className='fixed inset-0 bg-slate-900/50 z-40 hidden flex items-center justify-center p-4 overflow-y-auto';d.innerHTML=`<div class="bg-white rounded-3xl max-w-md w-full p-5 shadow-xl space-y-3 my-8"><div class="flex justify-between items-center"><h3 class="font-bold text-lg text-slate-900">${title}</h3><button onclick="closeModal('${id}')" class="p-1 text-slate-400 text-xl">✕</button></div><div id="${id}-b" class="space-y-3 text-sm"></div></div>`;document.body.appendChild(d)}
const open=(id,html)=>{$(id+'-b').innerHTML=html;openModal(id)};

/* โหมดมืด */
const st=document.createElement('style');st.textContent='html.dark{filter:invert(1) hue-rotate(180deg);background:#fff}html.dark img,html.dark canvas,html.dark .widget-card{filter:invert(1) hue-rotate(180deg)}';document.head.appendChild(st);
document.documentElement.classList.toggle('dark',!!x.dark);
window.x2Dark=()=>{x.dark=!x.dark;save();document.documentElement.classList.toggle('dark',x.dark)};

/* ล็อก PIN */
function lock(){const o=document.createElement('div');o.id='x2-lock';o.className='fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center gap-4 p-6';
 o.innerHTML=`<div class="text-white text-lg font-bold">🔒 ใส่ PIN</div><input id="x2-pin" type="password" inputmode="numeric" maxlength="6" class="text-center text-2xl tracking-widest w-48 py-3 rounded-2xl"><button id="x2-go" class="px-8 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold">ปลดล็อก</button><p id="x2-err" class="text-rose-400 text-sm"></p>`;document.body.appendChild(o);
 const go=async()=>{if(await sha($('x2-pin').value)===x.pin)o.remove();else{$('x2-err').textContent='PIN ไม่ถูกต้อง';$('x2-pin').value=''}};$('x2-go').onclick=go;$('x2-pin').onkeydown=e=>{if(e.key==='Enter')go()}}
if(x.pin)lock();
window.x2Pin=async()=>{if(x.pin){showConfirm('ปิด PIN','ต้องการปิดการล็อกด้วย PIN หรือไม่?',()=>{x.pin='';save();showToast('ปิด PIN แล้ว');render()});return}
 const p=prompt('ตั้ง PIN ตัวเลข 4-6 หลัก');if(!p)return;if(!/^\d{4,6}$/.test(p)){showToast('PIN ต้องเป็นตัวเลข 4-6 หลัก','error');return}x.pin=await sha(p);save();showToast('ตั้ง PIN แล้ว ครั้งหน้าที่เปิดแอปจะถูกล็อก');render()};

/* กระเป๋า: ผูกรายการใหม่กับกระเป๋าที่เลือก */
const oS=window.saveState;
window.saveState=function(a){const n=state.transactions.length,t=state.transactions[0];if(n===lastN+1&&t&&t.walletId===undefined){const s=$('tx-wallet');if(s&&s.value)t.walletId=s.value}lastN=n;return oS(a)};
const bal=id=>state.transactions.filter(t=>t.walletId===id).reduce((s,t)=>s+(t.type==='income'?1:-1)*Number(t.amount),0);
const unB=()=>state.transactions.filter(t=>!x.wallets.some(w=>w.id===t.walletId)).reduce((s,t)=>s+(t.type==='income'?1:-1)*Number(t.amount),0);
window.x2Wallets=()=>{open('x2-w',x.wallets.map(w=>`<div class="flex justify-between items-center border-b border-slate-100 pb-2"><span>${w.emoji} ${esc(w.name)} • <b class="font-num">${formatTHB(bal(w.id))}</b></span><button onclick="x2DelW('${w.id}')" class="text-rose-500">🗑</button></div>`).join('')+`<div class="flex gap-2"><input id="w-e" value="💳" class="${I} w-16 text-center"><input id="w-n" placeholder="ชื่อกระเป๋า เช่น บัตรเครดิต" class="${I}"></div><button onclick="x2AddW()" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">เพิ่มกระเป๋า</button><p class="text-xs text-slate-400">ยอดกระเป๋า = รายรับ − รายจ่ายของรายการที่เลือกกระเป๋านั้น (รายการเก่าที่ไม่ได้เลือกจะอยู่ในช่อง "ไม่ระบุ")</p>`)};
window.x2AddW=()=>{const n=$('w-n').value.trim();if(!n)return;x.wallets.push({id:'w_'+uid(),name:n,emoji:$('w-e').value||'💳'});save();render();x2Wallets()};
window.x2DelW=id=>{if(x.wallets.length<=1){showToast('ต้องเหลืออย่างน้อย 1 กระเป๋า','error');return}x.wallets=x.wallets.filter(w=>w.id!==id);save();render();x2Wallets()};

/* ปุ่มจดด่วน */
window.x2Quick=i=>{const q=x.quick[i];if(!q)return;const s=$('tx-wallet');state.transactions.unshift({id:'tx_'+uid(),type:'expense',amount:q.a,categoryId:q.c,date:getTodayStr(),note:q.n,slipDataUrl:null,walletId:s?s.value:undefined});saveState();renderAll();showToast(`บันทึก ${q.n} ${formatTHB(q.a)} แล้ว`)};
window.x2Quicks=()=>{open('x2-q',x.quick.map((q,i)=>`<div class="flex justify-between items-center border-b border-slate-100 pb-2"><span>${esc(q.n)} • ${formatTHB(q.a)}</span><button onclick="x2DelQ(${i})" class="text-rose-500">🗑</button></div>`).join('')+`<input id="q-n" placeholder="ชื่อ เช่น กาแฟ" class="${I}"><input id="q-a" type="number" placeholder="จำนวนเงิน" class="${I}"><select id="q-c" class="${I}">${catOpts()}</select><button onclick="x2AddQ()" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">เพิ่มปุ่มด่วน</button>`)};
window.x2AddQ=()=>{const a=parseFloat($('q-a').value),n=$('q-n').value.trim();if(!n||!(a>0))return;x.quick.push({n,a,c:$('q-c').value});save();render();x2Quicks()};
window.x2DelQ=i=>{x.quick.splice(i,1);save();render();x2Quicks()};

/* หน้า ยืมเงิน + หน้า ออมสิน */
const CARD='bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4';
function renderDebts(){const p=$('x2-debts-page');if(!p)return;
 const sm=dir=>x.debts.filter(v=>!v.paid&&v.dir===dir).reduce((t,v)=>t+v.amt,0);
 p.innerHTML=`<div class="${CARD}"><h2 class="font-bold text-lg text-slate-900">🤝 ยืมเงิน</h2>
 <div class="grid grid-cols-2 gap-3"><div class="rounded-2xl bg-emerald-50 p-3"><p class="text-xs text-emerald-800">คนอื่นติดเรา</p><p class="font-num font-bold text-lg text-emerald-700">${formatTHB(sm('lent'))}</p></div><div class="rounded-2xl bg-rose-50 p-3"><p class="text-xs text-rose-800">เราติดคนอื่น</p><p class="font-num font-bold text-lg text-rose-700">${formatTHB(sm('borrowed'))}</p></div></div>
 <div class="divide-y divide-slate-100">`+(x.debts.map(d=>`<div class="py-3 flex justify-between items-center gap-2 ${d.paid?'opacity-40':''}"><span>${d.dir==='lent'?'🟢 เขายืมเรา':'🔴 เรายืมเขา'} <b>${esc(d.who)}</b><br><span class="font-num text-sm">${formatTHB(d.amt)}${d.paid?' • คืนแล้ว':''}</span></span><span class="shrink-0"><button onclick="x2PaidD('${d.id}')" class="${BT}">${d.paid?'↩️ ยกเลิก':'✅ คืนแล้ว'}</button> <button onclick="x2DelD('${d.id}')" class="text-rose-500 p-2">🗑</button></span></div>`).join('')||'<p class="text-slate-400 text-sm text-center py-6">ยังไม่มีรายการ</p>')+`</div>
 <div class="space-y-2 pt-3 border-t border-slate-100"><p class="text-xs font-bold text-slate-500">+ เพิ่มรายการ</p><select id="d-t" class="${I}"><option value="lent">เขายืมเรา (ให้ยืม)</option><option value="borrowed">เรายืมเขา</option></select><input id="d-w" placeholder="ชื่อคน" class="${I}"><input id="d-a" type="number" placeholder="จำนวนเงิน" class="${I}"><button onclick="x2AddD()" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">เพิ่มรายการ</button></div></div>`}
window.x2AddD=()=>{const a=parseFloat($('d-a').value),w=$('d-w').value.trim();if(!w||!(a>0)){showToast('ใส่ชื่อและจำนวนเงิน','error');return}x.debts.unshift({id:uid(),who:w,amt:a,dir:$('d-t').value,paid:false});save();render()};
window.x2PaidD=id=>{const d=x.debts.find(v=>v.id===id);if(d)d.paid=!d.paid;save();render()};
window.x2DelD=id=>showConfirm('ลบรายการ','ต้องการลบรายการนี้หรือไม่?',()=>{x.debts=x.debts.filter(v=>v.id!==id);save();render()});
function renderGoals(){const p=$('x2-goals-page');if(!p)return;const tot=x.goals.reduce((t,g)=>t+g.saved,0);
 p.innerHTML=`<div class="${CARD}"><div><h2 class="font-bold text-lg text-slate-900">🎯 ออมสิน</h2><p class="text-xs text-slate-500">เงินออมรวม <b class="font-num text-emerald-600">${formatTHB(tot)}</b></p></div>`+
 (x.goals.map(g=>{const q=Math.min(100,Math.round(g.saved/g.target*100));return `<div class="border border-slate-100 rounded-2xl p-4 space-y-2"><div class="flex justify-between items-center"><b>${esc(g.name)}</b><button onclick="x2DelG('${g.id}')" class="text-rose-500 p-1">🗑</button></div><div class="h-2.5 bg-slate-100 rounded-full"><div class="h-full bg-emerald-500 rounded-full" style="width:${q}%"></div></div><div class="text-xs font-num text-slate-600">${formatTHB(g.saved)} / ${formatTHB(g.target)} (${q}%) • เหลืออีก ${formatTHB(Math.max(0,g.target-g.saved))}</div><div class="flex gap-2"><input id="gd-${g.id}" type="number" placeholder="จำนวนเงิน" class="${I}"><button onclick="x2Dep('${g.id}',1)" class="${BT} text-emerald-700 shrink-0">+ ฝาก</button><button onclick="x2Dep('${g.id}',-1)" class="${BT} text-rose-600 shrink-0">− ถอน</button></div></div>`}).join('')||'<p class="text-slate-400 text-sm text-center py-6">ยังไม่มีเป้าหมาย สร้างด้านล่างได้เลย</p>')+
 `<div class="space-y-2 pt-3 border-t border-slate-100"><p class="text-xs font-bold text-slate-500">+ สร้างเป้าหมายใหม่</p><input id="g-n" placeholder="ชื่อเป้าหมาย เช่น เที่ยวญี่ปุ่น" class="${I}"><input id="g-t" type="number" placeholder="เป้าหมาย (บาท)" class="${I}"><button onclick="x2AddG()" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">สร้างเป้าหมาย</button></div></div>`}
window.x2AddG=()=>{const t=parseFloat($('g-t').value),n=$('g-n').value.trim();if(!n||!(t>0)){showToast('ใส่ชื่อและเป้าหมาย','error');return}x.goals.push({id:uid(),name:n,target:t,saved:0});save();render()};
window.x2Dep=(id,sg)=>{const g=x.goals.find(v=>v.id===id),a=Math.abs(parseFloat($('gd-'+id).value));if(!g||!(a>0))return;g.saved=Math.max(0,g.saved+sg*a);save();render();if(g.saved>=g.target)showToast(`🎉 ถึงเป้า ${g.name} แล้ว!`)};
window.x2DelG=id=>showConfirm('ลบเป้าหมาย','ต้องการลบเป้าหมายนี้หรือไม่?',()=>{x.goals=x.goals.filter(v=>v.id!==id);save();render()});

/* ปัดซ้าย-ขวา 3 หน้า */
function buildPager(){const main=document.querySelector('main'),pg=document.createElement('div');pg.id='x2-pager';
 pg.style.cssText='display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;align-items:flex-start;width:100%;scrollbar-width:none';
 const sl=el=>{const d=document.createElement('div');d.style.cssText='flex:0 0 100%;min-width:100%;scroll-snap-align:start;scroll-snap-stop:always';d.appendChild(el);return d};
 const pgEl=id=>{const d=document.createElement('div');d.id=id;d.className='max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5';return d};
 main.before(pg);pg.append(sl(main),sl(pgEl('x2-goals-page')),sl(pgEl('x2-debts-page')));
 const bar=document.createElement('nav');bar.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:35;display:flex;background:#fff;border-top:1px solid #e2e8f0;padding-bottom:env(safe-area-inset-bottom)';
 bar.innerHTML=[['💸','รายรับ-รายจ่าย'],['🎯','ออมสิน'],['🤝','ยืมเงิน']].map((t,i)=>`<button data-i="${i}" class="flex-1 py-2 text-xs font-semibold"><div class="text-lg leading-none">${t[0]}</div>${t[1]}</button>`).join('');document.body.appendChild(bar);
 const bs=[...bar.querySelectorAll('button')],set=i=>bs.forEach((b,k)=>{b.style.color=k===i?'#059669':'#64748b';b.style.borderTop=k===i?'3px solid #059669':'3px solid transparent'});set(0);let cur=0;
 bs.forEach(b=>b.onclick=()=>{pg.scrollTo({left:+b.dataset.i*pg.clientWidth,behavior:'smooth'});window.scrollTo(0,0)});
 pg.onscroll=()=>{const i=Math.round(pg.scrollLeft/pg.clientWidth);if(i!==cur){cur=i;set(i);window.scrollTo(0,0)}};
 const t=document.createElement('style');t.textContent='#toast-container{bottom:4.5rem !important}#x2-pager::-webkit-scrollbar{display:none}#transaction-list button.p-2{padding:.3rem !important}#transaction-list .x2dh{margin-top:.75rem}#transaction-list .x2dh:first-child{margin-top:0}';document.head.appendChild(t)}

/* การ์ดหลัก: คาดการณ์ + กราฟรายเดือน + สรุป */
function render(){renderGoals();renderDebts();const pb=$('x2-pin-btn');if(pb)pb.textContent=x.pin?'🔓 ปิด PIN':'🔒 ตั้ง PIN';const b=$('x2-box');if(!b)return;
 const n=new Date(),ym=getCurrentMonthStr(),dim=new Date(n.getFullYear(),n.getMonth()+1,0).getDate(),d=n.getDate(),bud=+state.monthlyBudget||0;
 const mt=state.transactions.filter(t=>t.type==='expense'&&(t.date||'').startsWith(ym)),exp=mt.reduce((s,t)=>s+ +t.amount,0),avg=exp/d,proj=avg*dim;
 let msg=`ใช้ไปเฉลี่ยวันละ ${formatTHB(Math.round(avg))}`;
 if(exp>0)msg+=bud>0&&proj>bud?` • ถ้าใช้ในอัตรานี้ งบจะหมดวันที่ ${Math.min(dim,Math.ceil(bud/avg))}`:` • คาดว่าสิ้นเดือนใช้ ~${formatTHB(Math.round(proj))} (อยู่ในงบ)`;
 const cs={};mt.forEach(t=>cs[t.categoryId]=(cs[t.categoryId]||0)+ +t.amount);const tp=Object.entries(cs).sort((a,b)=>b[1]-a[1])[0],tc=tp&&state.categories.find(c=>c.id===tp[0]);
 if(tc)msg+=` • หมวดที่ใช้มากสุด: ${tc.emoji} ${tc.name} ${formatTHB(tp[1])}`;
 const un=unB(),wc=x.wallets.map(w=>`<span class="px-3 py-1.5 rounded-xl bg-slate-100 text-xs">${w.emoji} ${esc(w.name)} <b class="font-num">${formatTHB(bal(w.id))}</b></span>`).join('')+(un?`<span class="px-3 py-1.5 rounded-xl bg-slate-50 text-xs text-slate-500">ไม่ระบุ <b class="font-num">${formatTHB(un)}</b></span>`:'');
 const qc=x.quick.map((q,i)=>`<button onclick="x2Quick(${i})" class="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold active:scale-95">⚡ ${esc(q.n)} ${formatTHB(q.a)}</button>`).join('');
 const lent=x.debts.filter(v=>!v.paid&&v.dir==='lent').reduce((s,v)=>s+v.amt,0),bor=x.debts.filter(v=>!v.paid&&v.dir==='borrowed').reduce((s,v)=>s+v.amt,0);
 const gl=x.goals.map(g=>{const p=Math.min(100,Math.round(g.saved/g.target*100));return `<div><div class="flex justify-between text-xs"><span>🎯 ${esc(g.name)}</span><span class="font-num">${formatTHB(g.saved)} / ${formatTHB(g.target)}</span></div><div class="h-1.5 bg-slate-100 rounded-full mt-1"><div class="h-full bg-emerald-500 rounded-full" style="width:${p}%"></div></div></div>`}).join('');
 b.innerHTML=`<div class="flex flex-wrap gap-1.5"><button onclick="x2Quicks()" class="${BT}">⚡ ปุ่มด่วน</button><button onclick="x2Wallets()" class="${BT}">👛 กระเป๋า</button></div>
 ${qc?`<div class="flex flex-wrap gap-1.5">${qc}</div>`:''}<div class="flex flex-wrap gap-1.5">${wc}</div>
 <p class="text-xs text-slate-600 leading-relaxed">📈 ${msg}</p><div class="h-40"><canvas id="x2-chart"></canvas></div>
`;
 const ms=[];for(let i=5;i>=0;i--)ms.push(new Date(n.getFullYear(),n.getMonth()-i,1));
 const sum=(m,ty)=>state.transactions.filter(t=>t.type===ty&&(t.date||'').startsWith(`${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}`)).reduce((s,t)=>s+ +t.amount,0);
 if(chart){chart.destroy();chart=null}
 chart=new Chart($('x2-chart'),{type:'bar',data:{labels:ms.map(m=>TM[m.getMonth()]),datasets:[{label:'รายรับ',data:ms.map(m=>sum(m,'income')),backgroundColor:'#10b981'},{label:'รายจ่าย',data:ms.map(m=>sum(m,'expense')),backgroundColor:'#f43f5e'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:10}}}},scales:{y:{ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}});
 const w=$('tx-wallet');if(w){const v=w.value;w.innerHTML=x.wallets.map(k=>`<option value="${k.id}">${k.emoji} ${esc(k.name)}</option>`).join('');if(v&&x.wallets.some(k=>k.id===v))w.value=v}}
const oR=window.renderAll;window.renderAll=function(){oR();render()};

/* ประวัติแยกรายวัน */
const oH2=window.renderHistoryList;
window.renderHistoryList=function(){oH2();const L=$('transaction-list');if(!L)return;
 const today=formatThaiDateShort(getTodayStr()),G=[];
 [...L.children].forEach(r=>{const sp=r.querySelectorAll('.text-xs span'),am=r.querySelector('.font-num');if(sp.length<3||!am)return;
  const dt=sp[2].textContent.trim(),tx=am.textContent,v=parseFloat(tx.replace(/[^0-9.]/g,''))||0;sp[1].style.display='none';sp[2].style.display='none';
  let g=G[G.length-1];if(!g||g.dt!==dt){g={dt,first:r,inc:0,exp:0};G.push(g)}if(tx.trim().startsWith('-'))g.exp+=v;else g.inc+=v});
 G.forEach(g=>{const h=document.createElement('div');h.className='x2dh flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2 text-xs';
  h.innerHTML=`<b class="text-slate-800">📅 ${g.dt}${g.dt===today?' • วันนี้':''}</b><span class="font-num">${g.exp?`<span class="text-rose-600 font-bold">จ่าย ${formatTHB(g.exp)}</span>`:''}${g.exp&&g.inc?' • ':''}${g.inc?`<span class="text-emerald-600 font-bold">รับ ${formatTHB(g.inc)}</span>`:''}</span>`;g.first.before(h)})};

addEventListener('DOMContentLoaded',()=>{
 [['x2-w','👛 กระเป๋า'],['x2-q','⚡ ปุ่มจดด่วน']].forEach(a=>mk(...a));
 const box=document.createElement('section');box.id='x2-box';box.className='bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3';
 document.querySelector('main section').insertAdjacentElement('afterend',box);
 $('tx-note').parentElement.insertAdjacentHTML('beforebegin',`<div><label class="block text-xs font-semibold text-slate-600 mb-1">กระเป๋า</label><select id="tx-wallet" class="${I}"></select></div>`);
 const sb=document.querySelector('#modal-settings .border-t'),ST='w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left text-sm font-semibold text-slate-700 block';
 if(sb)sb.insertAdjacentHTML('afterbegin',`<button id="x2-pin-btn" onclick="closeModal('modal-settings');x2Pin()" class="${ST}">🔒 ตั้ง PIN</button><button onclick="x2Dark()" class="${ST}">🌙 สลับโหมดมืด</button>`);
 {const h=$('transaction-list').closest('section'),t=h.querySelector('h2'),p=h.querySelector('p');if(t)t.textContent='ประวัติรายวัน';if(p)p.textContent='แยกตามวัน ดูยอดจ่าย/รับรวมของแต่ละวัน แตะ ✏️ เพื่อแก้ไข';}
 buildPager();lastN=state.transactions.length;renderAll();
 const a=new URLSearchParams(location.search).get('action');
 if(a){history.replaceState(null,'',location.pathname);setTimeout(()=>{if(a==='scan'&&$('slip-file-input'))$('slip-file-input').click();else{$('tx-amount').scrollIntoView({block:'center'});$('tx-amount').focus()}},400)}
});
})();
