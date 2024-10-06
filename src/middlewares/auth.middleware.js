const passport = require('passport')
// const {Users} = require('../models/Users')

exports.userAuth = passport.authenticate('jwt', { session: false })

exports.adminAuth = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
      return next(); // Permite que el usuario "admin" acceda a la ruta
    } else {
      return res.status(403).json({ message: 'Acceso Prohibido, no eres administrador' }); // Deniega el acceso para cualquier otro tipo de usuario
    }
  };



  