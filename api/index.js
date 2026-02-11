import formidable from "formidable";
import XLSX from "xlsx";
import path from "path";
import { gerarCNAB } from "../lib/cnab.js";

export const config = { api:{ bodyParser:false } };

export default async function handler(req,res){

  if(req.method!=="POST"){
    return res.send(`
    <h2>Conversor Planilha → CNAB240</h2>
    <form method="post" enctype="multipart/form-data">
    <input type="file" name="file"/>
    <button>Gerar TXT</button>
    </form>`);
  }

  const form=new formidable.IncomingForm();

  form.parse(req,(err,fields,files)=>{

    const file=files.file[0];

    const wb=XLSX.readFile(file.filepath);
    const ws=wb.Sheets[wb.SheetNames[0]];

    const data=XLSX.utils.sheet_to_json(ws,{defval:""});

    const modelo=path.join(process.cwd(),"COOP1cheque.txt");

    const txt=gerarCNAB(data,modelo);

    res.setHeader("Content-Type","text/plain");
    res.setHeader("Content-Disposition","attachment; filename=cnab.txt");

    res.send(txt);
  });
}
