import {Resvg} from '@resvg/resvg-js';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {keySvg,PRESET_ICONS,setAppDesign} from '../shared/icons.js';
const design=JSON.parse(readFileSync('app-design.json'));setAppDesign(design);
// Glass is the default look; pass --style=app (or vivid, neon…) to draw another one.
const style=(process.argv.find(a=>a.startsWith('--style='))||'--style=glass').slice(8);
const inner=(svg)=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
const tile=(svg,x,y,s,id)=>`<g transform="translate(${x} ${y}) scale(${s/144})"><clipPath id="${id}"><rect width="144" height="144" rx="16"/></clipPath><g clip-path="url(#${id})">${inner(svg)}</g></g>`;
const pages=[['back','palette','quickopen','search','terminal','explorer','scm','commit','push','copilot','run','debug','stop','saveall','more'],['main','format','quickfix','rename','definition','problems','comment','split','sidebar','panel','pull','newterm','extensions','zen','close']];
mkdirSync('test-output/preview',{recursive:true});mkdirSync('docs/images',{recursive:true});
for(const [pi,ids] of pages.entries())for(let f=0;f<(pi?1:72);f++){
 let body='<rect width="790" height="520" rx="24" fill="#0B0D14"/><text x="28" y="35" font-family="Segoe UI" font-size="21" font-weight="600" fill="#E8EDF6">VS Code · '+(pi?'More':'Editor controls')+'</text>';
 for(const [i,id] of ids.entries()){const p=PRESET_ICONS['vsc-'+id];body+=tile(keySvg({...p,style,motion:{kind:'vsc-'+id,phase:pi?.18:f/72}}),28+i%5*150,60+Math.floor(i/5)*150,134,'p'+i);}
 const bytes=new Resvg('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="790" height="520">'+body+'</svg>',{font:{loadSystemFonts:true}}).render().asPng();if(!pi)writeFileSync('test-output/preview/frame-'+String(f).padStart(3,'0')+'.png',bytes);if(pi||f===13)writeFileSync(pi?'docs/images/page-1.png':'docs/images/deck.png',bytes);
}
// Every look side by side (docs/images/styles.png).
const looks=[['glass','Glass (default)'],['app','VS Code Dark'],['light','VS Code Light'],['vivid','Vivid'],['neon','Neon'],['mono','Mono'],['pro','Pro']].filter(([s])=>s!=='light'||design.light);
const keys=['palette','terminal','scm','commit','push','debug','copilot'],S=110,G=10,L=150,W=L+keys.length*(S+G)+G,H=looks.length*(S+G)+G;
let body=`<rect width="${W}" height="${H}" rx="18" fill="#0B0D14"/>`;
looks.forEach(([st,name],r)=>{body+=`<text x="20" y="${G+r*(S+G)+S/2+6}" fill="#E8EDF6" font-size="16" font-weight="600" font-family="Segoe UI, Arial, sans-serif">${name}</text>`;keys.forEach((id,c)=>{body+=tile(keySvg({...PRESET_ICONS['vsc-'+id],style:st,motion:{kind:'vsc-'+id,phase:.18}}),L+G+c*(S+G),G+r*(S+G),S,`k${r}_${c}`);});});
writeFileSync('docs/images/styles.png',new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}">${body}</svg>`,{font:{loadSystemFonts:true}}).render().asPng());
console.log(`Rendered the editor deck in the ${style} look, 72 preview frames and the styles gallery.`);
