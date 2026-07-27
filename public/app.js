const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const defaults={tasks:[false,false,false,false,false],library:[],plans:[],settings:{name:"小翠",city:"Birmingham",restaurant:"",cuisine:"中餐",platforms:"小红书、TikTok、Instagram",style:"真实、自然、实用，不过度营销",memory:"我住在英国，经营餐馆，正在做英国生活、小红书和 TikTok 内容，也养了一只吉娃娃。"}};
let state=Object.assign({},defaults,JSON.parse(localStorage.getItem("xiao-v6")||"{}"));
state.settings=Object.assign({},defaults.settings,state.settings||{});
const save=()=>localStorage.setItem("xiao-v6",JSON.stringify(state));
const toast=t=>{const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)};
const escapeHtml=s=>(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const go=p=>{$$(".page").forEach(x=>x.classList.toggle("active",x.id===p));$$("#nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===p));scrollTo({top:0,behavior:"smooth"})};
$$("[data-page]").forEach(b=>b.onclick=()=>go(b.dataset.page));$$("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));$$("[data-open-create]").forEach(b=>b.onclick=()=>go("create"));
$("#date").textContent=new Intl.DateTimeFormat("zh-CN",{dateStyle:"full"}).format(new Date());
const hour=new Date().getHours();$("#hello").textContent=`${state.settings.name}，${hour<12?"早上好":hour<18?"下午好":"晚上好"}`;

async function api(payload){
 const r=await fetch("/api/ai",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
 const data=await r.json().catch(()=>({}));
 if(!r.ok) throw new Error(data.error||`请求失败（${r.status}）`);
 return data.text||"";
}
async function checkApi(){try{const r=await fetch("/api/status");const d=await r.json();$("#apiState").textContent=d.configured?"已连接":"待配置";$("#apiDetail").textContent=d.configured?`已安全连接 OpenAI 后端。当前模型：${d.model}`:"尚未配置 OPENAI_API_KEY。界面和本地管理功能可用，但 AI 生成需要先添加 API Key。"}catch{$("#apiState").textContent="未连接";$("#apiDetail").textContent="无法检查后端状态。"}}
checkApi();

const taskNames=["发布一条小红书","准备一个 TikTok","发布餐馆内容","回复评论","查看作品数据"];
function renderTasks(){const html=taskNames.map((x,i)=>`<label class="task"><input type="checkbox" data-task="${i}" ${state.tasks[i]?"checked":""}><span>${x}</span></label>`).join("");$("#tasks").innerHTML=html;$$("[data-task]").forEach(x=>x.onchange=()=>{state.tasks[+x.dataset.task]=x.checked;save();renderTasks();updateKpis()})}
$("#resetTasks").onclick=()=>{state.tasks=[false,false,false,false,false];save();renderTasks();updateKpis()};
function updateKpis(){$("#kpiLibrary").textContent=state.library.length;$("#kpiPlans").textContent=state.plans.length;$("#kpiTasks").textContent=`${state.tasks.filter(Boolean).length}/5`}
renderTasks();updateKpis();

const ideas=[
["🇬🇧","英国超市里最容易买错的5样东西","实用避坑型内容","英国生活"],
["🍜","英国客人第一次吃东北菜会点什么","真实客人选择和菜品特写","餐馆宣传"],
["🚗","英国理论考试通过后下一步做什么","新手完整流程","英国驾照"],
["🐶","吉娃娃一天到底吃多少","记录真实喂养日常，不做医疗诊断","吉娃娃"],
["🛍️","伯明翰到 Bicester 一日购物攻略","交通、巴士、时间表和回程","英国生活"],
["🎬","餐馆开门前两小时都在忙什么","后厨准备的沉浸式视频","餐馆宣传"],
["💷","英国生活中真正省钱的小习惯","账单、交通和超市","小红书"],
["🥡","一道菜从下单到上桌的全过程","适合 TikTok 的快节奏脚本","TikTok"],
["☕","不喜欢苦咖啡，在英国怎么点饮料","真实点单英文和口味建议","英国生活"]
];
function renderIdeas(){const picks=[...ideas].sort(()=>Math.random()-.5);$("#miniIdeas").innerHTML=picks.slice(0,3).map(x=>`<button data-idea="${escapeHtml(x[1])}" data-type="${x[3]}"><span>${x[0]} ${x[1]}</span><small>${x[3]}</small></button>`).join("");$("#ideaGrid").innerHTML=picks.map(x=>`<article class="idea" data-idea="${escapeHtml(x[1])}" data-type="${x[3]}"><span>${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p><b>${x[3]} · 点击创作</b></article>`).join("");$$("[data-idea]").forEach(b=>b.onclick=()=>{go("create");$("#createType").value=[...$("#createType").options].some(o=>o.value===b.dataset.type)?b.dataset.type:"小红书";$("#createPrompt").value=b.dataset.idea})}
renderIdeas();$("#shuffleIdeas").onclick=renderIdeas;$("#ideaRefresh").onclick=renderIdeas;
$$("[data-quick]").forEach(b=>b.onclick=()=>{go("create");$("#createType").value=b.dataset.quick});

function context(){const s=state.settings;return `创作者背景：称呼${s.name}；所在城市${s.city}；餐馆${s.restaurant||"未填写"}；餐馆类型${s.cuisine}；主要平台${s.platforms}；偏好风格${s.style}；补充记忆：${s.memory}`}

let lastCreation="";
$("#generateBtn").onclick=async()=>{
 const topic=$("#createPrompt").value.trim();if(!topic)return toast("请先填写主题");
 const btn=$("#generateBtn");btn.disabled=true;$("#generationStatus").innerHTML='<span class="loading">AI 正在创作</span>';$("#createResult").classList.remove("empty");$("#createResult").textContent="正在整理你的素材并生成内容……";
 try{
  lastCreation=await api({task:"create",context:context(),type:$("#createType").value,tone:$("#createTone").value,language:$("#createLang").value,extra:$("#createExtra").value,topic});
  $("#createResult").textContent=lastCreation;$("#generationStatus").textContent="生成完成";
 }catch(e){$("#createResult").textContent=`生成失败：${e.message}`;$("#generationStatus").textContent="需要检查 API 配置"}finally{btn.disabled=false}
};
$("#copyResult").onclick=()=>copyText(lastCreation||$("#createResult").textContent);
$("#saveResult").onclick=()=>{if(!lastCreation)return toast("请先生成内容");addLibrary($("#createType").value,$("#createPrompt").value,lastCreation)};
function addLibrary(type,topic,content){state.library.unshift({id:Date.now(),type,topic,date:new Date().toLocaleString("zh-CN"),content});state.library=state.library.slice(0,100);save();renderLibrary();renderRecent();updateKpis();toast("已保存到内容库")}
function copyText(t){navigator.clipboard.writeText(t).then(()=>toast("已复制"))}
$$("[data-copy-target]").forEach(b=>b.onclick=()=>copyText($("#"+b.dataset.copyTarget).textContent));

async function simpleGenerate(button,output,payload){const b=$(button),o=$(output);b.disabled=true;o.classList.remove("empty");o.innerHTML='<span class="loading">AI 正在生成</span>';try{o.textContent=await api({...payload,context:context()})}catch(e){o.textContent=`生成失败：${e.message}`}finally{b.disabled=false}}
$("#restGenerate").onclick=()=>{const t=$("#restTopic").value.trim();if(!t)return toast("请填写宣传内容");simpleGenerate("#restGenerate","#restResult",{task:"restaurant",topic:t,channel:$("#restChannel").value,goal:$("#restGoal").value})};
$("#reviewGenerate").onclick=()=>{const t=$("#reviewText").value.trim();if(!t)return toast("请粘贴顾客评论");simpleGenerate("#reviewGenerate","#reviewResult",{task:"review",review:t,language:$("#reviewLang").value,tone:$("#reviewTone").value})};

const chatHistory=[];
$("#chatSend").onclick=async()=>{const input=$("#chatInput"),text=input.value.trim();if(!text)return;$("#chatMessages").insertAdjacentHTML("beforeend",`<div class="msg user">${escapeHtml(text)}</div>`);input.value="";chatHistory.push({role:"user",content:text});const holder=document.createElement("div");holder.className="msg ai loading";holder.textContent="正在思考";$("#chatMessages").append(holder);$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight;try{const answer=await api({task:"chat",context:context(),messages:chatHistory.slice(-12)});holder.classList.remove("loading");holder.textContent=answer;chatHistory.push({role:"assistant",content:answer})}catch(e){holder.classList.remove("loading");holder.textContent=`暂时无法回答：${e.message}`}$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight};
$("#chatInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#chatSend").click()}});

let imageData=null;
$("#analysisImage").onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>8*1024*1024)return toast("图片请控制在 8MB 以内");imageData=await fileToDataURL(f);$("#drop b").textContent=`已选择：${f.name}`};
const fileToDataURL=f=>new Promise((res,rej)=>{const r=new FileReader;r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)});
$("#analyseBtn").onclick=async()=>{const values={views:$("#views").value,likes:$("#likes").value,saves:$("#saves").value,comments:$("#comments").value,note:$("#analysisNote").value};if(!imageData&&!values.views)return toast("请上传截图或填写浏览量");const b=$("#analyseBtn"),o=$("#analysisResult");b.disabled=true;o.classList.remove("empty");o.innerHTML='<span class="loading">AI 正在分析数据和截图</span>';try{o.textContent=await api({task:"analyse",context:context(),metrics:values,image:imageData})}catch(e){o.textContent=`分析失败：${e.message}`}finally{b.disabled=false}};

function renderRecent(){const a=state.library.slice(0,3);$("#recent").innerHTML=a.length?a.map(x=>`<article><small>${escapeHtml(x.type)} · ${escapeHtml(x.date)}</small><b>${escapeHtml(x.topic)}</b><button class="link" data-view="${x.id}">查看</button></article>`).join(""):'<p class="muted">还没有保存内容，先去生成第一篇吧。</p>';$$("[data-view]").forEach(b=>b.onclick=()=>viewItem(+b.dataset.view))}
function renderLibrary(){const q=($("#librarySearch")?.value||"").toLowerCase();const a=state.library.filter(x=>(x.topic+x.type+x.content).toLowerCase().includes(q));$("#libraryList").innerHTML=a.length?a.map(x=>`<div class="row"><b>${escapeHtml(x.type)}</b><span>${escapeHtml(x.topic)}<small>${escapeHtml(x.date)}</small></span><button class="ghost small" data-view="${x.id}">查看</button><div class="row-actions"><button class="ghost small" data-copy="${x.id}">复制</button><button class="danger" data-delete="${x.id}">删除</button></div></div>`).join(""):'<p class="muted">没有找到内容。</p>';$$("[data-view]").forEach(b=>b.onclick=()=>viewItem(+b.dataset.view));$$("[data-copy]").forEach(b=>b.onclick=()=>copyText(state.library.find(x=>x.id===+b.dataset.copy).content));$$("[data-delete]").forEach(b=>b.onclick=()=>{state.library=state.library.filter(x=>x.id!==+b.dataset.delete);save();renderLibrary();renderRecent();updateKpis()})}
function viewItem(id){const x=state.library.find(y=>y.id===id);if(!x)return;go("create");$("#createType").value=[...$("#createType").options].some(o=>o.value===x.type)?x.type:"小红书";$("#createPrompt").value=x.topic;lastCreation=x.content;$("#createResult").classList.remove("empty");$("#createResult").textContent=x.content;$("#generationStatus").textContent="来自内容库"}
$("#librarySearch").oninput=renderLibrary;$("#clearLibrary").onclick=()=>{if(confirm("确定清空全部内容吗？")){state.library=[];save();renderLibrary();renderRecent();updateKpis()}};renderLibrary();renderRecent();

function renderPlans(){$("#plans").innerHTML=state.plans.length?state.plans.map(x=>`<div class="row"><b>${escapeHtml(x.date)}</b><span>${escapeHtml(x.topic)}<small>${escapeHtml(x.platform)}</small></span><span>${escapeHtml(x.status)}</span><button class="danger" data-plan-delete="${x.id}">删除</button></div>`).join(""):'<p class="muted">还没有计划，点击右上角添加。</p>';$$("[data-plan-delete]").forEach(b=>b.onclick=()=>{state.plans=state.plans.filter(x=>x.id!==+b.dataset.planDelete);save();renderPlans();updateKpis()})}
$("#addPlan").onclick=()=>{const date=prompt("发布日期和时间，例如：周五 20:00");if(!date)return;const topic=prompt("内容主题");if(!topic)return;const platform=prompt("发布平台，例如：小红书 + TikTok")||"小红书";state.plans.push({id:Date.now(),date,topic,platform,status:"待发布"});save();renderPlans();updateKpis()};renderPlans();

function loadSettings(){const s=state.settings;$("#setName").value=s.name;$("#setCity").value=s.city;$("#setRestaurant").value=s.restaurant;$("#setCuisine").value=s.cuisine;$("#setPlatforms").value=s.platforms;$("#setStyle").value=s.style;$("#setMemory").value=s.memory}
loadSettings();$("#saveSettings").onclick=()=>{state.settings={name:$("#setName").value||"小翠",city:$("#setCity").value||"Birmingham",restaurant:$("#setRestaurant").value,cuisine:$("#setCuisine").value,platforms:$("#setPlatforms").value,style:$("#setStyle").value,memory:$("#setMemory").value};save();$("#settingsSaved").textContent="已保存";$("#hello").textContent=`${state.settings.name}，欢迎回来`;setTimeout(()=>$("#settingsSaved").textContent="",1500)};
$("#theme").onclick=()=>{document.body.classList.toggle("dark");$("#theme").textContent=document.body.classList.contains("dark")?"☀":"☾"};
