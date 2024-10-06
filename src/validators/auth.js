const { check } = require('express-validator')
const db = require('../db')
const { compare } = require('bcryptjs')
const  Users  = require('../models/Users')


// Password validation
const password = check('password')
  .isLength({ min: 6, max: 15 })
  .withMessage('Password has to be between 6 and 15 characters');

// User validation exists
const user = check('users')
  .isAlphanumeric()
  .withMessage('Please provide a valid user');

// Role validation
const validRoles = ['admin', 'empleado'];

const rol = check('rol')
  .isIn(validRoles)
  .withMessage(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);

// User validation check if user exists
const userExists = check('users').custom(async (value) => {
  const user = await Users.findOne({ where: { users: value } });
  if (user) {
    throw new Error('El usuario ya existe');
  }
});


// Login validation
const loginFieldsCheck = check('users').custom(async (value, { req }) => {
    try {
      const user = await Users.findOne({ where: { users: value } });
  
      if (!user) {
        throw new Error('El usuario o contraseña no existe');
      }

      if (!user.status) {
        throw new Error('Usuario sin acceso');
      }
  
      const validPassword = await compare(req.body.password, user.password);
  
      if (!validPassword) {
        throw new Error('Usuario o contraseña incorrecta');
      }
  
      req.users = user; // Almacena el usuario en req para usarlo en la ruta
    } catch (error) {
      throw error; // Lanza cualquier error para que Express lo maneje
    }
  });
  

module.exports = {
    registerValidation: [user, password, rol, userExists],
    loginValidation: [loginFieldsCheck],
    // clientValdation: [existingCustomer]
}