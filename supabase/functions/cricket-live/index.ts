import { withSupabase } from "jsr:@supabase/server@^1";
const SOURCE = "https://static.espncricinfo.com/rss/livescores.xml";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"apikey, authorization, content-type, x-client-info","Access-Control-Allow-Methods":"GET, OPTIONS"};
let cached = null;
let cachedAt = 0;
let pending = null;
function text(xml,tag) {
 const m=xml.match(new RegExp("<"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)</"+tag+">","i"));
 return (m?.[1]||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").trim();
}
function reply(data,status=200){return Response.json(data,{status,headers:{...cors,"Cache-Control":status===200?"public, max-age=60":"no-store"}});}
async function refresh() {
 const response=await fetch(SOURCE,{signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error("Score provider unavailable");
 const xml=await response.text();
 if(xml.length>256000||!xml.includes("<rss"))throw Error("Invalid score feed");
 const published=text(xml,"pubDate");
 const matches=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,40).map(m=>{
  const score=text(m[1],"title");const link=text(m[1],"link");const id=link.match(/\/match\/(\d+)\.html/)?.[1];
  return id&&score?{id,score,url:"https://www.espncricinfo.com/ci/engine/match/"+id+".html"}:null;
 }).filter(Boolean);
 if(!matches.length)throw Error("No scores returned by provider");
 const time=Date.parse(published);
 cached={source:"ESPNcricinfo",sourceUrl:SOURCE,sourcePublishedAt:Number.isFinite(time)?new Date(time).toISOString():null,retrievedAt:new Date().toISOString(),matches};
 cachedAt=Date.now();return cached;
}
const authenticated=withSupabase({auth:["publishable"]},async(req)=>{
 if(req.method!=="GET")return reply({error:"Method not allowed"},405);
 let failed=false;
 if(!cached||Date.now()-cachedAt>60000){
  try{if(!pending)pending=refresh().finally(()=>{pending=null;});await pending;}catch{failed=true;}
 }
 if(!cached)return reply({error:"Live cricket scores are temporarily unavailable. Please retry shortly."},503);
 const published=Date.parse(cached.sourcePublishedAt||"");
 return reply({...cached,stale:failed||!Number.isFinite(published)||Date.now()-published>600000,providerUnavailable:failed});
});
export default {fetch(req,env,ctx){if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});return authenticated(req,env,ctx);}};
