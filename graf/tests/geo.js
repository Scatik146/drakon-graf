// Геометрическая проверка всех примеров: пересечения хвостов, связей, наложения фигур, выход текста за рамку
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:900}});
await p.goto('file://'+require('path').resolve(__dirname,'../konspekt_v8.html')+'');
const res=await p.evaluate((only)=>{window.DBG=only!=null;
  const NS='http://www.w3.org/2000/svg';const out=[];
  const host=document.createElement('div');document.body.appendChild(host);
  // --- геометрия
  const segX=(a,b,c,d)=>{const o=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
    const d1=o(c,d,a),d2=o(c,d,b),d3=o(a,b,c),d4=o(a,b,d);return d1*d2<0&&d3*d4<0;};
  const inPoly=(pt,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,yi]=P[i],[xj,yj]=P[j];
    if((yi>pt[1])!==(yj>pt[1])&&pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi)c=!c;}return c;};
  const rectPoly=(r,m=0)=>[[r.x+m,r.y+m],[r.x+r.w-m,r.y+m],[r.x+r.w-m,r.y+r.h-m],[r.x+m,r.y+r.h-m]];
  const edges=P=>P.map((q,i)=>[q,P[(i+1)%P.length]]);
  const polyHit=(A,B)=>edges(A).some(([a,b])=>edges(B).some(([c,d])=>segX(a,b,c,d)))||A.some(q=>inPoly(q,B))||B.some(q=>inPoly(q,A));
  const segPoly=(a,b,P)=>edges(P).some(([c,d])=>segX(a,b,c,d))||inPoly(a,P)&&inPoly(b,P);
  const contains=(R,r,t=0.5)=>r.x>=R.x-t&&r.y>=R.y-t&&r.x+r.w<=R.x+R.w+t&&r.y+r.h<=R.y+R.h+t;
  const ptIn=(pt,r,m=0)=>pt[0]>=r.x-m&&pt[0]<=r.x+r.w+m&&pt[1]>=r.y-m&&pt[1]<=r.y+r.h+m;
  EXAMPLES.forEach((e,idx)=>{if(only!=null&&idx!==only)return;const r=render(e.s,680,{strict:true});
    host.innerHTML=`<svg xmlns="${NS}" width="680" height="${Math.ceil(r.h)}" font-family="PT Sans, sans-serif">${r.svg}</svg>`;
    const svg=host.firstChild;const tag=idx+' '+e.g+' / '+e.t;const iss=[];
    const SR=svg.getBoundingClientRect();const box=el=>{const bb=el.getBBox();const m=el.getCTM();return{x:bb.x*m.a+m.e,y:bb.y*m.d+m.f,w:bb.width*m.a,h:bb.height*m.d};};
    const abs=(el,x,y)=>{const m=el.getCTM();const pt=svg.createSVGPoint();pt.x=x;pt.y=y;const r2=pt.matrixTransform(m);return[r2.x,r2.y];};
    // фигуры: прямоугольники (без теней), замкнутые контуры
    const shapes=[];
    svg.querySelectorAll('rect').forEach(el=>{const f=el.getAttribute('fill'),st=el.getAttribute('stroke');
      if(f==='#993300'&&st==='#993300')return; // тень
      shapes.push({...box(el),el,kind:'rect',dash:!!el.getAttribute('stroke-dasharray')});});
    const ells=[];svg.querySelectorAll('ellipse').forEach(el=>{if(el.getAttribute('fill')==='none')return;const [cx,cy]=abs(el,+el.getAttribute('cx'),+el.getAttribute('cy'));
      ells.push({cx,cy,rx:+el.getAttribute('rx')-4,ry:+el.getAttribute('ry')-3});});
    svg.querySelectorAll('path').forEach(el=>{if(el.closest('[data-k="tail"]'))return;const d=el.getAttribute('d');
      if(!/Z\s*$/i.test(d)&&el.getAttribute('fill')==='none')return; // открытые — это связи
      if(el.getAttribute('fill')==='none')return;shapes.push({...box(el),el,kind:'path'});});
    // хвосты
    const tails=[...svg.querySelectorAll('[data-k="tail"]')].map(g=>{const d=g.querySelector('path').getAttribute('d');
      const pe=g.querySelector('path');const n=d.match(/-?\d+(\.\d+)?/g).map(Number);const P=[abs(pe,n[0],n[1]),abs(pe,n[2],n[3]),abs(pe,n[4],n[5])];
      return{P,base:[(P[0][0]+P[2][0])/2,(P[0][1]+P[2][1])/2],tip:P[1]};});
    // связи: линии и открытые пути (кроме пунктирных разделителей и линий внутри хвостов)
    const links=[];
    svg.querySelectorAll('line').forEach(el=>{if(el.closest('[data-k="tail"]')||el.getAttribute('stroke-dasharray'))return;
      if(+el.getAttribute('stroke-width')>=2.5&&el.getAttribute('stroke')==='#FFFF99')return;
      links.push([abs(el,+el.getAttribute('x1'),+el.getAttribute('y1')),abs(el,+el.getAttribute('x2'),+el.getAttribute('y2'))]);});
    svg.querySelectorAll('path,polyline').forEach(el=>{if(el.closest('[data-k="tail"]'))return;if(el.getAttribute('fill')!=='none')return;
      const d=el.getAttribute('d')||'';if(!/^M[\d.,-]+(V|H)/.test(d))return; // ломаные стрелки связей
      let cur=null;const pts=[];d.replace(/([MVH])(-?[\d.]+)(?:,(-?[\d.]+))?/g,(m,c,a,b2)=>{if(c==='M')cur=[+a,+b2];else if(c==='V')cur=[cur[0],+a];else cur=[+a,cur[1]];pts.push(cur);});
      for(let i=1;i<pts.length;i++)links.push([abs(el,...pts[i-1]),abs(el,...pts[i])]);});
    // 1) хвост против чужих фигур
    tails.forEach((t,i)=>{const tb={x:Math.min(...t.P.map(q=>q[0])),y:Math.min(...t.P.map(q=>q[1]))};tb.w=Math.max(...t.P.map(q=>q[0]))-tb.x;tb.h=Math.max(...t.P.map(q=>q[1]))-tb.y;
      shapes.forEach(s=>{if(s.dash)return;if(ptIn(t.base,s,2.5)||ptIn(t.tip,s,3))return;if(contains(s,tb,1))return;
        if(!polyHit(t.P,rectPoly(s,1.5))&&polyHit(t.P,rectPoly(s,-4)))iss.push('хвост ближе 4 px к фигуре');
        if(polyHit(t.P,rectPoly(s,1.5)))iss.push('хвост пересекает фигуру'+(window.DBG?` [${s.kind} ${s.x|0},${s.y|0},${s.w|0}x${s.h|0} fill=${s.el.getAttribute('fill')}; tail ${t.base.map(v=>v|0)}→${t.tip.map(v=>v|0)}]`:''));});
      // 2) хвост против хвоста
      tails.forEach((u,j)=>{if(j<=i)return;if(Math.hypot(t.tip[0]-u.tip[0],t.tip[1]-u.tip[1])<4)return;
        const shrink=P=>{const c=[(P[0][0]+P[2][0])/2,(P[0][1]+P[2][1])/2];return[P[0],[P[1][0]+(c[0]-P[1][0])*0.04,P[1][1]+(c[1]-P[1][1])*0.04],P[2]];};
        if(polyHit(shrink(t.P),shrink(u.P)))iss.push('хвосты пересекаются');
        else{const dPS=(q,a,b)=>{const vx=b[0]-a[0],vy=b[1]-a[1];const L2=vx*vx+vy*vy||1;let k=((q[0]-a[0])*vx+(q[1]-a[1])*vy)/L2;k=Math.max(0,Math.min(1,k));return Math.hypot(q[0]-a[0]-k*vx,q[1]-a[1]-k*vy);};
          let md=1e9;const sample=P=>{const o=[];edges(P).forEach(([a,b])=>{for(let k=0;k<=10;k++)o.push([a[0]+(b[0]-a[0])*k/10,a[1]+(b[1]-a[1])*k/10]);});return o;};
          const far=q=>Math.hypot(q[0]-t.tip[0],q[1]-t.tip[1])>14&&Math.hypot(q[0]-u.tip[0],q[1]-u.tip[1])>14;
          sample(t.P).filter(far).forEach(q=>edges(u.P).forEach(([a,b])=>md=Math.min(md,dPS(q,a,b))));
          if(md<3)iss.push('хвосты ближе 3 px');}});
      // 3) хвост против связей и линий
      links.forEach(([a,b2])=>{const near=q=>Math.hypot(q[0]-t.tip[0],q[1]-t.tip[1])<5||ptIn(q,{x:tb.x,y:t.base[1]-3,w:tb.w,h:6},0);
        if(near(a)||near(b2))return;if(segPoly(a,b2,t.P))iss.push('хвост пересекает линию или связь');});
      // 4) пологий длинный хвост
      const dx=Math.abs(t.base[0]-t.tip[0]),dy=Math.abs(t.base[1]-t.tip[1]);if(dx>120&&dx>2.5*dy)iss.push('пологий длинный хвост');});
    // 5) наложение фигур (частичное, не вложение)
    for(let i=0;i<shapes.length;i++)for(let j=i+1;j<shapes.length;j++){const A=shapes[i],B=shapes[j];if(A.dash||B.dash)continue;
      if(contains(A,B,1)||contains(B,A,1))continue;
      const ix=Math.min(A.x+A.w,B.x+B.w)-Math.max(A.x,B.x),iy=Math.min(A.y+A.h,B.y+B.h)-Math.max(A.y,B.y);
      if(ix>2&&iy>2)iss.push('фигуры налезают друг на друга');}
    // 6) текст выходит за свою фигуру
    svg.querySelectorAll('text').forEach(tx=>{const bb0=box(tx);const bb={x:bb0.x,y:bb0.y,width:bb0.w,height:bb0.h};if(!bb.width)return;const c=[bb.x+bb.width/2,bb.y+bb.height/2];
      const ell=ells.find(E=>((c[0]-E.cx)/E.rx)**2+((c[1]-E.cy)/E.ry)**2<1);
      if(ell){const cs=[[bb.x,bb.y+bb.height*0.25],[bb.x+bb.width,bb.y+bb.height*0.25],[bb.x,bb.y+bb.height*0.8],[bb.x+bb.width,bb.y+bb.height*0.8]];
        if(cs.some(q=>((q[0]-ell.cx)/ell.rx)**2+((q[1]-ell.cy)/ell.ry)**2>1.0))iss.push('текст заголовка касается овала: «'+tx.textContent.slice(0,25)+'»');return;}
      const own=shapes.filter(s=>ptIn(c,s,0)).sort((a,b2)=>a.w*a.h-b2.w*b2.h)[0];if(!own)return;
      const tb={x:bb.x,y:bb.y+bb.height*0.2,w:bb.width,h:bb.height*0.6};
      if(!contains(own,tb,1.5))iss.push('текст выходит за рамку: «'+tx.textContent.slice(0,25)+'»');});
    if(iss.length){const cnt={};iss.forEach(q=>cnt[q]=(cnt[q]||0)+1);out.push({idx,tag,iss:cnt});}
  });return out;},process.argv[3]!=null?+process.argv[3]:null);
fs.writeFileSync(process.argv[2]||'geo.json',JSON.stringify(res,null,1));
const sum={};res.forEach(r=>Object.keys(r.iss).forEach(k=>{const kk=k.replace(/: «.*$/,'');sum[kk]=(sum[kk]||0)+1;}));
console.log('Примеров с замечаниями:',res.length);console.log(sum);
res.forEach(r=>console.log(r.tag.slice(0,70),'|',Object.entries(r.iss).map(([k,v])=>k+(v>1?' ×'+v:'')).join('; ')));
await b.close();})();
