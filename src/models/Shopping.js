const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index')
const Provider = require('./Providers')
const moment = require('moment-timezone');

// Modelo para la tabla 'shopping'
const Shopping = sequelize.define('Shopping', {
    id_shopping: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Identificador único de la compra'
      
    
    },
    bill_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Número de factura'
    },
    total: {
      type: DataTypes.FLOAT,
      comment: 'Total de la compra'
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
    timestamps:true,
    tableName: 'shopping', // Nombre de la tabla en la base de datos
    comment: 'Tabla que almacena información de las compras'
  });

  // Definir relaciones
  Shopping.belongsTo(Provider, { foreignKey: 'providers_id_provider', targetKey: 'id_provider' });


module.exports = Shopping ;
