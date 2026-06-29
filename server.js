import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crea la carpeta uploads si no existe - Fix para Render
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error(err));

const CancionSchema = new mongoose.Schema({
  titulo: String,
  artista: String,
  archivo: String,
  fecha: { type: Date, default: Date.now }
});
const Cancion = mongoose.model('Cancion', CancionSchema);

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.get('/ping', (req, res) => res.send('pong'));

app.get('/', async (req, res) => {
  const canciones = await Cancion.find().sort({ fecha: -1 });
  
  let html = `
<!DOCTYPE html>
<html>
<head>
<title>🎵 Mi Plataforma</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:'Segoe UI',Arial;
    background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
    min-height:100vh;
    padding:40px 20px;
    color:#fff
  }
  .container{
    max-width:700px;
    margin:0 auto;
    background:rgba(255,255,255,0.1);
    backdrop-filter:blur(10px);
    border-radius:20px;
    padding:30px;
    box-shadow:0 8px 32px rgba(0,0,0,0.3)
  }
  h1{text-align:center;margin-bottom:10px;font-size:2.2em}
  .contador{text-align:center;opacity:0.8;margin-bottom:30px}
  h2{margin:20px 0 15px;font-size:1.3em}
  input,button{
    width:100%;
    padding:14px;
    margin:8px 0;
    border:none;
    border-radius:12px;
    font-size:16px
  }
  input{background:rgba(255,255,255,0.95);color:#333}
  button{
    background:linear-gradient(90deg,#ff6b6b,#ff8e8e);
    color:white;
    font-weight:bold;
    cursor:pointer;
    transition:0.3s
  }
  button:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(255,107,107,0.4)}
  .song-card{
    background:rgba(255,255,255,0.15);
    padding:15px;
    border-radius:15px;
    margin:15px 0;
    transition:0.3s
  }
  .song-card:hover{background:rgba(255,255,255,0.25)}
  audio{width:100%;margin-top:10px;border-radius:10px}
  hr{margin:30px 0;opacity:0.3;border:none;border-top:1px solid rgba(255,255,255,0.3)}
  .empty{text-align:center;opacity:0.6;padding:30px}
</style>
</head>
<body>
<div class="container">
<h1>🎵 Mi Plataforma de Música</h1>
<div class="contador">📀 ${canciones.length} canción${canciones.length !== 1 ? 'es' : ''} subida${canciones.length !== 1 ? 's' : ''}</div>

<h2>⬆️ Sube tu MP3</h2>
<form action="/subir" method="POST" enctype="multipart/form-data">
  <input type="text" name="titulo" placeholder="Título de la canción" required>
  <input type="text" name="artista" placeholder="Artista" required>
  <input type="file" name="mp3" accept=".mp3" required>
  <button type="submit">🚀 Subir Canción</button>
</form>

<hr>
<h2>🎧 Mi Biblioteca</h2>
<input type="text" id="buscador" placeholder="🔍 Buscar por título o artista..." style="margin-bottom:20px">`;

  if (canciones.length === 0) {
    html += `<div class="empty">No hay canciones aún. ¡Sube la primera! 🎶</div>`;
  } else {
    canciones.forEach(c => {
      html += `
      <div class="song-card" data-titulo="${c.titulo.toLowerCase()}" data-artista="${c.artista.toLowerCase()}">
        <b>${c.titulo}</b> - ${c.artista}<br>
        <audio controls src="/uploads/${c.archivo}"></audio>
      </div>`;
    });
  }
  
  html += `
<script>
const buscador = document.getElementById('buscador');
const canciones = document.querySelectorAll('.song-card');

buscador.addEventListener('keyup', () => {
  const texto = buscador.value.toLowerCase();
  canciones.forEach(card => {
    const titulo = card.getAttribute('data-titulo');
    const artista = card.getAttribute('data-artista');
    if (titulo.includes(texto) || artista.includes(texto)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
});
</script>
</div></body></html>`;
  res.send(html);
});

app.post('/subir', upload.single('mp3'), async (req, res) => {
  const nueva = new Cancion({
    titulo: req.body.titulo,
    artista: req.body.artista,
    archivo: req.file.filename
  });
  await nueva.save();
  res.redirect('/');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('🚀 Servidor corriendo en puerto', PORT));