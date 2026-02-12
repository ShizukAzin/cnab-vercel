import { formidable } from "formidable";
import XLSX from "xlsx";
import path from "path";
import { gerarCNAB } from "../lib/cnab.js";

export const config = { api:{ bodyParser:false } };

export default async function handler(req,res){

  // =========================
  // TELA HTML BONITA
  // =========================
  if(req.method!=="POST"){
    return res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Conversor CNAB240</title>

<style>

body{
  margin:0;
  font-family:Segoe UI,Arial,sans-serif;
  background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#333;
}

.card{
  background:#fff;
  padding:40px;
  border-radius:16px;
  width:420px;
  box-shadow:0 20px 40px rgba(0,0,0,0.25);
  text-align:center;
}

h2{
  margin-top:0;
  color:#2c5364;
}

input[type=file]{
  margin:20px 0;
  padding:12px;
  border-radius:8px;
  border:1px solid #ccc;
  width:100%;
}

button{
  width:100%;
  padding:14px;
  border:none;
  border-radius:10px;
  background:#2c5364;
  color:white;
  font-size:16px;
  cursor:pointer;
  transition:0.3s;
}

button:hover{
  background:#203a43;
  transform:translateY(-2px);
}

.footer{
  margin-top:20px;
  font-size:12px;
  color:#888;
}

</style>

</head>

<body>

<div class="card">

<h2>📄 Conversor Planilha → CNAB240</h2>

<form method="post" enctype="multipart/form-data">

<input type="file" name="file" accept=".xls,.xlsx,.xlsm" required>

<button type="submit">Gerar Arquivo CNAB</button>

</form>
<div class="footer">
    © 2026 Sh
<div class="footer">
Sistema de Conversão
</div>

</div>

</body>
</html>
`);
  }

  // =========================
  // PROCESSAMENTO DO UPLOAD
  // =========================

  const form = formidable({
  multiples:false,
  keepExtensions:true
});

  form.parse(req,(err,fields,files)=>{

    if(err){
      return res.status(500).send("Erro no upload.");
    }

    const file = Array.isArray(files.file)
      ? files.file[0]
      : files.file;

    if(!file){
      return res.status(400).send("Arquivo não enviado.");
    }

    const wb=XLSX.readFile(file.filepath);
    const ws=wb.Sheets[wb.SheetNames[0]];

    const data=XLSX.utils.sheet_to_json(ws,{defval:""});

    const modelo = path.join(process.cwd(),"api","COOP1cheque.txt");

    const txt=gerarCNAB(data,modelo);

    res.setHeader("Content-Type","text/plain");
    res.setHeader("Content-Disposition","attachment; filename=cnab.txt");

    res.send(txt);
  });
}
