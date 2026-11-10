// Offline contract checks. Does not call CricketData or require a real API key.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase/functions/cricket-live/index.ts','utf8').replace(/^import .*;\n/,'').replace('export default {','const exported = {');
const env={CRICKET_DATA_API_KEY:'test-secret',SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'server-test'};
let cache=null,fetches=0,dbFailure=false;
const context=vm.createContext({Response,URLSearchParams,AbortSignal,Date,Map,JSON,Number,Error,Deno:{env:{get:k=>env[k]}},withSupabase:(_opts,fn)=>fn,
 fetch:async(url,opts)=>{
  if(url.includes('/rpc/')){
   if(dbFailure)return new Response('',{status:500});
   if(url.endsWith('cricket_feed_claim'))return Response.json({fetch:!cache,claim:'claim',data:cache});
   cache=JSON.parse(opts.body).p_data;return Response.json(null);
  }
  fetches++;
  return Response.json({status:'success',apikey:'test-secret',info:{totalRows:1},data:[{id:'37c4b752-cba7-474c-a413-45679a2f8927',teams:['A','B'],matchStarted:true,matchEnded:false,dateTimeGMT:'2026-11-10T14:00:00',status:'A batting',score:[{r:100,w:2,o:10,inning:'A'}],apikey:'test-secret'}]});
 }});
vm.runInContext(source,context);
(async()=>{
 const run=code=>vm.runInContext(code,context);
 const fixture="{id:'37c4b752-cba7-474c-a413-45679a2f8927',teams:['A','B']}";
 assert.equal(run(`normalizeMatch(${fixture},'now').status`),'unknown');
 assert.equal(run(`normalizeMatch({...${fixture},matchStarted:'true',matchEnded:false},'now').status`),'unknown');
 assert.equal(run(`normalizeMatch({...${fixture},matchStarted:false,matchEnded:false},'now').status`),'scheduled');
 assert.equal(run(`normalizeMatch({...${fixture},matchEnded:true},'now').status`),'completed');
 assert.equal(run(`normalizeMatch({...${fixture},dateTimeGMT:'2026-11-10'},'now').startsAt`),null);
 let response=await run("authenticated(new Request('https://example.test'))".replace('new Request(\'https://example.test\')',"{method:'GET'}"));
 assert.equal(response.status,200);let body=await response.json();
 assert.equal(body.matches[0].startsAt,'2026-11-10T14:00:00.000Z');
 assert.equal(body.matches[0].status,'live');assert.equal(body.coverage,'complete');
 assert(!JSON.stringify(body).includes('test-secret'));assert(!JSON.stringify(body).includes('server-test'));
 await run("authenticated({method:'GET'})");assert.equal(fetches,1,'Cache must avoid extra upstream requests');
 dbFailure=true;response=await run("authenticated({method:'GET'})");assert.equal(response.status,503);assert.equal(fetches,1,'No upstream fetch when shared quota cache is unavailable');
 response=await run("authenticated({method:'POST'})");assert.equal(response.status,405);
 console.log('CricketData contract checks passed: status, UTC time, privacy, cache reuse, setup failure and HTTP methods.');
})().catch(e=>{console.error(e);process.exitCode=1;});
