const { Router }= require('express');
const multer = require('multer');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware')
const { getProduct, getProductById, createProduct, editProduct, deletedProduct } = require('../controllers/Products/products');
const {validationMiddleware} = require('../middlewares/validation.middleware')
const {productValid} = require('../validators/product')
const router = Router();


// Configurar el destino y el nombre de los archivos subidos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads'); // El nombre de la carpeta donde se guardan las imágenes
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now()); // El nombre del archivo con el campo y la fecha
      // cb(null, uuidv4() + path.extname(file.originalname));
    },
  });

  // Crear una instancia de multer con la configuración
const upload = multer({ storage: storage });




router.get('/allProducts', userAuth, adminAuth, getProduct);
// router.get('/allProducts', getProduct);

router.get('/product/:id', userAuth, adminAuth, getProductById);

router.post('/product', upload.single('image'), productValid, validationMiddleware, userAuth, adminAuth, createProduct);//'image' solo es el nombre del campo del formulario del controlador, pero no es nombre de ningun campo de la base de datos

router.put('/product/:id', upload.single('image'), userAuth, adminAuth, editProduct);// ||

router.delete('/product/:id', userAuth, adminAuth, deletedProduct);


module.exports = router;

