const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index');
const moment = require('moment-timezone');

// Modelo para la tabla 'supplier_company'
const CategoryProviders = sequelize.define('CategoryProviders', {
  id_category_providers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Identificador único del tipo proveedor'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre del tipo proveedor'
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Indica si el tipo proveedor ha sido eliminada',
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
    tableName: 'category_providers', // Nombre de la tabla en la base de datos
    comment: 'Tabla que almacena información de tipo proveedor'
  });

module.exports = CategoryProviders ;
