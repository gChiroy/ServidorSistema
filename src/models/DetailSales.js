const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index')
const Sale = require('../models/Sales')
const InventoryProduct = require('./InventoryProducts')
const moment = require('moment-timezone');
const Product = require('../models/Product');


// Modelo para la tabla 'details_sales'
const DetailSale = sequelize.define('DetailSale', {
      id_details_sales: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del detalle de la venta'
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Cantidad del producto a vender'
      },
      subtotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Subtotal del detalle de venta'
      },
      price_inv_prod: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Precio obtenido de la tabla inventario'
      },
      discount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Descuento'
      },
      copy_amount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Copia del campo amount'
      },
      movement_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Venta', // Establecer el valor por defecto como "Compra"
        comment: 'Tipo de movimiento (Compra o Venta)',
    },
    sales_id_sales: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
          model: Sale, // Asegúrate de que coincida con el nombre de la tabla de compra
          key: 'id_sales',
      },
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
      tableName: 'details_sales', // Nombre de la tabla en la base de datos
      comment: 'Tabla que almacena detalles de las ventas'
    });
  
    // Definir relaciones
    DetailSale.belongsTo(Sale, { foreignKey: 'sales_id_sales', targetKey: 'id_sales' });
    Sale.hasMany(DetailSale, { foreignKey: 'sales_id_sales', targetKey: 'id_sales' });

    // DetailSale.belongsTo(Product, { foreignKey: 'products_id_product', targetKey: 'id_product' });


    DetailSale.belongsTo(InventoryProduct, { foreignKey: 'inventory_id_inventory', targetKey: 'id_inventory' });
                                                      
    DetailSale.beforeCreate((detailSale, options) => {
      const subtotal = (detailSale.amount * detailSale.price_inv_prod) - detailSale.discount;
      detailSale.subtotal = subtotal.toFixed(2); 
    });
    
    DetailSale.beforeUpdate((detailSale, options) => {
      const subtotal = (detailSale.amount * detailSale.price_inv_prod) - detailSale.discount;
      detailSale.subtotal = subtotal.toFixed(2); 
    });

  module.exports = DetailSale ;