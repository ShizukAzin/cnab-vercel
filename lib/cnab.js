import fs from "fs";

export function onlyDigits(s){
  return String(s||"").replace(/\D/g,"");
}

export function fmtZeros(n,size){
  try{
    return String(parseInt(n)).padStart(size,"0");
  }catch{
    return "0".repeat(size);
  }
}

export function today8(){
  const d=new Date();
  return `${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}${d.getFullYear()}`;
}

export function putAt(str,pos,val,total=240){
  let s=str.padEnd(total," ").slice(0,total);
  return s.slice(0,pos-1)+val+s.slice(pos-1+val.length);
}

export function parseDate(cell){
  if(!cell) return "00000000";

  if(typeof cell==="number"){
    if(cell>=60 && cell<=60000){
      let base=new Date(1899,11,30);
      base.setDate(base.getDate()+cell);
      return formatDate(base);
    }
  }

  if(cell instanceof Date){
    return formatDate(cell);
  }

  let s=String(cell).trim();
  if(!s) return "00000000";

  let digits=s.replace(/\D/g,"");
  if(digits.length===8) return digits;
  if(digits.length===7) return "0"+digits;

  if(s.includes("/")){
    let [d,m,y]=s.split("/");
    if(d&&m&&y) return `${d.padStart(2,"0")}${m.padStart(2,"0")}${y}`;
  }

  return "00000000";
}

function formatDate(d){
  return `${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}${d.getFullYear()}`;
}

export function parseValCentavos(cell){
  if(cell==null) return 0;

  if(typeof cell==="number"){
    return Math.round(cell*100);
  }

  let s=String(cell).trim();
  if(!s) return 0;

  if(s.includes(".")||s.includes(",")){
    return parseInt(s.replace(/[.,]/g,""))||0;
  }

  if(/^\d+$/.test(s)){
    return parseInt(s)*100;
  }

  try{
    return parseInt(s.replace(/[.,]/g,""))||0;
  }catch{
    return 0;
  }
}

export function buildSegmentoD(seq,cmc7,cpf,valor,dt1,dt2,dt3,nome){
  let linha=Array(240).fill(" ");

  function setp(p,txt){
    txt=String(txt);
    for(let i=0;i<txt.length;i++){
      linha[p-1+i]=txt[i];
    }
  }

  setp(1,"756");
  setp(4,"0001");
  setp(8,"3");
  setp(9,String(seq).padStart(5,"0"));
  setp(14,"D");
  setp(16,"01011");

  setp(21,String(cmc7||"").slice(0,30).padEnd(30," "));
  setp(55,"1");

  let num=onlyDigits(cpf||"");
  let doc=num.length<=11?
    num.padStart(14,"0").padEnd(15,"0"):
    num.padStart(15,"0");

  setp(56,doc);
  setp(71,String(valor).padStart(15,"0"));

  setp(86,parseDate(dt1));
  setp(94,parseDate(dt2));
  setp(102,parseDate(dt3));

  setp(144,String(nome||"").slice(0,60).padEnd(60," "));

  return linha.join("").slice(0,240);
}

export function gerarCNAB(data,modeloPath){

  let modelo=fs.readFileSync(modeloPath,"utf8").split("\n");

  let header=putAt(modelo[0],144,today8());
  let headerLote=modelo[1].padEnd(240).slice(0,240);

  let trailerLoteBase=modelo.at(-2).padEnd(240).slice(0,240);
  let trailerArqBase=modelo.at(-1).padEnd(240).slice(0,240);

  let linhas=[header,headerLote];

  let seq=1,total=0;

  let cols=Object.keys(data[0]||{});

  function findCol(names){
    for(let p of names){
      for(let c of cols){
        if(c.toLowerCase().includes(p)) return c;
      }
    }
    return null;
  }

  let col_cmc7=findCol(["identificação do cheque","cmc7"]);
  let col_doc=findCol(["cpf","cnpj"]);
  let col_val=findCol(["valor"]);
  let col_d1=findCol(["captura"]);
  let col_d2=findCol(["data boa"]);
  let col_d3=findCol(["prevista","debito","crédito"]);
  let col_nome=findCol(["nome"]);

  for(let row of data){

    let cmc7=row[col_cmc7];
    if(!cmc7) continue;

    let val=parseValCentavos(row[col_val]);
    total+=val;

    linhas.push(buildSegmentoD(
      seq,
      cmc7,
      row[col_doc],
      val,
      row[col_d1],
      row[col_d2],
      row[col_d3],
      row[col_nome]
    ));

    seq++;
  }

  let qtd=seq-1;

  let trailerLote=putAt(trailerLoteBase,19,fmtZeros(qtd,6));
  trailerLote=putAt(trailerLote,25,fmtZeros(total,15));
  trailerLote=putAt(trailerLote,40,fmtZeros(qtd,6));

  let totalReg=2+qtd+2;

  let trailerArq=putAt(trailerArqBase,19,fmtZeros(1,6));
  trailerArq=putAt(trailerArq,25,fmtZeros(totalReg,6));

  linhas.push(trailerLote,trailerArq);

  return linhas.map(l=>l.padEnd(240).slice(0,240)).join("\n");
}
