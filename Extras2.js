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

/* สมุดยืม-คืน */
window.x2Debts=()=>{open('x2-d',(x.debts.map(d=>`<div class="flex justify-between items-center border-b border-slate-100 pb-2 ${d.paid?'opacity-40':''}"><span>${d.dir==='lent'?'🟢 ให้ยืม':'🔴 ยืมมา'} ${esc(d.who)} • <b class="font-num">${formatTHB(d.amt)}</b></span><span><button onclick="x2PaidD('${d.id}')">${d.paid?'↩️':'✅'}</button> <button onclick="x2DelD('${d.id}')" class="text-rose-500">🗑</button></span></div>`).join('')||'<p class="text-slate-400 text-xs">ยังไม่มีรายการ</p>')+`<select id="d-t" class="${I}"><option value="lent">เขายืมเรา (ให้ยืม)</option><option value="borrowed">เรายืมเขา</option></select><input id="d-w" placeholder="ชื่อคน" class="${I}"><input id="d-a" type="number" placeholder="จำนวนเงิน" class="${I}"><button onclick="x2AddD()" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">เพิ่มรายการ</button>`)};
window.x2AddD=()=>{const a=parseFloat($('d-a').value),w=$('d-w').value.trim();if(!w||!(a>0))return;x.debts.unshift({id:uid(),who:w,amt:a,dir:$('d-t').value,paid:false});save();render();x2Debts()};
window.x2PaidD=id=>{const d=x.debts.find(v=>v.id===id);if(d)d.paid=!d.paid;save();render();x2Debts()};
window.x2DelD=id=>{x.debts=x.debts.filter(v=>v.id!==id);save();render();x2Debts()};

/* เป้าหมายออม */
window.x2Goals=()=>{open('x2-g',(x.goals.map(g=>{const p=Math.min(100,Math.round(g.saved/g.target*100));return `<div class="border-b border-slate-100 pb-3 space-y-1.5"><div class="flex justify-between"><b>${esc(g.name)}</b><button onclick="x2DelG('${g.id}')" class="text-rose-500">🗑</button></div><div class="h-2 bg-slate-100 rounded-full"><div class="h-full bg-emerald-500 rounded-full" style="width:${p}%"></div></div><div class="flex items-center gap-2"><span class="text-xs font-num flex-1">${formatTHB(g.saved)} / ${formatTHB(g.target)} (${p}%)</span><input id="gd-${g.id}" type="number" placeholder="+/-" class="${I} w-24"><button onclick="x2Dep('${g.id}')" class="${BT}">ฝาก</button></div></div>`}).join('')||'<p class="text-slate-400 text-xs">ยังไม่มีเป้าหมาย</p>')+`<input id="g-n" placeholder="ชื่อเป้าหมาย เช่น เที่ยวญี่ปุ่น" class="${I}"><input id="g-t" type="number" placeholder="เป้าหมาย (บาท)" class="${I}"><button onclick="x2AddG()" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">สร้างเป้าหมาย</button>`)};
window.x2AddG=()=>{const t=parseFloat($('g-t').value),n=$('g-n').value.trim();if(!n||!(t>0))return;x.goals.push({id:uid(),name:n,target:t,saved:0});save();render();x2Goals()};
window.x2Dep=id=>{const g=x.goals.find(v=>v.id===id),a=parseFloat($('gd-'+id).value);if(!g||!a)return;g.saved=Math.max(0,g.saved+a);save();render();x2Goals();if(g.saved>=g.target)showToast(`🎉 ถึงเป้า ${g.name} แล้ว!`)};
window.x2DelG=id=>{x.goals=x.goals.filter(v=>v.id!==id);save();render();x2Goals()};

/* การ์ดหลัก: คาดการณ์ + กราฟรายเดือน + สรุป */
function render(){const b=$('x2-box');if(!b)return;
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
 b.innerHTML=`<div class="flex flex-wrap gap-1.5"><button onclick="x2Quicks()" class="${BT}">⚡ ปุ่มด่วน</button><button onclick="x2Wallets()" class="${BT}">👛 กระเป๋า</button><button onclick="x2Debts()" class="${BT}">🤝 ยืม-คืน</button><button onclick="x2Goals()" class="${BT}">🎯 ออมเงิน</button><button onclick="x2Pin()" class="${BT}">${x.pin?'🔓 ปิด PIN':'🔒 ตั้ง PIN'}</button><button onclick="x2Dark()" class="${BT}">🌙 โหมดมืด</button></div>
 ${qc?`<div class="flex flex-wrap gap-1.5">${qc}</div>`:''}<div class="flex flex-wrap gap-1.5">${wc}</div>
 <p class="text-xs text-slate-600 leading-relaxed">📈 ${msg}</p><div class="h-40"><canvas id="x2-chart"></canvas></div>
 ${gl?`<div class="space-y-2 pt-1 border-t border-slate-100">${gl}</div>`:''}
 ${lent||bor?`<p class="text-xs text-slate-600 pt-1 border-t border-slate-100">🤝 คนอื่นติดเรา <b class="font-num text-emerald-600">${formatTHB(lent)}</b> • เราติดคนอื่น <b class="font-num text-rose-600">${formatTHB(bor)}</b></p>`:''}`;
 const ms=[];for(let i=5;i>=0;i--)ms.push(new Date(n.getFullYear(),n.getMonth()-i,1));
 const sum=(m,ty)=>state.transactions.filter(t=>t.type===ty&&(t.date||'').startsWith(`${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}`)).reduce((s,t)=>s+ +t.amount,0);
 if(chart){chart.destroy();chart=null}
 chart=new Chart($('x2-chart'),{type:'bar',data:{labels:ms.map(m=>TM[m.getMonth()]),datasets:[{label:'รายรับ',data:ms.map(m=>sum(m,'income')),backgroundColor:'#10b981'},{label:'รายจ่าย',data:ms.map(m=>sum(m,'expense')),backgroundColor:'#f43f5e'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:10}}}},scales:{y:{ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}});
 const w=$('tx-wallet');if(w){const v=w.value;w.innerHTML=x.wallets.map(k=>`<option value="${k.id}">${k.emoji} ${esc(k.name)}</option>`).join('');if(v&&x.wallets.some(k=>k.id===v))w.value=v}}
const oR=window.renderAll;window.renderAll=function(){oR();render()};

addEventListener('DOMContentLoaded',()=>{
 [['x2-w','👛 กระเป๋า'],['x2-q','⚡ ปุ่มจดด่วน'],['x2-d','🤝 สมุดยืม-คืน'],['x2-g','🎯 เป้าหมายออม']].forEach(a=>mk(...a));
 const box=document.createElement('section');box.id='x2-box';box.className='bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3';
 document.querySelector('main section').insertAdjacentElement('afterend',box);
 $('tx-note').parentElement.insertAdjacentHTML('beforebegin',`<div><label class="block text-xs font-semibold text-slate-600 mb-1">กระเป๋า</label><select id="tx-wallet" class="${I}"></select></div>`);
 lastN=state.transactions.length;renderAll();
 const a=new URLSearchParams(location.search).get('action');
 if(a){history.replaceState(null,'',location.pathname);setTimeout(()=>{if(a==='scan'&&$('slip-file-input'))$('slip-file-input').click();else{$('tx-amount').scrollIntoView({block:'center'});$('tx-amount').focus()}},400)}
});
})();
