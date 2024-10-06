const { DataTypes } = require('sequelize');
// const  sequelize  = require('./db/index')
const { sequelize } = require('../db/index')
const moment = require('moment-timezone');



const Users = sequelize.define('users', {
    user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: "Codigo unico de identificacion"
    },
    users: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "nombre de usuario"
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "contraseña del usuario"
      },
    rol: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "el tipo de rol del usuario registrado"
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "estado del usuario si esta inactivo o activo"
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
    comment: 'Tabla que gestion de usuarios'
    // createdAt: true,
    // updatedAt: true
    // createdAt: {
    //   type: DataTypes.DATE,
    //   allowNull: true,
    //   comment: "fecha de creacion"
    // },
    // updatedAt: {
    //   type: DataTypes.DATE,
    //   allowNull: true,
    //   comment: "la fecha de actualizacion"
    // }
  });

  module.exports= Users;