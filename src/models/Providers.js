const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index')
const CategoryProviders = require('./Category_Providers')
const moment = require('moment-timezone');


// Modelo para la tabla 'providers'
const Provider = sequelize.define('Provider', {
    id_provider: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Identificador único del proveedor'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre del proveedor'
    },
    phone: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Número de teléfono del proveedor personal'
    },
    nit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Número de identificación tributaria'
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
    tableName: 'providers', // Nombre de la tabla en la base de datos
    comment: 'Tabla que almacena información de los proveedores'
  });

  // // Definir relaciones
  // Provider.belongsTo(SupplierCompany, { foreignKey: 'supplier_company_id_supplier_company', targetKey: 'id_supplier_company' });

// Define la relación entre los modelos Proveedor y Compañia
Provider.belongsTo(CategoryProviders, {
  foreignKey: 'category_providers_id_supplier_company', // Nombre de la columna en Proveedor que es clave externa
  onDelete: 'SET NULL', // Configura la restricción ON DELETE SET NULL
  onUpdate: 'CASCADE', // Configura la restricción ON UPDATE CASCADE (si es necesario)
  targetKey: 'id_category_providers',
});

module.exports = Provider ;
