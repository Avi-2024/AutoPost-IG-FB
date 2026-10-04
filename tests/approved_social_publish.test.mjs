import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {isApprovedPost,selectDuePost,validateConfig,assertIgAccount,assertPageAccount,findRecovery,publishQueue} from '../scripts/approved_social_publish.mjs';

const config={META_ACCESS_TOKEN:'test-instagram-token',IG_USER_ID:'123456',FACEBOOK_PAGE_ACCESS_TOKEN:'test-page-token',FACEBOOK_PAGE_ID:'987654'};
const makePost=(date='2026-10-05')=>({id:`daily-${date}`,publish_at:`${date}T09:00:00+05:30`,brand:'aaj-se-better',manual_approved:true,ai_visual_used:true,source:'original-ai-imagegen',caption:'Unique Aaj Se Better caption',image_urls:Array.from({length:6},(_,i)=>`https://raw.githubusercontent.com/Avi-2024/AutoPost-IG-FB/main/assets/approved/${date}/slide-${i+1}.jpg`)});

test('missing platform credentials fail closed',()=>{
  for(const key of Object.keys(config)) assert.throws(()=>validateConfig({...config,[key]:''}),new RegExp(key));
});
test('Build Kar Bro IDs are rejected even with populated tokens',()=>{
  assert.throws(()=>validateConfig({...config,IG_USER_ID:'17841424749134562'}),/Build Kar Bro/);
  assert.throws(()=>validateConfig({...config,FACEBOOK_PAGE_ID:'1392360773951187'}),/Build Kar Bro/);
});
test('Instagram requires both the expected ID and username',()=>{
  const cfg=validateConfig(config);
  assert.doesNotThrow(()=>assertIgAccount({id:'123456',username:'aajsebetter'},cfg));
  assert.throws(()=>assertIgAccount({id:'123456',username:'buildkarbro'},cfg),/mismatch/);
  assert.throws(()=>assertIgAccount({id:'other',username:'aajsebetter'},cfg),/mismatch/);
});
test('Facebook requires both the expected Page ID and name',()=>{
  const cfg=validateConfig(config);
  assert.doesNotThrow(()=>assertPageAccount({id:'987654',name:'Aaj Se Better'},cfg));
  assert.throws(()=>assertPageAccount({id:'987654',name:'Build Kar Bro'},cfg),/mismatch/);
  assert.throws(()=>assertPageAccount({id:'other',name:'Aaj Se Better'},cfg),/mismatch/);
});
test('legacy overdue entries cannot displace a reviewed original',()=>{
  const old={...makePost('2026-09-11'),source:'aaj-se-better-final-editorial',manual_approved:false};
  const current=makePost();
  assert.equal(selectDuePost([old,current],new Date('2026-10-05T04:00:00Z')),current);
});
test('future posts and skipped posts are not due',()=>{
  assert.equal(selectDuePost([makePost()],new Date('2026-10-05T03:29:59Z')),undefined);
  assert.equal(selectDuePost([{...makePost(),skipped_at:'2026-10-04'}],new Date('2026-10-05T04:00:00Z')),undefined);
});
test('Facebook-only recovery stays eligible and completed posts leave the queue',()=>{
  const partial={...makePost(),instagram_media_id:'ig-post',verified_at:'2026-10-05T03:31:00Z'};
  assert.equal(selectDuePost([partial],new Date('2026-10-05T04:00:00Z')),partial);
  const done={...partial,facebook_post_id:'987654_post',facebook_verified_at:'2026-10-05T03:32:00Z'};
  assert.equal(selectDuePost([done],new Date('2026-10-05T04:00:00Z')),undefined);
});
test('cross-repository and placeholder URLs do not qualify',()=>{
  const p=makePost();assert.equal(isApprovedPost(p),true);
  p.image_urls[0]=p.image_urls[0].replace('AutoPost-IG-FB','buildkarbro');assert.equal(isApprovedPost(p),false);
});
test('Instagram recovery requires exact caption, new timestamp and carousel',()=>{
  const p=makePost(),attempt='2026-10-05T03:30:00Z';
  const media={id:'confirmed',caption:p.caption,timestamp:'2026-10-05T03:30:10Z',media_type:'CAROUSEL_ALBUM'};
  assert.equal(findRecovery([media],p,attempt,'instagram'),media);
  assert.equal(findRecovery([{...media,caption:'other'}],p,attempt,'instagram'),null);
  assert.equal(findRecovery([{...media,timestamp:'2026-10-04T03:30:10Z'}],p,attempt,'instagram'),null);
  assert.equal(findRecovery([{...media,media_type:'IMAGE'}],p,attempt,'instagram'),null);
  assert.equal(findRecovery([media,{...media,id:'duplicate'}],p,attempt,'instagram'),null);
});
test('Facebook recovery rejects ambiguous or unrelated posts',()=>{
  const p=makePost(),attempt='2026-10-05T03:30:00Z';
  const media={id:'987654_confirmed',message:p.caption,created_time:'2026-10-05T03:30:10Z'};
  assert.equal(findRecovery([media],p,attempt,'facebook'),media);
  assert.equal(findRecovery([media,{...media,id:'987654_duplicate'}],p,attempt,'facebook'),null);
});
test('wrong Facebook identity causes no media creation on either platform',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'aaj-account-test-'));const file=path.join(dir,'posts.json');
  await fs.writeFile(file,JSON.stringify([makePost('2026-09-11')]));
  const calls=[];const originalFetch=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{calls.push({url:String(url),method:options?.method||'GET'});return {ok:true,json:async()=>String(url).includes('graph.instagram.com')?{id:'123456',username:'aajsebetter'}:{id:'987654',name:'Build Kar Bro'}};};
  try {await assert.rejects(publishQueue({...config,POSTS_FILE:file}),/Facebook Page mismatch/);assert.equal(calls.length,2);assert.ok(calls.every(call=>call.method==='GET'));}
  finally {globalThis.fetch=originalFetch;await fs.rm(dir,{recursive:true,force:true});}
});
