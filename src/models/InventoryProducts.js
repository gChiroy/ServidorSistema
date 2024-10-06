//EL PRECIO PUBLICO SE CALCULARA CON TRIGGERS
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index')

const Product = require('./Product')
const Shopping = require('./Shopping')
const MovementBox = require('./Movement_Box')
const moment = require('moment-timezone');
const DetailShopping = require('./DetailShopping');


const InventoryProduct = sequelize.define('inventory_product', {
    id_inventory: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del inventario de producto'
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue:0,
        comment: 'Cantidad en stock'
    },
    public_price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue:0,
        comment: 'Precio público'
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue:0,
        comment: 'Total'
    },
    purchase_price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue:0,
        comment: 'Precio de compra'
    },
    old_purchase_price:{
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue:0,
      comment: 'Precio antiguo de compra'
    },
    old_public_price:{
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue:0,
      comment: 'Precio antiguo'
    },
    purchase_discount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Precio de compra'
    },
    purchase_profit_por: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Porcentaje de beneficio del producto'
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "estado del producto si cuenta con suficiente stock"
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
    tableName: 'inventory_product',
    comment: 'Tabla que almacena el inventario de productos'
});

InventoryProduct.belongsTo(Product, { foreignKey: 'products_id_product', targetKey: 'id_product' });
// InventoryProduct.belongsTo(MovementBox, { foreignKey: 'movement_box_id_movement_box', targetKey: 'id_movement_box' });
// InventoryProduct.belongsTo(Shopping, { foreignKey: 'shopping_id_shopping', targetKey: 'id_shopping' });
// InventoryProduct.belongsTo(DetailShopping, { foreignKey: 'details_shopping_id_details_shopping', targetKey: 'id_details_shopping' });

module.exports = InventoryProduct;