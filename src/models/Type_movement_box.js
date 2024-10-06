const { DataTypes } = require('sequelize');
const {sequelize} = require('../db/index');
// const moment = require('moment-timezone');


const TypeMovementBox = sequelize.define('type_movement_box', {
    id_type_movement_box: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        // unique: true,
        comment: 'Identificador único del tipo de movimiento de caja'
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Tipo de movimiento de caja'
    },
}, {
    timestamps: false,
    tableName: 'type_movement_box',
    comment: 'Tabla que almacena tipos de movimiento de caja'
});

module.exports = TypeMovementBox;
