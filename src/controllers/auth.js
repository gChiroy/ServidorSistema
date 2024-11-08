const db = require("../db/index");
const { hash } = require("bcryptjs");
const { sign } = require("jsonwebtoken");
const { SECRET, CLIENT_URL } = require("../constants/index");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");
const { config } = require ('dotenv').config();

//const secret = process.env.SECRET;
const secret = "Mi_mensaje_Secreto"; 

// const pdfMakePrinter = require('pdfmake');
// const PDFDocument = require('pdfkit');
// const PDFTable = require('pdfkit-table');
const fs = require("fs");

exports.getUser = async (req, res) => {
  try {
    const users = await Users.findAll({
      order: [['createdAt', 'DESC']],
    }); // Obtén todos los usuarios utilizando Sequelize

    return res.status(200).json({
      success: true,
      users: users,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.getUserStatus = async (req, res) => {
  try {
    const { statusParam } = req.params;

    let whereCondition = {};

    if (statusParam === '1') {
      whereCondition = { status: true }; // Usuarios activos
    } else if (statusParam === '2') {
      whereCondition = { status: false }; // Usuarios inactivos
    }

    const users = await Users.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron usuarios.',
      });
    }

    return res.status(200).json({
      success: true,
      users: users,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      error: error.message,
    });
  }
};


exports.getUserId = async (req, res) => {
  const userId = req.params.id; // Obtener el ID desde los parámetros de la solicitud

  try {
    // Utilizar el método findOne de Sequelize para buscar por ID
    const user = await Users.findOne({
      where: { user_id: userId }
    });

    if (!user) {
      // Si no se encontró ningún usuario con el ID proporcionado, devuelve un mensaje de error
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Si se encontró el usuario con el ID proporcionado, devuelve los detalles del usuario
    return res.status(200).json({
      success: true,
      user: user, 
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


exports.editUser = async (req, res) => {
  const userId = req.params.id; // Obtener el ID desde los parámetros de la solicitud
  const { user, password, rol } = req.body; // Obtener los datos a actualizar desde el cuerpo de la solicitud

  try {
    // Verificar si el usuario con el ID proporcionado existe en la base de datos
    const existingUser = await Users.findOne({
      where: { user_id: userId }
    });

    if (!existingUser) {
      // Si no se encontró ningún usuario con el ID proporcionado, devuelve un mensaje de error
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Si el usuario existe, realizar la actualización de los datos
    // Primero, hashear la nueva contraseña si se proporcionó
    if (password) {
      existingUser.password = await hash(password, 10);
    }

    // Actualizar los demás datos del usuario
    existingUser.users = user;
    existingUser.rol = rol;

    // Guardar los cambios en la base de datos
    await existingUser.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


exports.deleteUser = async (req, res) => {
  const userId = req.params.id; // Obtener el ID desde los parámetros de la solicitud

  try {
    // Verificar si el usuario con el ID proporcionado existe en la base de datos
    const existingUser = await Users.findOne({
      where: { user_id: userId }
    });

    if (!existingUser) {
      // Si no se encontró ningún usuario con el ID proporcionado, devuelve un mensaje de error
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Si el usuario existe, eliminarlo de la base de datos
    await existingUser.destroy();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.register = async (req, res) => {
  const { users, password, rol, status } = req.body;

  try {
    const hashedPassword = await hash(password, 10);

    // Crea un nuevo usuario utilizando el modelo Users y el método create
    await Users.create({
      users,
      password: hashedPassword,
      rol,
      status, // Agrega el campo status
    });

    return res.status(201).json({
      success: true,
      message: "The registration was successful",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      error: error.message,
    });
  }
};


exports.login = async (req, res) => {
  let user = req.users;

    // Verifica el estado del usuario antes de continuar
    if (!user.status) {
      return res.status(403).json({
        success: false,
        message: 'User is blocked',
      });
    }

  let payload = {
    id: user.user_id,
    users: user.users,
    role: user.rol,
  };
  try {

    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 200); // Suma 100 minutos a la hora actual
    const unixTimestamp = expirationDate.getTime() / 1000; // Convierte la fecha de expiración a UNIX timestamp
    
    const token = sign(payload, secret, { expiresIn: '390m' });

    return res
      .status(200)
      // .cookie('token', token, { httpOnly: true })
      .cookie('token', token, { httpOnly: true, get: () => true  })
      .json({
        success: true,
        message: 'Logged in successfully',
        user: user.users,
        rol: user.rol,
        token: token,
        tokenExpiration: unixTimestamp, // Agrega el UNIX timestamp de la fecha de expiración

      });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.protected = async (req, res) => {
  try {
    return res.status(200).json({
      info: "protected info desde back",
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.protectedAdmi = async (req, res) => {
  try {
    return res.status(200).json({
      info: "admin ",
    });
  } catch (error) {
    console.log(error.message);
  }
};

exports.logout = async (req, res) => {
  try {

    // Elimina la cookie 'token' al establecer una fecha de expiración pasada
    res.clearCookie('token');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      error: error.message,
    });
  }
};


const sseClients = [];

exports.ControlEstado = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await Users.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Cambiar el estado del usuario
    user.status = !user.status;
    await user.save();

    // Enviar una notificación SSE a todos los clientes
    const message = JSON.stringify({ userId: user.user_id, status: user.status });
    sseClients.forEach(client => client.res.write(`data: ${message}\n\n`));

    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Configurar la ruta SSE
exports.setupSSE = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = Date.now(); // Generar un ID de cliente único
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Eliminar el cliente cuando se cierra la conexión
  req.on('close', () => {
    sseClients.splice(sseClients.findIndex(client => client.id === clientId), 1);
  });
};


// Ruta para generar y descargar el PDF con el contenido de la tabla usuarios
