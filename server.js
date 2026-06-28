require('dotenv').config();  // 1. Para leer variables de entorno
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear carpeta uploads si no existe
const uploadsDir = './uploads/';
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Configuración de Multer para guardar mp3
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

// Página principal
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
    res.send('Error: ' + err.message);
  }
});

// Ruta para subir canciones
app.post('/subir', upload.single('mp3'), async (req, res) => {
  const nuevaCancion = new Cancion({
    titulo: req.body.titulo,
    artista: req.body.artista,
    archivo: req.file.filename
  });
  await nuevaCancion.save();
  res.redirect('/');
});

// Conexión a MongoDB Atlas
console.log("URI leída:", process.env.MONGO_URI ? "OK" : "UNDEFINED");

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
  app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
})
.catch(err => console.error('❌ Error de conexión:', err));

