const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index')
const MovementBox = require('./Movement_Box')
const Shopping = require('./Shopping')
const moment = require('moment-timezone');


const ShoppingMovementBox = sequelize.define('shopping_movement_box', {
    id_shopping_movement_box: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la relación entre movimiento de caja y compra'
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
    tableName: 'shopping_movement_box',
    comment: 'Tabla que almacena la relación entre movimientos de caja y compras'
});

ShoppingMovementBox.belongsTo(MovementBox, { foreignKey: 'movement_box_id_movement_box', targetKey: 'id_movement_box' });
ShoppingMovementBox.belongsTo(Shopping, { foreignKey: 'shopping_id_shopping', targetKey: 'id_shopping' });


module.exports = ShoppingMovementBox;