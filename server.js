require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Render en plan Free se duerme. Esto evita que se caiga por inactividad
app.get('/ping', (req, res) => res.send('pong'));

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Configuración de Multer 
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Modelo Canción
const Cancion = mongoose.model('Cancion', {
  titulo: String,
  artista: String,
  archivo: String,
  fecha: { type: Date, default: Date.now }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Página principal
app.get('/', async (req, res) => {
  try {
    const canciones = await Cancion.find().sort({ fecha: -1 });
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head><title>Mi Plataforma</title>
    <style>body{font-family:Arial;max-width:600px;margin:40px auto;padding:20px}input,button{padding:8px;margin:5px 0;width:100%}</style>
    </head>
    <body>
    <h1>🔥 Mi Plataforma de Música</h1>
    <h2>Sube tu MP3</h2>
    <form action="/subir" method="POST" enctype="multipart/form-data">
      <input type="text" name="titulo" placeholder="Título" required>
      <input type="text" name="artista" placeholder="Artista" required>
      <input type="file" name="mp3" accept=".mp3" required>
      <button type="submit">Subir Canción</button>
    </form>
    <hr>
    <h2>Mis Canciones</h2>`;
    
    canciones.forEach(c => {
      html += `
      <div style="margin:20px 0; padding:10px; border:1px solid #ccc; border-radius:8px">
        <b>${c.titulo}</b> - ${c.artista}<br>
        <audio controls style="width:100%;margin-top:8px" src="/uploads/${c.archivo}"></audio>
      </div>`;
    });
    
    res.send(html + '</body></html>');
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

// Ruta para subir
app.post('/subir', upload.single('mp3'), async (req, res) => {
  try {
    const nuevaCancion = new Cancion({
      titulo: req.body.titulo,
      artista: req.body.artista,
      archivo: req.file.filename
    });
    await nuevaCancion.save();
    res.redirect('/');
  } catch (err) {
    res.send('Error al subir: ' + err.message);
  }
});

// Conexión a MongoDB - sin opciones viejas
console.log("URI leída:", process.env.MONGO_URI ? "OK" : "UNDEFINED");

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error de conexión:', err);
    process.exit(1);
  });