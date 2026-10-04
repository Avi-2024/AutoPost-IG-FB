import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const REPO='Avi-2024/AutoPost-IG-FB';
const OLD_IG_ID='17841424749134562';
const OLD_PAGE_ID='1392360773951187';
const normalize=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const log=m=>console.log(`[aaj-se-better] ${m}`);

export function isApprovedPost(p) {
  const date=p.publish_at?.slice(0,10);
  return p.brand==='aaj-se-better' && p.manual_approved===true && p.ai_visual_used===true && p.source==='original-ai-imagegen' && p.image_urls?.length===6 && p.image_urls.every((url,i)=>url===`https://raw.githubusercontent.com/${REPO}/main/assets/approved/${date}/slide-${i+1}.jpg`);
}
export function selectDuePost(posts,now=new Date()) {
  return posts.filter(p=>isApprovedPost(p) && !p.skipped_at && new Date(p.publish_at)<=now && (!p.verified_at || !p.facebook_post_id || !p.facebook_verified_at)).sort((a,b)=>a.publish_at.localeCompare(b.publish_at))[0];
}
export function validateConfig(env) {
  const missing=['META_ACCESS_TOKEN','IG_USER_ID','FACEBOOK_PAGE_ACCESS_TOKEN','FACEBOOK_PAGE_ID'].filter(key=>!env[key]?.trim() || env[key]==='NOT_CONFIGURED');
  if(missing.length) throw Error(`Missing Aaj Se Better repository secrets: ${missing.join(', ')}.`);
  if(env.IG_USER_ID.trim()===OLD_IG_ID || env.FACEBOOK_PAGE_ID.trim()===OLD_PAGE_ID) throw Error('Build Kar Bro account IDs cannot be used for Aaj Se Better.');
  const handle=(env.EXPECTED_INSTAGRAM_USERNAME||env.BRAND_HANDLE||'aajsebetter').replace(/^@/,'').toLowerCase();
  if(normalize(handle)==='buildkarbro' || normalize(env.EXPECTED_FACEBOOK_PAGE_NAME)==='buildkarbro') throw Error('Build Kar Bro branding cannot be used here.');
  return {igId:env.IG_USER_ID.trim(),pageId:env.FACEBOOK_PAGE_ID.trim(),handle,pageName:env.EXPECTED_FACEBOOK_PAGE_NAME||'Aaj Se Better',igToken:env.META_ACCESS_TOKEN.trim(),pageToken:env.FACEBOOK_PAGE_ACCESS_TOKEN.trim(),fbVersion:env.META_GRAPH_VERSION||'v23.0'};
}
export function assertIgAccount(account,cfg) {
  if(!account.id || String(account.id)!==cfg.igId || !account.username || account.username.toLowerCase()!==cfg.handle) throw Error(`Instagram account mismatch: expected @${cfg.handle} and its configured ID. No post was created.`);
}
export function assertPageAccount(page,cfg) {
  if(String(page.id)!==cfg.pageId || !page.name || normalize(page.name)!==normalize(cfg.pageName)) throw Error(`Facebook Page mismatch: expected ${cfg.pageName} and its configured ID. No post was created.`);
}

async function graph(host,token,pathname,params={},method='GET') {
  const body=new URLSearchParams({...params,access_token:token});
  const url=new URL(host+pathname);
  const response=await fetch(method==='GET'?`${url}?${body}`:url,{method,headers:method==='POST'?{'Content-Type':'application/x-www-form-urlencoded'}:undefined,body:method==='POST'?body:undefined,signal:AbortSignal.timeout(30000)});
  const data=await response.json();
  if(!response.ok || data.error) throw Error(data.error?`${data.error.message} (code=${data.error.code}, subcode=${data.error.error_subcode||'-'})`:`Graph request failed (${response.status})`);
  return data;
}
async function waitContainer(ig,id) {
  for(let i=0;i<24;i++) {
    const status=await ig(`/${id}`,{fields:'status_code,status'});
    if(status.status_code==='FINISHED') return;
    if(['ERROR','EXPIRED'].includes(status.status_code)) throw Error(`Instagram container ${id} is ${status.status_code}.`);
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  throw Error(`Instagram container ${id} is not ready yet.`);
}
async function preflight(post) {
  for(const url of post.image_urls) {
    const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
    if(!response.ok) throw Error(`Generated image unavailable (${response.status}).`);
    const data=Buffer.from(await response.arrayBuffer());
    if(data.length<30000 || data[0]!==255 || data[1]!==216 || data.at(-2)!==255 || data.at(-1)!==217) throw Error('Image is not a complete publishing JPEG. No fallback will be substituted.');
  }
}
export function findRecovery(items,post,attempt,platform) {
  if(!attempt) return null;
  const start=new Date(attempt).getTime()-60000;
  const matches=items.filter(item=>String(platform==='instagram'?item.caption:item.message).trim()===post.caption.trim() && new Date(platform==='instagram'?item.timestamp:item.created_time).getTime()>=start && (platform!=='instagram' || item.media_type==='CAROUSEL_ALBUM'));
  return matches.length===1?matches[0]:null;
}
async function publishIg(post,cfg,ig,save) {
  if(post.instagram_media_id) return;
  const recover=async()=>{
    const data=await ig(`/${cfg.igId}/media`,{fields:'id,caption,timestamp,media_type,permalink,username',limit:'25'});
    const found=findRecovery(data.data||[],post,post.instagram_publish_attempted_at,'instagram');
    if(found) {post.instagram_media_id=found.id;await save();return true;}
    return false;
  };
  if(post.instagram_publish_attempted_at) {
    if(await recover()) return;
    throw Error('Previous Instagram publish has an uncertain result. Check the account before retrying; duplicate publishing is blocked.');
  }
  post.instagram_child_container_ids ||= [];
  for(let i=0;i<6;i++) {
    if(!post.instagram_child_container_ids[i]) {
      const child=await ig(`/${cfg.igId}/media`,{image_url:post.image_urls[i],is_carousel_item:'true'},'POST');
      if(!child.id) throw Error('Instagram did not return a child container ID.');
      post.instagram_child_container_ids[i]=child.id;await save();
    }
    await waitContainer(ig,post.instagram_child_container_ids[i]);
  }
  if(!post.instagram_container_id) {
    const parent=await ig(`/${cfg.igId}/media`,{media_type:'CAROUSEL',children:post.instagram_child_container_ids.join(','),caption:post.caption},'POST');
    if(!parent.id) throw Error('Instagram did not return a carousel container ID.');
    post.instagram_container_id=parent.id;await save();
  }
  await waitContainer(ig,post.instagram_container_id);
  post.instagram_publish_attempted_at=new Date().toISOString();await save();
  try {
    const published=await ig(`/${cfg.igId}/media_publish`,{creation_id:post.instagram_container_id},'POST');
    if(!published.id) throw Error('Instagram publish returned no media ID.');
    post.instagram_media_id=published.id;await save();
  } catch(error) {if(!await recover()) throw error;log('Recovered an Instagram publish from the account feed.');}
}
async function verifyIg(post,cfg,ig,save) {
  const media=await ig(`/${post.instagram_media_id}`,{fields:'id,permalink,username,media_type'});
  if(!media.permalink || media.username?.toLowerCase()!==cfg.handle || media.media_type!=='CAROUSEL_ALBUM') throw Error('Instagram result could not be verified for the expected account and carousel.');
  Object.assign(post,{instagram_permalink:media.permalink,instagram_username:media.username,media_type:media.media_type,verified_at:new Date().toISOString()});await save();
}
async function publishFb(post,cfg,fb,save) {
  if(post.facebook_post_id) return;
  const recover=async()=>{
    const data=await fb(`/${cfg.pageId}/posts`,{fields:'id,message,created_time,permalink_url',limit:'25'});
    const found=findRecovery(data.data||[],post,post.facebook_publish_attempted_at,'facebook');
    if(found) {post.facebook_post_id=found.id;await save();return true;}
    return false;
  };
  if(post.facebook_publish_attempted_at) {
    if(await recover()) return;
    throw Error('Previous Facebook publish has an uncertain result. Check the Page before retrying; duplicate publishing is blocked.');
  }
  post.facebook_photo_ids ||= [];
  for(let i=0;i<6;i++) if(!post.facebook_photo_ids[i]) {
    const photo=await fb(`/${cfg.pageId}/photos`,{url:post.image_urls[i],published:'false'},'POST');
    if(!photo.id) throw Error('Facebook did not return a photo ID.');
    post.facebook_photo_ids[i]=photo.id;await save();
  }
  const params={message:post.caption};post.facebook_photo_ids.forEach((id,i)=>{params[`attached_media[${i}]`]=JSON.stringify({media_fbid:id});});
  post.facebook_publish_attempted_at=new Date().toISOString();await save();
  try {
    const published=await fb(`/${cfg.pageId}/feed`,params,'POST');
    if(!published.id) throw Error('Facebook publish returned no post ID.');
    post.facebook_post_id=published.id;await save();
  } catch(error) {if(!await recover()) throw error;log('Recovered a Facebook publish from the Page feed.');}
}
async function verifyFb(post,cfg,fb,save) {
  if(!String(post.facebook_post_id).startsWith(`${cfg.pageId}_`)) throw Error('Facebook post ID belongs to an unexpected Page.');
  const media=await fb(`/${post.facebook_post_id}`,{fields:'id,permalink_url,message'});
  if(!media.permalink_url || media.message?.trim()!==post.caption.trim()) throw Error('Facebook result could not be verified.');
  Object.assign(post,{facebook_permalink:media.permalink_url,facebook_status:'published',facebook_verified_at:new Date().toISOString(),facebook_page_id:cfg.pageId,facebook_page_name:cfg.pageName});await save();
}
export async function preflightAccounts(env=process.env) {
  const cfg=validateConfig(env);
  const ig=(pathname,params,method)=>graph('https://graph.instagram.com',cfg.igToken,pathname,params,method);
  const fb=(pathname,params,method)=>graph(`https://graph.facebook.com/${cfg.fbVersion}`,cfg.pageToken,pathname,params,method);
  const account=await ig('/me',{fields:'id,username'});assertIgAccount(account,cfg);
  const page=await fb(`/${cfg.pageId}`,{fields:'id,name'});assertPageAccount(page,cfg);
  log(`Verified destination accounts: @${account.username}, Facebook ${page.name}.`);
  return {cfg,ig,fb};
}
export async function publishQueue(env=process.env) {
  const file=env.POSTS_FILE||'posts.json';const posts=JSON.parse(await fs.readFile(file,'utf8'));
  const post=selectDuePost(posts);
  if(!post) {log('No due approved original carousel.');return;}
  if(env.DRY_RUN==='1') {log(`Ready due carousel: ${post.id}; dry run creates no media.`);return;}
  // Verify BOTH accounts before creating any media on either platform.
  const {cfg,ig,fb}=await preflightAccounts(env);
  const save=()=>fs.writeFile(file,JSON.stringify(posts,null,2)+'\n');
  try {
    await preflight(post);
    await publishIg(post,cfg,ig,save);await verifyIg(post,cfg,ig,save);
    await publishFb(post,cfg,fb,save);await verifyFb(post,cfg,fb,save);
    post.published_at ||= new Date().toISOString();delete post.last_error;delete post.failed_at;await save();
    log(`Confirmed ${post.id} on Instagram and Facebook.`);
  } catch(error) {post.last_error=error.message;post.failed_at=new Date().toISOString();await save();throw error;}
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href) (process.argv[2]==='preflight'?preflightAccounts():publishQueue()).catch(error=>{console.error(error.message);process.exitCode=1;});
