/* Spotsline · Plan del día por persona en Taller (v1 2026-11-05)
   Se agrega al panel con:  <script src="planificacion-taller.js"></script>  antes de </body> (después de reporte.js si está).
   Amplía Planificación → Asignación: a cada persona se le cargan las tareas del día (orden, pieza, operación, cantidad)
   y va sumando las horas contra la jornada (7 h 35 min netas + horas extra planificadas). */
(function(){
  var JOR=455, INI=6*60, DES_I=10*60+25, DES_F=10*60+50; // jornada neta, inicio, desayuno
  function hm(min){min=Math.round(min);var h=Math.floor(min/60),m=min%60;return h+':'+String(m).padStart(2,'0')}
  function reloj(min){min=Math.round(min);return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0')}
  function fin(desde,dur){var t=desde;if(t<DES_I&&t+dur>DES_I){dur-=DES_I-t;t=DES_F}else if(t>=DES_I&&t<DES_F)t=DES_F;return t+dur}
  function nfx(x){return typeof nf==='function'?nf(x):Math.round(x).toLocaleString('es-AR')}
  function escx(s){return typeof esc==='function'?esc(s):String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  function wo(key){var p=key.split('|');var o=(S.ordenes||[]).find(function(z){return z.id===p[0]});var l=o&&o.lineas.find(function(z){return z.pieza===p[1]});var w=l&&l.ops.find(function(z){return z.seq==p[2]});return {o:o,l:l,w:w}}
  function txtDe(key){var r=wo(key);return r.o?('OP '+r.o.numero+' '+r.o.articulo+' · '+r.l.pieza+' · paso '+r.w.seq+' ('+r.w.op+')'):key}
  function faltaDe(key){var r=wo(key);if(!r.w)return 0;var p=S.prog&&S.prog.get?S.prog.get(woKey(r.o.id,r.l.pieza,r.w.seq)):null;return Math.max(0,r.l.cant-(p?p.qty:0))}

  function init(){
    if(typeof ASG==='undefined'||ASG.__plan) return !!(typeof ASG!=='undefined');
    ASG.__plan=true;
    var render0=ASG.render, filas0=ASG.filas;

    ASG.tareas=function(pid){var x=this.it(pid);x.tareas=x.tareas||[];return x.tareas};
    ASG.planOtros=function(key,pid,idx){var s=0;for(var k in this.d.items){var t=this.d.items[k].tareas||[];if(this.d.items[k].aus)continue;t.forEach(function(z,i){if(z.ord===key&&!(k===pid&&i===idx))s+=+z.qty||0})}return s};
    ASG.calc=function(pid){var x=this.d.items[pid]||{};var T=x.tareas||[];var disp=JOR+(+x.hx||0)*60-(x.hx>0?25:0);var t=INI,used=0;
      var rows=T.map(function(z){var seg=+z.seg||0;var min=seg*(+z.qty||0)/60;var a=t;t=fin(t,min);used+=min;return {z:z,min:min,ini:a,fin:t}});
      return {rows:rows,used:used,disp:disp}};

    ASG.render=function(){
      render0.apply(this,arguments);
      var el=document.getElementById('tpA');if(!el||!this.d)return;
      var self=this,f=this.f,ed=!!S.canPlan,P=this.gente(f).filter(function(p){var x=self.d.items[p.id];if(x&&x.aus)return false;return areaDe(p.id,f)==='taller'||!!(x&&(x.maq||[]).some(function(m){return m&&!self.esSec(m)}))});
      var tot={used:0,disp:0},html=P.map(function(p){
        var x=self.d.items[p.id]||{maq:[]};var maqs=(x.maq||[]).filter(function(m){return m&&!self.esSec(m)});
        var C=self.calc(p.id);tot.used+=C.used;tot.disp+=C.disp;var pct=C.disp?C.used/C.disp:0;
        var cls=pct>1.02?'bad':(pct>=0.9?'ok':'');
        var opts=[];maqs.forEach(function(m){workordersFor(centroTipo(m)).forEach(function(w){var k=w.o.id+'|'+w.l.pieza+'|'+w.w.seq;if(opts.some(function(o){return o.k===k}))return;
          var libre=Math.max(0,w.falta-self.planOtros(k,p.id,-1));opts.push({k:k,t:m+' · OP '+w.o.numero+' '+w.o.articulo+' '+w.l.pieza+' paso '+w.w.seq+' ('+w.w.op+') · faltan '+nfx(libre)+(w.w.seg?'':' · sin tiempo'),libre:libre,seg:w.w.seg||0})})});
        var filas=C.rows.map(function(r,i){var z=r.z;var falta=faltaDe(z.ord),otros=self.planOtros(z.ord,p.id,i);var sobra=(+z.qty||0)>Math.max(0,falta-otros);
          return '<tr><td class="note">'+reloj(r.ini)+'–'+reloj(r.fin)+'</td><td>'+escx(z.txt||txtDe(z.ord))+(sobra?' <span class="pill lamp">más de lo que falta ('+nfx(Math.max(0,falta-otros))+')</span>':'')+'</td>'+
            '<td><input type="number" min="0" step="1" data-tq="'+escx(p.id)+'|'+i+'" value="'+(+z.qty||0)+'" '+(ed?'':'disabled')+' style="width:90px"></td>'+
            '<td>'+(z.seg?hm(r.min)+' h':'<span class="pill bad">sin tiempo</span>')+'</td><td>'+(ed?'<button class="btn link" data-tu="'+escx(p.id)+'|'+i+'" title="Subir">↑</button><button class="btn link" data-tx="'+escx(p.id)+'|'+i+'">quitar</button>':'')+'</td></tr>'}).join('');
        var add=ed?(maqs.length?(opts.length?'<select data-ta="'+escx(p.id)+'" style="min-width:260px;max-width:520px"><option value="">+ Agregar tarea…</option>'+opts.map(function(o){return '<option value="'+escx(o.k)+'">'+escx(o.t)+'</option>'}).join('')+'</select>':'<span class="note">No hay órdenes pendientes para '+escx(maqs.join(' / '))+'</span>'):'<span class="note">Asignale primero una máquina</span>'):'';
        return '<div class="ptl"><div class="row" style="justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><b>'+escx(p.nombre)+'</b> <span class="note">'+escx(maqs.join(' + ')||'sin máquina')+'</span></div>'+
          '<div class="row" style="gap:10px;align-items:center"><label class="note" style="display:inline-flex;gap:4px;align-items:center">Horas extra <input type="number" min="0" max="6" step="1" data-th="'+escx(p.id)+'" value="'+(+x.hx||0)+'" '+(ed?'':'disabled')+' style="width:56px"></label>'+
          '<span class="pill '+cls+'" style="font-size:13px"><b>'+hm(C.used)+'</b> de '+hm(C.disp)+' h</span></div></div>'+
          '<div class="ptlbar"><i style="width:'+Math.min(100,pct*100).toFixed(1)+'%;background:'+(pct>1.02?'#c43f2c':pct>=0.9?'#1d8753':'#b07a00')+'"></i></div>'+
          (filas?'<table class="asg" style="margin-top:6px"><tr><th>Horario</th><th>Tarea</th><th>Cantidad</th><th>Horas</th><th></th></tr>'+filas+'</table>':'')+
          '<div style="margin-top:6px">'+add+'</div></div>'}).join('');
      var box=document.createElement('div');box.className='panel';box.id='ptlBox';
      box.innerHTML='<style>.ptl{border:1px solid var(--line,#dedad0);border-radius:10px;padding:10px 12px;margin:8px 0}.ptlbar{height:8px;background:#ece8df;border-radius:5px;overflow:hidden;margin-top:6px}.ptlbar i{display:block;height:100%}</style>'+
        '<div class="row" style="justify-content:space-between;align-items:flex-end"><h3 style="margin:0">Plan del día por persona · Taller</h3><span class="note">Total planificado <b>'+hm(tot.used)+'</b> de '+hm(tot.disp)+' h ('+(tot.disp?Math.round(tot.used/tot.disp*100):0)+'%)</span></div>'+
        '<p class="note" style="margin:6px 0">Elegí las tareas de cada persona en orden: la cantidad propuesta es lo que falta de la orden y entra en su jornada (7 h 35 min netas, de 06:00 a 14:00 con desayuno de 10:25 a 10:50). Las horas salen del tiempo por pieza de la ruta. Se guarda con el botón Guardar de arriba.</p>'+html;
      el.appendChild(box);
      var mark=function(){self.sucio=true};
      box.querySelectorAll('[data-ta]').forEach(function(s){s.onchange=function(){if(!s.value)return;var pid=s.dataset.ta,k=s.value;var r=wo(k);var C=self.calc(pid);var libre=Math.max(0,faltaDe(k)-self.planOtros(k,pid,-1));var seg=(r.w&&r.w.seg)||0;
        var q=libre;if(seg>0){var cabe=Math.floor(Math.max(0,C.disp-C.used)*60/seg);if(cabe>0)q=Math.min(libre,cabe)}
        self.tareas(pid).push({ord:k,txt:txtDe(k),qty:q,seg:seg});mark();self.render()}});
      box.querySelectorAll('[data-tq]').forEach(function(i){i.onchange=function(){var a=i.dataset.tq.split('|');self.tareas(a[0])[+a[1]].qty=Math.max(0,Math.round(+i.value||0));mark();self.render()}});
      box.querySelectorAll('[data-tx]').forEach(function(b){b.onclick=function(){var a=b.dataset.tx.split('|');self.tareas(a[0]).splice(+a[1],1);mark();self.render()}});
      box.querySelectorAll('[data-tu]').forEach(function(b){b.onclick=function(){var a=b.dataset.tu.split('|'),T=self.tareas(a[0]),i=+a[1];if(i>0){var z=T[i];T[i]=T[i-1];T[i-1]=z;mark();self.render()}}});
      box.querySelectorAll('[data-th]').forEach(function(i){i.onchange=function(){self.it(i.dataset.th).hx=Math.max(0,Math.round(+i.value||0));mark();self.render()}});
    };

    ASG.guardar=async function(){if(busy('#asSave'))return;try{var items={};for(var k in this.d.items){var v=this.d.items[k];var T=(v.tareas||[]).filter(function(z){return z.ord&&(+z.qty||0)>0});
        if(v.aus||(v.maq||[]).some(Boolean)||v.obs||v.ord||T.length||v.hx){var it={maq:(v.maq||[]).filter(Boolean),obs:v.obs||'',aus:!!v.aus};if(v.ord){it.ord=v.ord;it.ordTxt=v.ordTxt||''}if(T.length)it.tareas=T.map(function(z){return {ord:z.ord,txt:z.txt||'',qty:+z.qty,seg:+z.seg||0}});if(+v.hx)it.hx=+v.hx;items[k]=it}}
      var doc={fecha:this.f,items:items,actualizado:new Date().toISOString(),por:(typeof quienSoy==='function'?((quienSoy()||{}).quien||''):'')};await S.db.doc('asignacion/'+this.f).set(doc);this.d=JSON.parse(JSON.stringify(doc));this.sucio=false;toast('Asignación guardada');this.render()}
      catch(e){toast('No se pudo guardar')}finally{done('#asSave')}};

    ASG.filas=function(){var self=this,P=this.gente(this.f),R=filas0.apply(this,arguments);
      return R.map(function(r){var p=P.find(function(z){return z.nombre===r.nombre});if(!p||r.aus)return r;var C=self.calc(p.id);if(!C.rows.length)return r;
        var t=C.rows.map(function(x){return reloj(x.ini)+'–'+reloj(x.fin)+' '+(x.z.txt||txtDe(x.z.ord)).replace(/ · paso \d+/,'')+' × '+nfx(x.z.qty)}).join(' / ');
        r.obs=[t,'Total '+hm(C.used)+' de '+hm(C.disp)+' h',r.obs||''].filter(Boolean).join(' · ');return r})};
    if(document.getElementById('tpA')&&ASG.d) ASG.render();
    return true;
  }
  if(!init()){var n=0,iv=setInterval(function(){if(init()||++n>60)clearInterval(iv)},500)}
})();
