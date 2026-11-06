/* Spotsline · Botón "Generar reporte" del avance semanal del premio (v3 2026-11-06)
   Se agrega al panel con:  <script src="reporte.js"></script>  antes de </body>.
   Usa los datos en vivo del panel (GR.calc) y abre una hoja lista para imprimir / guardar en PDF. */
(function(){
  var PISO=0.6611, N1=1.2, N2=1.35, N3=1.5;
  var DS=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  function f0(x){return Math.round(x).toLocaleString('es-AR')}
  function d(f){var p=f.split('-');return new Date(+p[0],p[1]-1,+p[2])}
  function lab(f){var x=d(f);return DS[x.getDay()]+' '+String(x.getDate()).padStart(2,'0')+'/'+String(x.getMonth()+1).padStart(2,'0')}

  function datos(){
    var c=GR.calc(); var rows=(c.W&&c.W.rows||[]).map(function(r){return {f:r.f,u:+r.u||0,obj:+r.obj||0}}).filter(function(r){return r.obj>0||r.u>0}); // feriados (objetivo 0) no cuentan
    if(!rows.length) throw new Error('No hay días cargados en la semana.');
    var hoy=c.hoy, R=rows.filter(function(r){return r.f===hoy})[0], cerrado;
    var objDia, objNow;
    if(!R){ // fin de semana o fuera de la semana: tomar el último día pasado como cerrado
      var pas=rows.filter(function(r){return r.f<=hoy}); R=pas[pas.length-1]||rows[0]; hoy=R.f; cerrado=true; objDia=R.obj; objNow=R.obj;
    } else { objDia=R.obj||1; objNow=Math.min(+c.objNow||0,objDia); cerrado=objNow>=objDia-0.01; }
    var usHoy=R.u;
    var sum=function(a,fn){return a.filter(fn).reduce(function(s,r){return s+r.u},0)};
    var U1=rows.reduce(function(s,r){return s+r.obj},0), U2=U1*N2/N1, U3=U1*N3/N1;
    var base=PISO*N1*25*455/8.5, xtra=U1-base*rows.length; // rows ya sin feriados
    var hechas=sum(rows,function(r){return r.f<=hoy});
    var prev=sum(rows,function(r){return cerrado?r.f<=hoy:r.f<hoy});
    var diasR=rows.filter(function(r){return cerrado?r.f>hoy:r.f>=hoy}).length;
    var need1=diasR?Math.max(0,(U1-prev)/diasR):0, need2=diasR?Math.max(0,(U2-prev)/diasR):0;
    var metaDe=function(f){var ant=sum(rows,function(z){return z.f<f});var n=rows.filter(function(z){return z.f>=f}).length;return Math.max(0,(U1-ant)/n)};
    var meta=metaDe(hoy), metaNow=meta*objNow/objDia, okHoy=usHoy>=metaNow-0.01;
    var objA=rows.filter(function(r){return r.f<hoy}).reduce(function(s,r){return s+r.obj},0)+objNow;
    return {rows:rows,hoy:hoy,t:+c.t||0,cerrado:cerrado,usHoy:usHoy,meta:meta,metaNow:metaNow,okHoy:okHoy,U1:U1,U2:U2,U3:U3,xtra:xtra,
      hechas:hechas,objA:objA,dif:hechas-objA,need1:need1,need2:need2,diasR:diasR,metaDe:metaDe};
  }

  function svg(D){
    var rows=D.rows, W=760,H=330,L=50,B=295,T=22, mxv=Math.max.apply(null,rows.map(function(r){return r.u}).concat([D.need1]));
    var mx=Math.max(1500,(Math.floor(mxv*1.08/250)+1)*250), y=function(v){return B-(B-T)*v/mx};
    var n=rows.length, bw=Math.min(96,(W-L-10)/n*0.7), gap=(W-L-10-n*bw)/n, s=['<svg viewBox="0 0 '+W+' '+H+'" class="chart">'];
    for(var v=0;v<=mx;v+=500) s.push('<line x1="'+L+'" x2="'+(W-10)+'" y1="'+y(v)+'" y2="'+y(v)+'" class="grid"/><text x="'+(L-8)+'" y="'+(y(v)+4)+'" class="ax" text-anchor="end">'+f0(v)+'</text>');
    rows.forEach(function(r,i){
      var x=L+gap/2+i*(bw+gap), u=r.u, um, cls;
      if(r.f>D.hoy){ um=D.need1;
        s.push('<rect x="'+x+'" y="'+y(um)+'" width="'+bw+'" height="'+(B-y(um))+'" rx="4" class="bar todo"/><text x="'+(x+bw/2)+'" y="'+(y(um)-9)+'" class="val blue" text-anchor="middle">'+f0(um)+'</text>');
      } else {
        um=D.metaDe(r.f);
        if(r.f===D.hoy){ cls=D.okHoy?'ok':'now'; s.push('<rect x="'+x+'" y="'+y(um)+'" width="'+bw+'" height="'+(B-y(um))+'" rx="4" class="bar ghost"/>'); }
        else cls=u>=um?'ok':'bad';
        s.push('<rect x="'+x+'" y="'+y(u)+'" width="'+bw+'" height="'+(B-y(u))+'" rx="4" class="bar '+cls+'"/>');
        var inv=B-y(u)>30; s.push('<text x="'+(x+bw/2)+'" y="'+(inv?y(u)+20:y(u)-7)+'" class="val'+(inv?' inv':'')+'" text-anchor="middle">'+f0(u)+'</text>');
      }
      s.push('<line x1="'+(x-6)+'" x2="'+(x+bw+6)+'" y1="'+y(um)+'" y2="'+y(um)+'" class="umb"/>');
      s.push('<text x="'+(x+bw/2)+'" y="'+(B+20)+'" class="ax lbl" text-anchor="middle">'+lab(r.f)+(r.f===D.hoy?' · HOY':'')+'</text>');
    });
    s.push('<line x1="'+L+'" x2="'+(W-10)+'" y1="'+B+'" y2="'+B+'" class="base"/></svg>');
    return s.join('');
  }

  var CSS='@page{size:A4;margin:12mm}*{box-sizing:border-box}body{margin:0;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#1b1a17;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.bar0{display:flex;gap:8px;justify-content:flex-end;margin-bottom:10px}.bar0 button{font:700 12pt Inter,Arial,sans-serif;padding:8px 16px;border-radius:8px;border:0;background:#1b1a17;color:#fff;cursor:pointer}.bar0 button.s{background:#e6e2d8;color:#1b1a17}@media print{.bar0{display:none}}'+
  '.pg{max-width:186mm;margin:0 auto}'+
  '.top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #1b1a17;padding-bottom:6px}h1{margin:0;font-size:24pt}.sub{color:#555;font-size:11pt;margin-top:2px}.stamp{font-size:10pt;color:#555;text-align:right;white-space:nowrap}'+
  '.duo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.box{border-radius:14px;padding:14px 18px;color:#fff}.box.ok{background:#1d8753}.box.bad{background:#c43f2c}'+
  '.box .k{font-size:10pt;letter-spacing:.1em;text-transform:uppercase;font-weight:700;opacity:.9}.box .big{font-size:44pt;font-weight:800;line-height:1.05}.box .big small{font-size:.34em;font-weight:700;white-space:nowrap}'+
  '.box .row{display:flex;justify-content:space-between;font-size:12pt;margin-top:4px}.box .row b{font-size:14pt}.box .st{font-size:15pt;font-weight:800;margin-top:6px;border-top:1px solid rgba(255,255,255,.45);padding-top:6px;display:flex;justify-content:space-between}'+
  '.need{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}.nd{border:2px solid #dedad0;border-radius:12px;padding:10px 14px}.nd.l1{border-color:#1d8753;background:#e3f2ea}.nd.l2{border-color:#2563c4;background:#eef3fb}'+
  '.nd .l{font-size:9pt;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:#555}.nd .v{font-size:30pt;font-weight:800;line-height:1.1}.nd .v small{font-size:.4em}.nd .n{font-size:10pt;color:#444}'+
  'h2{font-size:10.5pt;letter-spacing:.08em;text-transform:uppercase;margin:10px 0 4px}.chart{width:100%;display:block}.grid{stroke:#e6e2d8}.base{stroke:#1b1a17;stroke-width:1.5}.ax{font:9pt Inter,Arial,sans-serif;fill:#686458}.ax.lbl{font-weight:700;fill:#1b1a17;font-size:10pt}'+
  '.bar.ok{fill:#1d8753}.bar.bad{fill:#d9a441}.bar.now{fill:#c43f2c}.bar.ghost{fill:#f1eee6}.bar.todo{fill:#fff;stroke:#2563c4;stroke-width:2;stroke-dasharray:6 4}'+
  '.umb{stroke:#1b1a17;stroke-width:2.5;stroke-dasharray:6 4}.val{font:800 12pt Inter,Arial,sans-serif;fill:#1b1a17}.val.inv{fill:#fff}.val.blue{fill:#2563c4}'+
  '.legend{display:flex;gap:14px;font-size:9pt;color:#555;flex-wrap:wrap}.legend i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:5px;vertical-align:-2px}'+
  '.ladder{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lv{border:2px solid #dedad0;border-radius:10px;padding:8px 12px}.lv b{display:block;font-size:11pt}.lv span{display:block;font-size:20pt;font-weight:800;line-height:1.15}.lv span small{font-size:.5em}'+
  '.lv em{display:block;font-style:normal;font-size:10pt;color:#c43f2c;font-weight:700}.lv em.ok{color:#1d8753}.lv i{display:block;font-style:normal;font-size:9pt;color:#686458}.foot{font-size:8.5pt;color:#686458;margin-top:10px;line-height:1.4}';

  function html(D){
    var r0=D.rows[0].f, r1=D.rows[D.rows.length-1].f, hh=Math.floor(D.t/60), mm=Math.floor(D.t%60), hora=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    var dd=function(f){var x=d(f);return String(x.getDate()).padStart(2,'0')+'/'+String(x.getMonth()+1).padStart(2,'0')};
    var sg=function(v){return (v>=0?'+':'−')+f0(Math.abs(v))};
    var cont=D.cerrado?'':' (contando hoy)', dias=D.diasR===1?'el día que queda':'los '+D.diasR+' días que quedan';
    var lv=[['Nivel 1',D.U1,'$40.000'],['Nivel 2',D.U2,'$50.000'],['Nivel 3',D.U3,'$60.000']].map(function(a){var fa=a[1]-D.hechas;
      return '<div class="lv"><b>'+a[0]+'</b><span>'+f0(a[1])+' <small>US</small></span>'+(fa>0?'<em>faltan '+f0(fa)+' US</em>':'<em class="ok">¡LOGRADO!</em>')+'<i>'+a[2]+'</i></div>'}).join('');
    var needs=D.diasR?('<div class="need"><div class="nd l1"><div class="l">Nivel 1 · objetivo '+f0(D.U1)+' US</div><div class="v">'+f0(D.need1)+' <small>US por día</small></div><div class="n">en '+dias+cont+' · '+(D.xtra>0.5?'incluye +'+f0(D.xtra)+' US por horas extra':'sin horas extra por ahora')+'</div></div>'+
      '<div class="nd l2"><div class="l">Nivel 2 · objetivo '+f0(D.U2)+' US</div><div class="v">'+f0(D.need2)+' <small>US por día</small></div><div class="n">en '+dias+cont+'</div></div></div>'):'';
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Avance diario '+dd(D.hoy).replace('/','-')+'</title>'+
     '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet"><style>'+CSS+'</style></head><body><div class="pg">'+
     '<div class="bar0"><button class="s" onclick="window.close()">Cerrar</button><button onclick="window.print()">Imprimir / Guardar PDF</button></div>'+
     '<div class="top"><div><h1>Avance de la semana</h1><div class="sub">Premio de producción · semana del jueves '+dd(r0)+' al miércoles '+dd(r1)+'</div></div><div class="stamp">Actualizado '+lab(D.hoy)+' · '+hora+' h<br>1 US = 8,5 min estándar</div></div>'+
     '<div class="duo"><div class="box '+(D.okHoy?'ok':'bad')+'"><div class="k">Hoy · '+lab(D.hoy)+'</div><div class="big">'+f0(D.usHoy)+' <small>US de '+f0(D.meta)+' (meta)</small></div>'+
     '<div class="row"><span>'+(D.cerrado?'Meta del día (nivel 1)':'A las '+hora+' había que llevar')+'</span><b>'+f0(D.metaNow)+' US</b></div>'+
     '<div class="st"><span>'+(D.okHoy?'EN CAMINO AL NIVEL 1':'ATRASADOS')+'</span><span>'+sg(D.usHoy-D.metaNow)+' US</span></div></div>'+
     '<div class="box '+(D.dif>=0?'ok':'bad')+'"><div class="k">Semana acumulada</div><div class="big">'+f0(D.hechas)+' <small>US</small></div>'+
     '<div class="row"><span>Objetivo a esta altura</span><b>'+f0(D.objA)+' US</b></div><div class="st"><span>Diferencia</span><span>'+sg(D.dif)+' US</span></div></div></div>'+
     needs+'<h2>Día por día</h2>'+svg(D)+
     '<div class="legend"><span><i style="background:#1d8753"></i>Llegó a la meta del día</span><span><i style="background:#d9a441"></i>No llegó a la meta</span><span><i style="background:#c43f2c"></i>Hoy, por debajo de la meta</span><span><i style="border:2px dashed #2563c4"></i>Lo que hay que hacer para el nivel 1</span><span><i style="border-top:2.5px dashed #1b1a17;height:0;vertical-align:3px"></i>Meta del día: lo que hacía falta por día para llegar al nivel 1</span></div>'+
     '<h2>Niveles de la semana</h2><div class="ladder">'+lv+'</div>'+
     '<div class="foot">Objetivo con 25 personas y las horas extra cargadas en el panel (Día en planta). Las faltas no cambian el objetivo. Si hay horas extra, el objetivo del día sube en proporción.</div>'+
     '</div></body></html>';
  }

  function generar(){
    var D; try{D=datos()}catch(e){alert('No pude armar el reporte: '+e.message);return}
    var h=html(D), w=window.open('','_blank');
    if(!w){alert('El navegador bloqueó la ventana del reporte. Permití las ventanas emergentes para este sitio.');return}
    w.document.open(); w.document.write(h); w.document.close();
  }

  function boton(){
    if(document.getElementById('spRepBtn')) return;
    var b=document.createElement('button'); b.id='spRepBtn'; b.type='button'; b.textContent='Generar reporte';
    b.title='Avance de la semana del premio, listo para imprimir';
    b.style.cssText='position:fixed;right:18px;bottom:18px;z-index:9999;font:700 14px Inter,Arial,sans-serif;padding:11px 18px;border-radius:999px;border:0;background:#1d8753;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;display:none';
    b.onclick=generar; document.body.appendChild(b);
    // solo en Planta en vivo → pestaña "Objetivo"
    var vis=function(){var t=document.querySelector('button[data-ps="grat"]');
      var ok=typeof GR!=='undefined'&&GR.calc&&/^#planta/.test(location.hash)&&t&&t.classList.contains('on')&&t.offsetParent!==null;
      b.style.display=ok?'block':'none'};
    vis(); window.addEventListener('hashchange',vis); document.addEventListener('click',function(){setTimeout(vis,50)},true); setInterval(vis,1000);
  }
  window.SPReporte={generar:generar,datos:datos,html:html};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boton); else boton();
})();
