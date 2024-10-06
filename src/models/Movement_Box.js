const { DataTypes } = require('sequelize');
const {sequelize} = require('../db/index');
const DailyBox = require('./Daily_Box');
const TypeMovementBox = require('./Type_movement_box');
const moment = require('moment-timezone');


const MovementBox = sequelize.define('movement_box', {
    id_movement_box: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement:true,
        comment: 'Identificador único del movimiento de caja'
    },
    concept: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Concepto del movimiento de caja'
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Total del movimiento de caja'
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
    tableName: 'movement_box',
    comment: 'Tabla que almacena movimientos de caja'
});

MovementBox.belongsTo(DailyBox, { foreignKey: 'daily_box_id_daily_box', targetKey: 'id_daily_box' });
MovementBox.belongsTo(TypeMovementBox, { foreignKey: 'type_movement_box_id_type_movement_box', targetKey: 'id_type_movement_box' });

// Provider.belongsTo(SupplierCompany, { foreignKey: 'supplier_company_id_supplier_company', targetKey: 'id_type_movement_box' });

module.exports = MovementBox;
