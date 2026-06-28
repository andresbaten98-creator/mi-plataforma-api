require('dotenv').config()  // 1. AGREGADO ARRIBA DE TODO
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');  // 2. AGREGADO para crear carpeta

const app = express();
const PORT = process.env.PORT || 3000;  // 3. CAMBIADO para que lea .env

// Crear carpeta uploads si no existe - evita error
const uploadsDir = './uploads/';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Config para guardar mp3
const storage = multer.diskStorage({
  destination: './uploads/',
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
app.use('/uploads', express.static('uploads'));

// Página con formulario + lista
app.get('/', async (req, res) => {
  try {
    const canciones = await Cancion.find().sort({ fecha: -1 });
    
    let html = `
    <h1>🔥 Mi Plataforma de Música</h1>
    <h2>Sube tu MP3</h2>
    <form action="/subir" method="POST" enctype="multipart/form-data">
      <input type="text" name="titulo" placeholder="Título" required><br><br>
      <input type="text" name="artista" placeholder="Artista" required><br><br>
      <input type="file" name="mp3" accept=".mp3" required><br><br>
      <button type="submit">Subir Canción</button>
    </form>
    <hr>
    <h2>Mis Canciones</h2>`;
    
    canciones.forEach(c => {
      html += `
      <div style="margin:20px 0; padding:10px; border:1px solid #ccc">
        <b>${c.titulo}</b> - ${c.artista}<br>
        <audio controls src="/uploads/${c.archivo}"></audio>
      </div>`;
    });
    
    res.send(html);
  } catch (err) {
    res.send('Error: ' + err.message)
  }
});

// Ruta para subir
app.post('/subir', upload.single('mp3'), async (req, res) => {
  const nuevaCancion = new Cancion({
    titulo: req.body.titulo,
    artista: req.body.artista,
    archivo: req.file.filename
  });
  await nuevaCancion.save();
  res.redirect('/');
});

// 4. CAMBIADO: Conexión a Atlas con .env
console.log("URI leída:", process.env.MONGODB_URI ? "OK" : "UNDEFINED")
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ Error de conexión:', err))
