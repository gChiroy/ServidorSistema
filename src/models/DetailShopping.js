const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index');
const Product = require('./Product')
const Shopping = require('./Shopping')
const moment = require('moment-timezone');



// Modelo para la tabla 'details_shopping'
const DetailShopping =  sequelize.define('DetailShopping', {
    id_details_shopping: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Identificador único del detalle de la compra'
    },
    purchase_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Precio de cada producto'
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Cantidad del producto en la compra'
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Subtotal del detalle de la compra'
    },
    discount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Descuento aplicado al detalle de la compra'
    },
    // 
    sale_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Precio del producto'
    },
    copy_amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Copia del campo amount'
    },
    shopping_id_shopping: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
          model: Shopping, // Asegúrate de que coincida con el nombre de la tabla de compra
          key: 'id_shopping',
      },
  },
  movement_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Compra', // Establecer el valor por defecto como "Compra"
    comment: 'Tipo de movimiento (Compra o Venta)',
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
    tableName: 'details_shopping', // Nombre de la tabla en la base de datos
    comment: 'Tabla que almacena detalles de las compras'
  });

  // Definir relaciones
  DetailShopping.belongsTo(Product, { foreignKey: 'products_id_product', targetKey: 'id_product' });
  // DetailShopping.belongsTo(Shopping, { foreignKey: 'shopping_id_shopping', targetKey: 'id_shopping' });

  // In the DetailShopping model
DetailShopping.belongsTo(Shopping, { foreignKey: 'shopping_id_shopping', targetKey: 'id_shopping' });
Shopping.hasMany(DetailShopping, { foreignKey: 'shopping_id_shopping', targetKey: 'id_shopping' });



  // Definir gancho (hook) para calcular el subtotal antes de crear o actualizar un registro
DetailShopping.beforeCreate((detailShopping, options) => {
  const subtotal = (detailShopping.amount * detailShopping.purchase_price) - detailShopping.discount;
  detailShopping.subtotal = subtotal;
});

DetailShopping.beforeUpdate((detailShopping, options) => {
  const subtotal = (detailShopping.amount * detailShopping.purchase_price) - detailShopping.discount;
  detailShopping.subtotal = subtotal;
});

module.exports = DetailShopping ;
