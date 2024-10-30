const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index')
const moment = require('moment-timezone');


  // Modelo para la tabla 'categories'
  const Category = sequelize.define('category', {
      id_category: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador de la marca asociada a la categoría'
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Tipo de categoría'
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
      tableName: 'categories', // Nombre de la tabla en la base de datos
      comment: 'Tabla que almacena información de las categorías'
    });


  module.exports = { Category };