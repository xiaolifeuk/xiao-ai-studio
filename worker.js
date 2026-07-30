const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
function systemPrompt(body){
 const base=`你是 Xiao AI Studio 3.6.3 Results First 的内容创作AI。用户主要在英国生活，创作小红书和 TikTok 内容。请使用自然、真实、生活化、可直接复制发布的中文。不要展示分析过程，不要输出“已知事实、合理推测、需要核实”等分析章节。不要编造图片或素材中没有的价格、地址、优惠、体验、数据或经历；无法确认的信息直接省略，必要时只用一句简短的“发布前请核对价格/活动时间”。品牌资料：${body.context||"未提供"}`;
 const prompts={
  command:`你是运营总指挥。目标：${body.goal}；方向：${body.area}；目标类型：${body.target}；素材/限制：${body.extra||"无"}。输出：①一句话决策 ②判断依据 ③今天立刻做的3步 ④完成标准 ⑤下一步 ⑥风险与待核实。不要给互相冲突的方案。`,
  create:`请直接交付最终成品，不解释你如何识别图片，也不要输出分析、推测或核实清单。内容类型：${body.type}；补充素材：${body.topic}；语言：${body.language}；风格：${body.tone}；目标：${body.goal}；额外要求：${body.extra||"无"}。用户上传了 ${(body.images||[]).length} 张内容图片，请综合所有图片中清晰可见的信息创作。输出只保留以下两部分：

【小红书内容】
1. 推荐标题1个
2. 备用标题2个
3. 可直接发布的完整正文（自然分段，适量emoji）
4. 8—12个相关标签
5. 封面主标题和副标题

【短视频脚本】
1. 建议时长
2. 开头3秒钩子
3. 按镜头顺序写完整口播/字幕脚本，明确每个镜头使用哪类图片或画面
4. 结尾互动话术

不要额外输出图片识别过程、运营理论、发布时间、风险提醒或长篇说明。结果要让用户复制后稍作修改即可发布。`,
  analyse:`你是数据AI和运营AI。作品数据：${JSON.stringify(body.metrics||{})}。如有截图，结合截图。先计算能计算的点赞率、收藏率、评论率、总互动率，再只优先选择一个决策：“保留观察 / 修改封面标题 / 补充互动 / 删除重发”。输出：①决策 ②数据事实 ③最大问题排序 ④立刻操作 ⑤新标题与封面 ⑥下一条方案 ⑦多久后再判断。不得承诺流量。`,
  team:`请直接交付可复制使用的最终内容，不展示团队讨论过程。项目目标：${body.goal}；补充素材：${body.material||"无"}；平台：${body.platform||"小红书"}；周期：${body.period||"7天"}；素材概况：${JSON.stringify(body.mediaSummary||{})}。用户上传的图片和从视频中提取的代表画面已附在请求中，请综合清晰可见的信息。输出：①推荐标题1个与备用标题2个 ②可直接发布的完整正文 ③8—12个标签 ④封面主副标题 ⑤完整短视频脚本（建议时长、开头3秒、按镜头顺序的口播/字幕、结尾互动）。不要输出分析过程、团队意见、运营理论或无法确认的信息。`,
  cover:`你是小红书封面策划AI。主题：${body.topic}；受众：${body.audience||"普通用户"}；风格：${body.style||"醒目真实"}；素材：${body.material||"无"}。生成4套封面方案，每套包含：主标题（12字内）、副标题、画面布局、照片选择、字体层级、避免元素、适合的标题。不能声称直接生成图片。`,
  doctor:`你是账号诊断AI。账号信息：${body.profile}；最近内容/数据：${body.posts||"未提供"}；目标：${body.goal||"提高稳定流量"}。输出：账号定位评分、主页问题、内容结构问题、最值得保留的方向、应停止的内容、3个固定栏目、7天修复计划、可量化观察指标。`,
  batch:`你是内容流水线AI。用户素材清单：${body.material}；平台：${body.platform}; 目标：${body.goal}; 数量：${body.count||3}。把素材分组并生成可直接执行的批量方案：每条内容主题、封面文字、标题、内容结构、所需素材、发布顺序、复用方式。不要假装已经修图或发布。`,
  imageStudio:`你是图片识别与隐私检查AI。模式：${body.mode||"analyse"}；用户要求：${body.question||"分析图片"}。如果是OCR，按图片中的可见顺序提取文字，不确定的文字标记为“可能”。检查姓名、地址、电话、邮箱、订单号、会员号、二维码、条形码、票据编号等隐私，并明确建议遮挡的位置。若是图片分析，评价清晰度、构图、光线、配色、封面信息层级和社交媒体适配度，给出具体修改步骤。不要猜测看不清的内容。`
 };
 return `${base}\n\n${prompts[body.task]||"请帮助用户完成任务。"}`;
}
function outputText(data){if(data.output_text)return data.output_text;return (data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n")}
export default{async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==="/api/status")return json({configured:Boolean(env.OPENAI_API_KEY),model:env.OPENAI_MODEL||"gpt-5-mini",version:"3.6.3"});
 if(url.pathname==="/api/image-generate"){
  if(request.method!=="POST")return json({error:"只支持 POST 请求"},405);
  if(!env.OPENAI_API_KEY)return json({error:"尚未配置 OPENAI_API_KEY"},503);
  let body;try{body=await request.json()}catch{return json({error:"请求格式不正确"},400)}
  if(!body.prompt)return json({error:"请输入图片描述"},400);
  try{const r=await fetch("https://api.openai.com/v1/images/generations",{method:"POST",headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:env.OPENAI_IMAGE_MODEL||"gpt-image-1",prompt:`为 Xiao AI Studio 创作一张适合社交媒体使用的图片。${body.prompt}`,size:body.ratio==="9:16"?"1024x1536":body.ratio==="16:9"?"1536x1024":"1024x1024"})});const data=await r.json();if(!r.ok)return json({error:data?.error?.message||"图片生成失败"},r.status);const b64=data?.data?.[0]?.b64_json;if(!b64)return json({error:"没有返回图片"},502);return json({image:`data:image/png;base64,${b64}`})}catch(e){return json({error:"连接图片生成服务失败："+e.message},502)}
 }


 if(url.pathname==="/api/script-scenes"){
  if(request.method!=="POST")return json({error:"只支持 POST 请求"},405);
  if(!env.OPENAI_API_KEY)return json({error:"尚未配置 OPENAI_API_KEY"},503);
  let body;try{body=await request.json()}catch{return json({error:"请求格式不正确"},400)}
  const script=String(body.script||"").trim();if(!script)return json({error:"请输入脚本"},400);
  const count=Math.min(10,Math.max(2,Number(body.count)||6));
  const prompt=`把下面脚本拆成 ${count} 个视觉镜头。风格：${body.style||"电影感写实"}；比例：${body.ratio||"9:16"}；统一人物和场景设定：${body.character||"根据脚本合理保持一致"}。只返回严格 JSON，不要 markdown：{"scenes":[{"title":"镜头标题","duration":"建议秒数","visual":"镜头中发生的事情","prompt":"可直接用于图像和视频生成的详细中文提示词"}]}。每个 prompt 必须明确主体、动作、场景、光线、镜头景别和氛围，并保持人物外貌服装一致。脚本：${script}`;
  try{const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",input:prompt,max_output_tokens:2600})});const data=await r.json();if(!r.ok)return json({error:data?.error?.message||"分镜生成失败"},r.status);let text=outputText(data).trim().replace(/^```json\s*/i,"").replace(/```$/,"").trim();let parsed;try{parsed=JSON.parse(text)}catch{return json({error:"AI 返回的分镜格式无法解析，请重试"},502)}return json({scenes:Array.isArray(parsed.scenes)?parsed.scenes.slice(0,count):[]})}catch(e){return json({error:"连接分镜服务失败："+e.message},502)}
 }
 if(url.pathname==="/api/video-generate"){
  if(request.method!=="POST")return json({error:"只支持 POST 请求"},405);
  if(!env.OPENAI_API_KEY)return json({error:"尚未配置 OPENAI_API_KEY"},503);
  let body;try{body=await request.json()}catch{return json({error:"请求格式不正确"},400)}
  const prompt=String(body.prompt||"").trim();if(!prompt)return json({error:"请输入视频描述"},400);
  const ratio=body.ratio||"9:16",size=ratio==="16:9"?"1280x720":ratio==="1:1"?"720x1280":"720x1280";
  const seconds=["4","8","12"].includes(String(body.seconds))?String(body.seconds):"8";
  try{const form=new FormData();form.set("model",env.OPENAI_VIDEO_MODEL||"sora-2");form.set("prompt",prompt);form.set("seconds",seconds);form.set("size",size);const r=await fetch("https://api.openai.com/v1/videos",{method:"POST",headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`},body:form});const data=await r.json();if(!r.ok)return json({error:data?.error?.message||"视频生成任务创建失败"},r.status);return json(data)}catch(e){return json({error:"连接视频生成服务失败："+e.message},502)}
 }
 if(url.pathname==="/api/video-status"){
  if(!env.OPENAI_API_KEY)return json({error:"尚未配置 OPENAI_API_KEY"},503);const id=url.searchParams.get("id");if(!id)return json({error:"缺少视频任务ID"},400);
  try{const r=await fetch(`https://api.openai.com/v1/videos/${encodeURIComponent(id)}`,{headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`}});const data=await r.json();if(!r.ok)return json({error:data?.error?.message||"查询视频失败"},r.status);return json(data)}catch(e){return json({error:"查询视频失败："+e.message},502)}
 }
 if(url.pathname==="/api/video-content"){
  if(!env.OPENAI_API_KEY)return json({error:"尚未配置 OPENAI_API_KEY"},503);const id=url.searchParams.get("id");if(!id)return json({error:"缺少视频任务ID"},400);
  try{const r=await fetch(`https://api.openai.com/v1/videos/${encodeURIComponent(id)}/content`,{headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`}});if(!r.ok){let m="下载视频失败";try{const d=await r.json();m=d?.error?.message||m}catch{}return json({error:m},r.status)}return new Response(r.body,{headers:{"content-type":r.headers.get("content-type")||"video/mp4","content-disposition":"inline; filename=xiao-ai-video.mp4","cache-control":"no-store"}})}catch(e){return json({error:"下载视频失败："+e.message},502)}
 }
 if(url.pathname==="/api/speech"){
  if(request.method!=="POST")return json({error:"只支持 POST 请求"},405);
  if(!env.OPENAI_API_KEY)return json({error:"尚未配置 OPENAI_API_KEY"},503);
  let body;try{body=await request.json()}catch{return json({error:"请求格式不正确"},400)}
  const text=String(body.text||"").trim();
  if(!text)return json({error:"请输入配音文字"},400);
  if(text.length>4096)return json({error:"配音文字不能超过 4096 个字符"},400);
  const allowedVoices=new Set(["alloy","ash","ballad","coral","echo","fable","onyx","nova","sage","shimmer","verse","marin","cedar"]);
  const voice=allowedVoices.has(body.voice)?body.voice:"coral";
  const speed=Math.min(4,Math.max(.25,Number(body.speed)||1));
  try{
   const r=await fetch("https://api.openai.com/v1/audio/speech",{method:"POST",headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:env.OPENAI_TTS_MODEL||"gpt-4o-mini-tts",input:text,voice,speed,response_format:"mp3",instructions:String(body.style||"使用自然、清晰的中文表达。")})});
   if(!r.ok){let message="配音生成失败";try{const d=await r.json();message=d?.error?.message||message}catch{}return json({error:message},r.status)}
   return new Response(r.body,{status:200,headers:{"content-type":"audio/mpeg","content-disposition":"inline; filename=xiao-ai-voice.mp3","cache-control":"no-store"}});
  }catch(e){return json({error:"连接配音服务失败："+e.message},502)}
 }
 if(url.pathname==="/api/ai"){
  if(request.method!=="POST")return json({error:"只支持 POST 请求"},405);
  if(!env.OPENAI_API_KEY)return json({error:"尚未配置 OPENAI_API_KEY，请在 Cloudflare Variables and Secrets 中添加。"},503);
  let body;try{body=await request.json()}catch{return json({error:"请求格式不正确"},400)}
  if(JSON.stringify(body).length>12_000_000)return json({error:"上传内容过大"},413);
  const content=[{type:"input_text",text:systemPrompt(body)}];
  const images=Array.isArray(body.images)?body.images.slice(0,20):(body.image?[body.image]:[]);
  for(const image of images){if(typeof image==="string"&&image.startsWith("data:image/"))content.push({type:"input_image",image_url:image});}
  try{
   const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",input:[{role:"user",content}],max_output_tokens:3200})});
   const data=await r.json();if(!r.ok)return json({error:data?.error?.message||"OpenAI 请求失败"},r.status);return json({text:outputText(data)});
  }catch(e){return json({error:"连接 OpenAI 失败："+e.message},502)}
 }
 return env.ASSETS.fetch(request);
}};
