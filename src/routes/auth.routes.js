const { Router } = require('express');
const { getUser, getUserStatus, register, login, protected, logout, getUserId, editUser, deleteUser, pdfUsers, protectedAdmi, ControlEstado, setupSSE } = require('../controllers/auth');
const { registerValidation, loginValidation } = require('../validators/auth');
const { validationMiddleware } = require('../middlewares/validation.middleware');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware')
const db = require('../db/index');
const pdfMakePrinter = require('pdfmake');
const fs = require('fs');
const router = Router();
var cors = require('cors')


// Ruta protegida solo para usuarios "admin"
router.get('/admin', userAuth, adminAuth, protectedAdmi, (req, res) => {
    res.send('Welcome, admin!');
  });
  
  // Otras rutas accesibles para usuarios "admin" y "user"
  router.get('/public', userAuth, (req, res) => {
    res.send('This is a public route accessible for both admin and user!');
  });





router.get("/get-users", userAuth, adminAuth, getUser)
router.get("/getUser/:statusParam", getUserStatus)
// Ruta para obtener un usuario por su ID
router.get('/users/:id', userAuth, adminAuth, getUserId);

//edit users
router.put('/useredit/:id', userAuth, adminAuth,editUser)

//delete users
router.delete('/deleteuser/:id', userAuth, adminAuth, deleteUser);

router.get("/protectedAdmin", userAuth ,protected)
router.get('/protected', userAuth, protected)

router.post("/register", register)

router.post("/login", loginValidation, validationMiddleware, login)

//control estado
router.patch('/users/:id/controlestado', userAuth, adminAuth, ControlEstado);
router.get('/sse', userAuth, adminAuth, setupSSE)


router.get("/logout", logout)




module.exports = router;