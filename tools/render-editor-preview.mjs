import {Resvg} from '@resvg/resvg-js';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {keySvg,PRESET_ICONS,setAppDesign} from '../shared/icons.js';
const design=JSON.parse(readFileSync('app-design.json'));setAppDesign(design);
const ids=['back','palette','quickopen','search','terminal','explorer','scm','commit','push','newterm','run','debug','stop','format','saveall'];
mkdirSync('test-output/preview',{recursive:true});mkdirSync('docs/images',{recursive:true});
for(let f=0;f<72;f++){
 let body='<rect width="790" height="520" rx="24" fill="'+design.background+'"/><text x="28" y="35" font-family="Segoe UI" font-size="21" fill="'+design.ink+'">VS Code · Editor controls</text>';
 for(const [i,id] of ids.entries()){const p=PRESET_ICONS['vsc-'+id];body+='<g transform="translate('+(28+i%5*150)+' '+(60+Math.floor(i/5)*150)+') scale(.9305556)">'+keySvg({...p,style:'app',motion:{kind:'vsc-'+id,phase:f/72}})+'</g>';}
 const bytes=new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="790" height="520">'+body+'</svg>').render().asPng();writeFileSync('test-output/preview/frame-'+String(f).padStart(3,'0')+'.png',bytes);if(!f)writeFileSync('docs/images/deck.png',bytes);
}
console.log('Rendered editor theme and 72 preview frames.');
