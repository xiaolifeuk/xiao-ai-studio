const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
function systemPrompt(body){
 const base=`你是 Xiao AI Studio 3.4 Creator OS 的核心AI。用户主要在英国生活，创作小红书、TikTok、英国生活、英国驾照、购物攻略、餐馆推广和吉娃娃内容。请使用自然、真实、能直接执行的中文。不要编造用户未提供的价格、地址、优惠、数据、经历或平台规则。必须区分“已知事实”“合理推测”“需要核实”。涉及法律、签证、医疗、宠物健康、驾照规则或平台政策时，提醒核对官方来源。品牌资料：${body.context||"未提供"}`;
 const prompts={
  command:`你是运营总指挥。目标：${body.goal}；方向：${body.area}；目标类型：${body.target}；素材/限制：${body.extra||"无"}。输出：①一句话决策 ②判断依据 ③今天立刻做的3步 ④完成标准 ⑤下一步 ⑥风险与待核实。不要给互相冲突的方案。`,
  create:`你是文案、运营、短视频三个AI协作。内容类型：${body.type}；真实素材：${body.topic}；语言：${body.language}；风格：${body.tone}；目标：${body.goal}；额外要求：${body.extra||"无"}。输出完整内容包：3个标题、封面主副标题、开头钩子、正文/口播脚本、图片或镜头顺序、标签、置顶评论、发布时间建议、发布前核对清单。多平台时分别输出。`,
  analyse:`你是数据AI和运营AI。作品数据：${JSON.stringify(body.metrics||{})}。如有截图，结合截图。先计算能计算的点赞率、收藏率、评论率、总互动率，再只优先选择一个决策：“保留观察 / 修改封面标题 / 补充互动 / 删除重发”。输出：①决策 ②数据事实 ③最大问题排序 ④立刻操作 ⑤新标题与封面 ⑥下一条方案 ⑦多久后再判断。不得承诺流量。`,
  team:`你是一个由运营AI、文案AI、数据AI、设计AI、视频AI组成的创作团队。项目目标：${body.goal}；真实素材：${body.material||"无"}；平台：${body.platform||"小红书"}；周期：${body.period||"7天"}。分别给出每个AI的意见，最后由总指挥整合成唯一执行方案，包括内容矩阵、优先级、日程、衡量指标和今日第一步。`,
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
 if(url.pathname==="/api/status")return json({configured:Boolean(env.OPENAI_API_KEY),model:env.OPENAI_MODEL||"gpt-5-mini",version:"3.4"});
 if(url.pathname==="/api/image-generate"){
  if(request.method!=="POST")return json({error:"只支持 POST 请求"},405);
  if(!env.OPENAI_API_KEY)return json({error:"尚未配置 OPENAI_API_KEY"},503);
  let body;try{body=await request.json()}catch{return json({error:"请求格式不正确"},400)}
  if(!body.prompt)return json({error:"请输入图片描述"},400);
  try{const r=await fetch("https://api.openai.com/v1/images/generations",{method:"POST",headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:env.OPENAI_IMAGE_MODEL||"gpt-image-1",prompt:`为 Xiao AI Studio 创作一张适合社交媒体使用的图片。${body.prompt}`,size:"1024x1024"})});const data=await r.json();if(!r.ok)return json({error:data?.error?.message||"图片生成失败"},r.status);const b64=data?.data?.[0]?.b64_json;if(!b64)return json({error:"没有返回图片"},502);return json({image:`data:image/png;base64,${b64}`})}catch(e){return json({error:"连接图片生成服务失败："+e.message},502)}
 }
 if(url.pathname==="/api/ai"){
  if(request.method!=="POST")return json({error:"只支持 POST 请求"},405);
  if(!env.OPENAI_API_KEY)return json({error:"尚未配置 OPENAI_API_KEY，请在 Cloudflare Variables and Secrets 中添加。"},503);
  let body;try{body=await request.json()}catch{return json({error:"请求格式不正确"},400)}
  if(JSON.stringify(body).length>12_000_000)return json({error:"上传内容过大"},413);
  const content=[{type:"input_text",text:systemPrompt(body)}];
  if(body.image&&typeof body.image==="string"&&body.image.startsWith("data:image/"))content.push({type:"input_image",image_url:body.image});
  try{
   const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",input:[{role:"user",content}],max_output_tokens:3200})});
   const data=await r.json();if(!r.ok)return json({error:data?.error?.message||"OpenAI 请求失败"},r.status);return json({text:outputText(data)});
  }catch(e){return json({error:"连接 OpenAI 失败："+e.message},502)}
 }
 return env.ASSETS.fetch(request);
}};
