import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const dateIST = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const planFile = process.argv[2];
const posts = JSON.parse(await fs.readFile('posts.json','utf8'));
const dates = planFile ? JSON.parse(await fs.readFile(planFile,'utf8')).posts.map(p=>p.date) : [process.env.POST_DATE || dateIST()];
const hashes = new Set();
for (const date of dates) {
  const matches = posts.filter(p=>p.publish_at?.slice(0,10)===date && !p.skipped_at);
  if (matches.length!==1) throw Error(`Expected one ready post for ${date}; prepare the next original batch.`);
  const post = matches[0];
  if (post.brand!=='aaj-se-better' || post.manual_approved!==true || post.ai_visual_used!==true || post.source!=='original-ai-imagegen' || post.image_urls?.length!==6) throw Error(`Post ${date} needs reviewed original AI images; no fallback is allowed.`);
  if (post.publish_at!==`${date}T09:00:00+05:30`) throw Error(`Incorrect time for ${date}`);
  const assets = JSON.parse(await fs.readFile(post.asset_manifest,'utf8')).filter(a=>a.date===date);
  if (assets.length!==6) throw Error(`Missing asset provenance for ${date}`);
  for(let i=0;i<6;i++) {
    const file=`assets/approved/${date}/slide-${i+1}.jpg`;
    const url=`https://raw.githubusercontent.com/Avi-2024/AutoPost-IG-FB/main/${file}`;
    if (post.image_urls[i]!==url) throw Error(`Wrong repository asset for ${date}`);
    const bytes=await fs.readFile(path.resolve(file));
    if(bytes.length<30000 || bytes[0]!==255 || bytes[1]!==216 || bytes.at(-2)!==255 || bytes.at(-1)!==217) throw Error(`Invalid generated JPEG: ${file}`);
    const hash=crypto.createHash('sha256').update(bytes).digest('hex');
    if(assets.find(a=>a.file===file)?.sha256!==hash) throw Error(`Asset hash mismatch: ${file}`);
    if(hashes.has(hash)) throw Error(`Repeated image: ${file}`);
    hashes.add(hash);
  }
  console.log(`Verified ${date}: six original Aaj Se Better AI images, 09:00 IST.`);
}
