const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index')
const moment = require('moment-timezone');

 
// Modelo para la tabla 'customers'
const Customer = sequelize.define('Customer', {
      id_customer: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del cliente'
      },
      nit: {
        type: DataTypes.NUMERIC, 
        allowNull: false,
        comment: 'Número de NIT del cliente'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Nombre del cliente'
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Dirección del cliente'
      },
      phone: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Número de teléfono del cliente'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
        comment: "fecha de creación del registro",
        field: 'created_at',
        get() {
          return moment(this.getDataValue('createdAt')).tz('America/Guatemala').format('YYYY-MM-DD HH:mm:ss');
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
        comment: "fecha de actualización del registro",
        field: 'updated_at',
        get() {
          return moment(this.getDataValue('createdAt')).tz('America/Guatemala').format('YYYY-MM-DD HH:mm:ss');
        },
      }
    }, {
      tableName: 'customers', // Nombre de la tabla en la base de datos
      comment: 'Tabla que almacena información de los clientes'
    });

  
  module.exports = Customer;