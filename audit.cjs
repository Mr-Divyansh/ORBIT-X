const fs=require('fs'),path=require('path');
const root=process.cwd();
const skipDirs=new Set(['node_modules','.git','gitrefs','tests','tools','scripts']);
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()){if(skipDirs.has(e.name))continue;walk(path.join(d,e.name),out);}else if(e.name.endsWith('.html'))out.push(path.join(d,e.name));}return out;}
const files=walk(root);
let missing=[],anchors=[],total=0;
for(const f of files){
  const rel=path.relative(root,f).replace(/\\/g,'/');
  const txt=fs.readFileSync(f,'utf8');
  const re=/(?:href|src)\s*=\s*["']([^"']+)["']/gi;let m;
  while((m=re.exec(txt))){
    let ref=m[1].trim(); if(!ref)continue;
    total++;
    const line=txt.slice(0,m.index).split('\n').length;
    if(/^(https?:|mailto:|tel:|javascript:|data:|#)/i.test(ref)){
      if(ref.startsWith('#')){
        const id=ref.slice(1);
        const body=txt.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const scope=(body?body[1]:txt);
        if(id&&!new RegExp('id=["\']'+id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'["\']').test(scope))
          anchors.push(`${rel}:${line} "${ref}"`);
      }
      continue;
    }
    const [p,hash]=ref.split('#');
    const target=path.resolve(path.dirname(f),p);
    if(!fs.existsSync(target)){missing.push(`${rel}:${line} "${ref}"`);continue;}
    if(hash&&fs.statSync(target).isFile()){
      const t=fs.readFileSync(target,'utf8');
      const id=hash;
      if(!new RegExp('id=["\']'+id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'["\']').test(t))
        anchors.push(`${rel}:${line} "${ref}"`);
    }
  }
}
console.log('Files:',files.length,'refs:',total);
console.log('\n== MISSING TARGET ('+missing.length+') ==');
missing.forEach(x=>console.log('  '+x));
console.log('\n== MISSING ANCHOR ('+anchors.length+') ==');
anchors.forEach(x=>console.log('  '+x));
