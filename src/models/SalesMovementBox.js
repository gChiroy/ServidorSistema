const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index');
const Sales = require('./Sales')
const MovementBox = require('./Movement_Box')
const moment = require('moment-timezone');



const SalesMovementBox = sequelize.define('sales_movement_box', {
    id_sales_movement_box: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del movimiento de caja de venta'
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
    tableName: 'sales_movement_box',
    comment: 'Tabla que almacena los movimientos de caja relacionados con ventas'
});

SalesMovementBox.belongsTo(Sales, { foreignKey: 'sales_id_sales', targetKey: 'id_sales' });
SalesMovementBox.belongsTo(MovementBox, { foreignKey: 'movement_box_id_movement_box', targetKey: 'id_movement_box' });

module.exports = SalesMovementBox;