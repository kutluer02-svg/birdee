const KEY="birdee01";
const trDays=["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];
const unitOptions={"Ders":["saat","dk"],"Spor":["dk","saat","km","kez"],"Sağlık":["L","ml","saat","dk","kez"],"İş":["saat","dk","adet"],"Kişisel":["saat","dk","kez","adet"],"Diğer":["saat","dk","kez","adet","km","L"]};
const categoryColors={"Ders":"#4d7cff","Spor":"#33a36b","Sağlık":"#7f66e8","İş":"#d88a24","Kişisel":"#d45b7a","Diğer":"#666"};
const todayISO=()=>new Date().toISOString().slice(0,10);
let state=JSON.parse(localStorage.getItem(KEY)||'{"plans":[],"logs":{},"reviews":{}}');
let calDate=new Date();let selectedDays=new Set([0,1,2,3,4,5,6]);
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
function dowIndex(d=new Date()){return(d.getDay()+6)%7}
function applies(p,d){return p.days.includes(dowIndex(d))}
function plansFor(d){return state.plans.filter(p=>applies(p,d))}
function logKey(d,id){return d.toISOString().slice(0,10)+"|"+id}
function valueFor(d,p){return Number(state.logs[logKey(d,p.id)]||0)}
function pct(d,p){return Math.min(100,Math.round(valueFor(d,p)/p.target*100))}
function dayPct(d){const ps=plansFor(d);if(!ps.length)return null;return Math.round(ps.reduce((a,p)=>a+pct(d,p),0)/ps.length)}
function colorClass(v){if(v==null)return"";if(v<25)return"c0";if(v<50)return"c1";if(v<70)return"c2";if(v<85)return"c3";if(v<95)return"c4";return"c5"}
function summaryText(score,total){if(!total)return"İlk planını eklediğinde gününün ritmini burada göreceksin.";if(score===0)return"Gün henüz başlamadı. Küçük bir planla ilk adımı at.";if(score<40)return"Başlangıç yaptın. Bir sonraki küçük hedefe odaklan.";if(score<70)return"İyi ilerliyorsun. Günün yarısından fazlası hâlâ senin kontrolünde.";if(score<90)return"Güçlü gidiyorsun. Birkaç plan daha ve gün tamam.";return"Bugün planlarına çok iyi sadık kaldın."}
function renderToday(){
  const d=new Date(),ps=plansFor(d),box=document.querySelector("#todayPlans");box.innerHTML="";
  document.querySelector("#todayDate").textContent=d.toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"});
  ps.sort((a,b)=>a.time.localeCompare(b.time)).forEach(p=>{
    const v=valueFor(d,p),pc=pct(d,p),el=document.createElement("div");
    el.className="card";el.style.setProperty("--accent",categoryColors[p.category]||"#111");
    el.innerHTML=`<div class="card-top"><div><b>${p.name}</b><div class="meta">${p.time} · ${p.category} · hedef ${p.target} ${p.unit}</div></div><span class="pill">${p.category}</span></div><div class="task-progress"><input aria-label="${p.name} ilerleme" type="number" min="0" step="0.1" value="${v}" data-id="${p.id}"><div class="progress"><i style="width:${pc}%;background:${categoryColors[p.category]||"#111"}"></i></div><span class="percent">${pc}%</span></div>`;
    el.querySelector("input").oninput=e=>{state.logs[logKey(d,p.id)]=Number(e.target.value||0);save();renderToday();renderCalendar()};
    box.appendChild(el)
  });
  document.querySelector("#todayEmpty").style.display=ps.length?"none":"grid";
  const percentages=ps.map(p=>pct(d,p)),sc=ps.length?Math.round(percentages.reduce((a,b)=>a+b,0)/ps.length):0;
  document.querySelector("#score").textContent=sc;document.querySelector("#sideScore").textContent=sc;
  document.querySelector("#progressBar").style.width=sc+"%";document.querySelector("#scoreRing").style.setProperty("--score",sc);
  document.querySelector("#completedCount").textContent=percentages.filter(x=>x>=100).length;
  document.querySelector("#activeCount").textContent=percentages.filter(x=>x>0&&x<100).length;
  document.querySelector("#waitingCount").textContent=percentages.filter(x=>x===0).length;
  document.querySelector("#dailySummaryText").textContent=summaryText(sc,ps.length);
  const grouped={};ps.forEach(p=>{grouped[p.category]??={s:0,n:0};grouped[p.category].s+=pct(d,p);grouped[p.category].n++});
  const mini=document.querySelector("#todayCategoryMini");mini.innerHTML="";
  Object.entries(grouped).slice(0,5).forEach(([k,v])=>{const pc=Math.round(v.s/v.n);mini.innerHTML+=`<div class="mini-row"><span>${k}</span><div class="mini-bar"><i style="width:${pc}%;background:${categoryColors[k]||"#fff"}"></i></div><b>${pc}%</b></div>`});
  const rev=state.reviews[todayISO()]||{};document.querySelector("#rating").value=rev.rating||5;document.querySelector("#ratingValue").textContent=rev.rating||5;document.querySelector("#dayNote").value=rev.note||"";renderTodayLower()
}

function renderTodayLower(){
  const now=new Date(), today=todayISO(), snap=document.querySelector("#weekSnapshot");
  if(!snap)return;
  snap.innerHTML="";
  let values=[],best=null,bestVal=-1,active=0;
  for(let i=6;i>=0;i--){
    const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);
    const v=dayPct(d),iso=d.toISOString().slice(0,10),has=v!==null;
    if(has){values.push(v);active++;if(v>bestVal){bestVal=v;best=d}}
    const el=document.createElement("div");
    el.className="week-day"+(iso===today?" today-mini":"");
    const dot=v===null?"#ddd":v<25?"#ef7770":v<50?"#efa35c":v<70?"#e2c64d":v<85?"#9ccc91":v<95?"#5dad69":"#176b38";
    el.innerHTML=`<span class="wd-name">${d.toLocaleDateString("tr-TR",{weekday:"short"})}</span><strong class="wd-score">${v===null?"—":v+"%"}</strong><i class="wd-dot" style="background:${dot}"></i>`;
    snap.appendChild(el);
  }
  const avg=values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0;
  document.querySelector("#todayWeekAverage").textContent=avg+"%";
  document.querySelector("#activeDaysKpi").textContent="Aktif gün - "+active;
  document.querySelector("#bestDayKpi").textContent="En iyi gün - "+(best?best.toLocaleDateString("tr-TR",{weekday:"short"}):"—");
  let streak=0;
  for(let i=0;i<30;i++){
    const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);
    const v=dayPct(d);
    if(v!==null&&v>=70)streak++; else if(v!==null)break; else if(i===0)continue; else break;
  }
  document.querySelector("#streakKpi").textContent="Seri - "+streak+" gün";

  const list=document.querySelector("#upcomingPlans");list.innerHTML="";
  const items=[];
  for(let off=0;off<8&&items.length<5;off++){
    const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+off);
    plansFor(d).sort((a,b)=>a.time.localeCompare(b.time)).forEach(p=>{
      if(items.length>=5)return;
      if(off===0&&pct(d,p)>=100)return;
      items.push({p,d,off});
    });
  }
  if(!items.length){list.innerHTML='<div class="upcoming-empty">Yaklaşan plan yok. Yeni bir plan ekleyebilirsin.</div>';return}
  items.forEach(({p,d,off})=>{
    const row=document.createElement("div");row.className="upcoming-item";
    const day=off===0?"Bugün":off===1?"Yarın":d.toLocaleDateString("tr-TR",{weekday:"short",day:"numeric"});
    row.innerHTML=`<i class="upcoming-dot" style="background:${categoryColors[p.category]||"#666"}"></i><div class="upcoming-main"><b>${p.name}</b><span>${day} · ${p.category} · hedef ${p.target} ${p.unit}</span></div><span class="upcoming-time">${p.time}</span>`;
    list.appendChild(row);
  });
}

function finishOnboarding(startPlanning=false){
  localStorage.setItem("birdeeOnboardingSeen","1");
  const el=document.querySelector("#onboarding");
  if(el)el.hidden=true;
  if(startPlanning)openPlan();
}
function maybeShowOnboarding(){
  const seen=localStorage.getItem("birdeeOnboardingSeen")==="1";
  const hasExistingData=state.plans.length>0||Object.keys(state.logs||{}).length>0||Object.keys(state.reviews||{}).length>0;
  const el=document.querySelector("#onboarding");
  if(el&&!seen&&!hasExistingData)el.hidden=false;
}
function saveReview(){state.reviews[todayISO()]={rating:Number(document.querySelector("#rating").value),note:document.querySelector("#dayNote").value};save();alert("Gün sonu değerlendirmesi kaydedildi.")}
document.querySelector("#rating").oninput=e=>document.querySelector("#ratingValue").textContent=e.target.value;
function updateUnitOptions(){const category=document.querySelector("#pCategory").value,unit=document.querySelector("#pUnit"),previous=unit.value,options=unitOptions[category]||unitOptions["Diğer"];unit.innerHTML="";options.forEach(u=>{const o=document.createElement("option");o.value=u;o.textContent=u;unit.appendChild(o)});if(options.includes(previous))unit.value=previous}
function closePlan(){const dialog=document.querySelector("#planDialog");if(dialog.open)dialog.close();document.querySelector("#planForm").reset();pTarget.value=1;pTime.value="09:00";updateUnitOptions()}
function openPlan(){selectedDays=new Set([0,1,2,3,4,5,6]);renderDayButtons();updateUnitOptions();document.querySelector("#planDialog").showModal()}
function renderDayButtons(){const box=document.querySelector("#pDays");box.innerHTML="";trDays.forEach((x,i)=>{const b=document.createElement("button");b.type="button";b.textContent=x;b.className=selectedDays.has(i)?"on":"";b.onclick=()=>{selectedDays.has(i)?selectedDays.delete(i):selectedDays.add(i);renderDayButtons()};box.appendChild(b)})}
document.querySelector("#pCategory").addEventListener("change",updateUnitOptions);
const cancelBtn=document.querySelector('#planForm button[value="cancel"]');if(cancelBtn)cancelBtn.addEventListener("click",e=>{e.preventDefault();closePlan()});
document.querySelector("#planForm").onsubmit=e=>{if(e.submitter?.value==="cancel"){e.preventDefault();closePlan();return}e.preventDefault();const name=document.querySelector("#pName").value.trim();if(!name)return;state.plans.push({id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),name,category:pCategory.value,target:Number(pTarget.value),unit:pUnit.value,time:pTime.value,days:[...selectedDays]});save();document.querySelector("#planDialog").close();document.querySelector("#planForm").reset();pTarget.value=1;pTime.value="09:00";updateUnitOptions();renderAll()};
function renderCalendar(){const y=calDate.getFullYear(),m=calDate.getMonth();document.querySelector("#monthTitle").textContent=calDate.toLocaleDateString("tr-TR",{month:"long",year:"numeric"});const grid=document.querySelector("#calendarGrid");grid.innerHTML="";const first=new Date(y,m,1),offset=dowIndex(first),days=new Date(y,m+1,0).getDate(),now=todayISO();for(let i=0;i<offset;i++){const x=document.createElement("div");x.className="day emptyday";grid.appendChild(x)}for(let n=1;n<=days;n++){const d=new Date(y,m,n,12),iso=d.toISOString().slice(0,10),v=iso<=now?dayPct(d):null,x=document.createElement("div");x.className="day "+colorClass(v)+(iso===now?" today":"");x.textContent=n;if(v!=null)x.title=v+"%";grid.appendChild(x)}}
function shiftMonth(n){calDate=new Date(calDate.getFullYear(),calDate.getMonth()+n,1);renderCalendar()}
function renderProgress(){let sum=0,count=0,recent=[];const cat={};for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const v=dayPct(d);if(v!=null){sum+=v;count++;recent.push([d,v])}plansFor(d).forEach(p=>{cat[p.category]??={s:0,n:0};cat[p.category].s+=pct(d,p);cat[p.category].n++})}const avg=count?Math.round(sum/count):0;weekScore.textContent=avg+"%";weekBar.style.width=avg+"%";categoryStats.innerHTML="";Object.entries(cat).forEach(([k,v])=>{const pc=Math.round(v.s/v.n);categoryStats.innerHTML+=`<div class="stat"><div class="stat-head"><b>${k}</b><b>${pc}%</b></div><div class="progress"><i style="width:${pc}%;background:${categoryColors[k]||"#111"}"></i></div></div>`});recentDays.innerHTML="";recent.reverse().forEach(([d,v])=>recentDays.innerHTML+=`<div class="recent-row"><span>${d.toLocaleDateString("tr-TR",{weekday:"short",day:"numeric",month:"short"})}</span><b>${v}%</b></div>`)}
function renderAll(){renderToday();renderCalendar();renderProgress()}
document.querySelectorAll("nav button[data-page]").forEach(b=>b.onclick=()=>{document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));document.querySelector("#"+b.dataset.page).classList.add("active");document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");if(b.dataset.page==="progress")renderProgress()});
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="birdee-verilerim.json";a.click();URL.revokeObjectURL(a.href)}
function importData(event){
  const input=event.target,file=input.files&&input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      const valid=data&&Array.isArray(data.plans)&&data.logs&&typeof data.logs==="object"&&!Array.isArray(data.logs)&&data.reviews&&typeof data.reviews==="object"&&!Array.isArray(data.reviews);
      if(!valid)throw new Error("invalid");
      const plansValid=data.plans.every(p=>p&&typeof p.id==="string"&&typeof p.name==="string"&&typeof p.category==="string"&&Number.isFinite(Number(p.target))&&Number(p.target)>0&&typeof p.unit==="string"&&typeof p.time==="string"&&Array.isArray(p.days));
      if(!plansValid)throw new Error("invalid-plans");
      const replace=confirm("İçe aktarılan veriler bu cihazdaki mevcut Birdee verilerinin yerini alacak. Devam edilsin mi?");
      if(!replace){input.value="";return}
      state={plans:data.plans,logs:data.logs,reviews:data.reviews};
      save();
      localStorage.setItem("birdeeOnboardingSeen","1");
      alert("Birdee verileri başarıyla içe aktarıldı.");
      input.value="";
      renderAll();
    }catch(err){
      input.value="";
      alert("Bu dosya geçerli bir Birdee yedeği değil.");
    }
  };
  reader.onerror=()=>{input.value="";alert("Dosya okunamadı.")};
  reader.readAsText(file);
}
function resetData(){if(confirm("Tüm Birdee verileri bu cihazdan silinsin mi?")){localStorage.removeItem(KEY);location.reload()}}
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
let deferred;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;installBtn.hidden=false});installBtn.onclick=async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;installBtn.hidden=true}};
updateUnitOptions();renderAll();maybeShowOnboarding();