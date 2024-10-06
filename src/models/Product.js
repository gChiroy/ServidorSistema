const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/index");
const { Category } = require("./Categories");
const moment = require('moment-timezone');


// Modelo para la tabla 'products'
const Product = sequelize.define(
  "Products",
  {
    id_product: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del producto",
    },
    url_product: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "URL del producto",
    },
    id_public: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID público del producto",
    },
    name: {
      type: DataTypes.STRING(45),
      allowNull: false,
      comment: "Nombre del producto",
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción detallada del producto",
    },
    code_product: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Código del producto",
    },
    profit_porc: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Porcentaje de ganancia del producto",
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
  },
  {
    tableName: "products", // Nombre de la tabla en la base de datos
    comment: "Tabla que almacena información de los productos",
    timestamps: true,
  }
);

// Definir relaciones
Product.belongsTo(Category, {
  foreignKey: "categories_id_category",
  targetKey: "id_category",
});


module.exports = Product;
