const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index')
const Customer = require('../models/Customers')
const moment = require('moment-timezone');



// Modelo para la tabla 'sales'
const Sale = sequelize.define('Sale', {
      id_sales: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement:true,
        comment: 'Identificador único de la venta'
      },
      total: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Total de la venta con o sin impuesto'
      },
      total_no_tax: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Total sin impuesto, se calcula automaticamente con la suma de los subtotales en la tabla de detalles ventas, pero sin impuesto'
      },
      tax: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Selecccion de Impuesto segun el vendedor'
      },
      bill_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Número de proforma'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
        comment: "fecha de creación del registro",
        get() {
          return moment(this.getDataValue('createdAt')).tz('America/Guatemala').format('YYYY-MM-DD HH:mm:ss');
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
        comment: "fecha de actualización del registro",
        get() {
          return moment(this.getDataValue('createdAt')).tz('America/Guatemala').format('YYYY-MM-DD HH:mm:ss');
        },
      }
    }, {
      timestamps:true,
      tableName: 'sales', // Nombre de la tabla en la base de datos
      comment: 'Tabla que almacena información de las ventas'
    });
  
    // Definir relaciones
    Sale.belongsTo(Customer, { foreignKey: 'customers_id_customer', targetKey: 'id_customer' });
  


  
  module.exports = Sale ;