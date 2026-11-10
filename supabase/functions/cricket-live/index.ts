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
// Only normalized public fields may leave this function. Never return raw API responses.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean=(value,max=180)=>typeof value==="string"?value.replace(/[\x00-\x1f]/g," ").slice(0,max).trim():"";
function normalizeMatch(raw,now){
 if(!raw||!UUID.test(raw.id||""))return null;
 const teams=Array.isArray(raw.teams)?raw.teams.slice(0,2).map(v=>clean(v,80)):[];
 if(teams.length!==2||teams.some(v=>!v))return null;
 const innings=(Array.isArray(raw.score)?raw.score:[]).slice(0,4).flatMap(v=>{
  if(!v||!Number.isFinite(v.r)||!Number.isFinite(v.w)||!Number.isFinite(v.o)||v.r<0||v.w<0||v.w>10||v.o<0)return [];
  return [{r:v.r,w:v.w,o:v.o,inning:clean(v.inning,100)}];
 });
 const date=clean(raw.dateTimeGMT,40);
 const time=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(date)?Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(date)?date:date+"Z"):NaN;
 const status=raw.matchEnded===true?"completed":raw.matchStarted===true&&raw.matchEnded===false?"live":raw.matchStarted===false&&raw.matchEnded===false?"scheduled":"unknown";
 return {id:"cricapi:"+raw.id.toLowerCase(),teams,innings,
 score:teams.join(" v ")+(innings.length?" · "+innings.map(v=>v.inning+" "+v.r+"/"+v.w+" ("+v.o+")").join(" · "):""),
 status,statusText:clean(raw.status),statusUpdatedAt:now,
 startsAt:Number.isFinite(time)?new Date(time).toISOString():null,
 competition:clean(raw.seriesName||raw.series?.name,100)||null,
 competitionId:UUID.test(raw.series_id||"")?raw.series_id.toLowerCase():null,
 url:"https://cricketdata.org/cricket-data-formats/matches"};
}
async function cacheRpc(name,args){
 const url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!service)throw Error("Server configuration unavailable");
 const response=await fetch(url+"/rest/v1/rpc/"+name,{method:"POST",
 headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"},
 body:JSON.stringify(args),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error("Shared feed cache unavailable");
 return response.json();
}
const FEED_ERRORS={
 AUTH:"CricketData API key was rejected. Recheck CRICKET_DATA_API_KEY in Supabase Secrets.",
 QUOTA:"CricketData request quota is exhausted. Check API usage in your CricketData dashboard.",
 RESPONSE:"CricketData rejected the request. Check key activation and currentMatches access in its API playground.",
 FORMAT:"CricketData returned an unexpected response format.",
 NETWORK:"CricketData request failed or timed out.",
 STORE:"CricketData responded, but the shared feed cache could not save it. Check the SQL migration.",
 WAIT:"The first CricketData attempt failed or is still running. Retry after the shared 15-minute interval."
};
function providerFailure(raw){
 const hint=[raw?.reason,raw?.error,raw?.message,raw?.info?.reason].filter(v=>typeof v==="string").join(" ");
 return /quota|limit|exceed|hits|credits/i.test(hint)?"QUOTA":/key|unauthori|authentic|invalid.*token/i.test(hint)?"AUTH":"RESPONSE";
}
async function cricketData(key){
 const cacheKey="cricketdata-current-v1";
 const slot=await cacheRpc("cricket_feed_claim",{p_key:cacheKey,p_refresh_seconds:900});
 let data=slot.data,failed=false,failureCode=data?.failureCode||"WAIT",stage="NETWORK";
 if(slot.fetch){
  failureCode="WAIT";
  try{
   const response=await fetch("https://api.cricapi.com/v1/currentMatches?"+new URLSearchParams({apikey:key,offset:"0"}),{signal:AbortSignal.timeout(10000)});
   if(!response.ok){failureCode=response.status===401||response.status===403?"AUTH":response.status===429?"QUOTA":"NETWORK";throw Error("Provider unavailable");}
   stage="FORMAT";
   const body=await response.text();
   if(body.length>1000000)throw Error("Invalid provider response");
   const raw=JSON.parse(body);
   if(raw.status!=="success"){failureCode=providerFailure(raw);throw Error("Provider request failed");}
   if(!Array.isArray(raw.data))throw Error("Invalid provider data");
   const now=new Date().toISOString();
   const matches=[...new Map(raw.data.map(v=>normalizeMatch(v,now)).filter(Boolean).map(v=>[v.id,v])).values()];
   const total=raw.info?.totalRows;
   const complete=Number.isInteger(total)&&total===raw.data.length&&matches.length===raw.data.length;
   data={provider:"cricketdata",source:"CricketData",sourceUrl:"https://cricketdata.org/cricket-data-formats/matches",
    sourcePublishedAt:now,sourceTimestampKind:"retrieved",retrievedAt:now,refreshSeconds:900,
    coverage:complete?"complete":"partial",matches};
   stage="STORE";
   await cacheRpc("cricket_feed_store",{p_key:cacheKey,p_claim:slot.claim,p_data:data});
  }catch{
   failed=true;
   if(failureCode==="WAIT")failureCode=stage;
   if(!slot.data||slot.data.failureCode){
    data={matches:[],failureCode};
    try{await cacheRpc("cricket_feed_store",{p_key:cacheKey,p_claim:slot.claim,p_data:data});}catch{failureCode="STORE";}
   }
  }
 }
 if(!data||data.failureCode)return reply({error:(FEED_ERRORS[failureCode]||FEED_ERRORS.RESPONSE)+" Retry after 15 minutes; refresh does not bypass the quota cache.",code:failureCode},503);
 const age=Date.now()-Date.parse(data.retrievedAt||"");
 return reply({...data,stale:failed||!Number.isFinite(age)||age>180000,providerUnavailable:failed});
}
const authenticated=withSupabase({auth:["publishable"]},async(req)=>{
 if(req.method!=="GET")return reply({error:"Method not allowed"},405);
 const key=Deno.env.get("CRICKET_DATA_API_KEY");
 if(key){try{return await cricketData(key.trim());}catch{return reply({error:"CricketData setup unavailable. Apply the feed SQL migration before deploying this function."},503);}}
 let failed=false;
 if(!cached||Date.now()-cachedAt>60000){
  try{if(!pending)pending=refresh().finally(()=>{pending=null;});await pending;}catch{failed=true;}
 }
 if(!cached)return reply({error:"Live cricket scores are temporarily unavailable. Please retry shortly."},503);
 const published=Date.parse(cached.sourcePublishedAt||"");
 return reply({...cached,stale:failed||!Number.isFinite(published)||Date.now()-published>600000,providerUnavailable:failed});
});
export default {fetch(req,env,ctx){if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});return authenticated(req,env,ctx);}};
