const { Sequelize } =  require("sequelize");
const {DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT} = require('../constants/index')
const { config } = require ('dotenv').config();
const host = process.env.DB_HOST;
const sequelize = new Sequelize(
  DB_NAME, //dbname
  DB_USERNAME, //username
  DB_PASSWORD, //password

  
  {
    host: DB_HOST,
    dialect: "postgres",
    port: DB_PORT,
    // dialectOptions: {
    //   ssl: {
    //     require: true, // Indica que SSL es obligatorio.
    //     rejectUnauthorized: false, // Puedes ajustar esto según tus necesidades de seguridad.
    //   },
    // },
   
  }
);

module.exports = {sequelize};
