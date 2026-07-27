const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
function systemPrompt(body){
 const base=`你是 Xiao AI Studio 的创作者助理。用户是一位居住在英国的中文创作者，也可能经营餐馆。请使用自然、真实、可直接使用的语言，不要编造用户没有提供的价格、地址、活动、数据或亲身经历。对英国法律、驾照、医疗、宠物健康等高风险或会变化的信息，明确提醒用户发布前核对官方信息。避免夸张营销和虚假承诺。${body.context||""}`;
 const map={
 create:`任务：根据用户资料生成${body.type||"社交媒体"}内容。主题：${body.topic}。风格：${body.tone}。语言：${body.language}。额外要求：${body.extra||"无"}。请根据平台输出清楚的小标题，至少包含标题/开场、正文或脚本、封面文字、标签、拍摄建议；如果是多平台套装，分别输出小红书、TikTok、Instagram/Facebook版本。`,
 restaurant:`任务：为餐馆生成宣传套装。素材：${body.topic}。渠道：${body.channel}。目标：${body.goal}。必须区分中文和英文版本，并给出短视频镜头顺序、屏幕字幕和行动号召。不要虚构折扣或菜品信息。`,
 review:`任务：回复顾客评论。原评论：${body.review}。语言：${body.language}。语气：${body.tone}。回复要像真实餐馆经营者，不争辩，不承认未证实的责任；若是投诉，应表达理解、道歉并邀请顾客通过合适渠道联系餐馆解决。`,
 chat:`任务：作为创作者顾问进行对话。请结合背景提供具体、可执行的建议。`,
 analyse:`任务：分析社交媒体作品表现。数据：${JSON.stringify(body.metrics||{})}。请计算可计算的互动率和收藏率，区分事实与推测，分析标题、封面、开头、内容价值和发布时间的可能问题，最后给出下一条内容的具体方案。`
 };
 return `${base}\n\n${map[body.task]||"请帮助用户完成创作任务。"}`;
}
function outputText(data){
 if(data.output_text)return data.output_text;
 return (data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n");
}
export default{
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==="/api/status")return json({configured:Boolean(env.OPENAI_API_KEY),model:env.OPENAI_MODEL||"gpt-5-mini"});
  if(url.pathname==="/api/ai"){
   if(request.method!=="POST")return json({error:"只支持 POST 请求"},405);
   if(!env.OPENAI_API_KEY)return json({error:"尚未配置 OPENAI_API_KEY。请在 Cloudflare Worker 的 Variables and Secrets 中添加。"},503);
   let body;try{body=await request.json()}catch{return json({error:"请求格式不正确"},400)}
   if(JSON.stringify(body).length>12_000_000)return json({error:"上传内容过大"},413);
   const content=[];
   if(body.task==="chat"&&Array.isArray(body.messages)){
    content.push({type:"input_text",text:systemPrompt(body)+"\n\n对话记录：\n"+body.messages.map(m=>`${m.role}: ${m.content}`).join("\n")});
   }else{
    content.push({type:"input_text",text:systemPrompt(body)});
   }
   if(body.image&&typeof body.image==="string"&&body.image.startsWith("data:image/"))content.push({type:"input_image",image_url:body.image});
   try{
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"authorization":`Bearer ${env.OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",input:[{role:"user",content}],max_output_tokens:2200})});
    const data=await r.json();
    if(!r.ok)return json({error:data?.error?.message||"OpenAI 请求失败"},r.status);
    return json({text:outputText(data)});
   }catch(e){return json({error:"连接 OpenAI 失败："+e.message},502)}
  }
  return env.ASSETS.fetch(request);
 }
}