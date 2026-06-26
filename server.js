const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Ruta principal: muestra el formulario
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para subir archivos
app.post('/upload', upload.single('archivo'), (req, res) => {
  res.send(`
    <p>Archivo subido correctamente: ${req.file.filename}</p>
    <p>Puedes verlo aquí: <a href="/uploads/${req.file.filename}" target="_blank">Abrir archivo</a></p>
  `);
});

// Servir archivos estáticos de la carpeta uploads
app.use('/uploads', express.static('uploads'));

app.listen(3000, () => console.log('Servidor en http://localhost:3000'));

