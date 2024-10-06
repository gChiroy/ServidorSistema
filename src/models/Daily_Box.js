const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/index')
const moment = require('moment-timezone');


// Fecha = ultimaCaja.Fecha,---
// Estado = ultimaCaja.Estado,---
// SaldoInicial = ultimaCaja.SaldoInicial,---
// Ingreso = totalVentas,---
// Egreso = totalGastos,---
// Caja = ultimaCaja.SaldoInicial + (totalVentas ?? 0) - (totalGastos ?? 0),---
// Entrega = ultimaCaja.SaldoFinal,---
// SaldoBruto = totalVentas,---
// Ganancia = (totalVentas ?? 0) - (totalGastos ?? 0)---
// Modelo para la tabla 'daily_box'
const DailyBox = sequelize.define('DailyBox', {
    id_daily_box: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      comment: 'Identificador único de la caja diaria'
    },
    initial_balance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Saldo inicial de la caja diaria'
    },
    effective_income : {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Total efectivo que ingresa de las ventas'
    },
    effective_expenditure: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment:'Total de efectivo de gastos para compras'
    },
    previous_balance: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Saldo anterior'
    },
    ending_balance: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Saldo final de la caja diaria'
    },
    deliver_cash: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Efectivo a entregar'
    },
    revenue: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Gananias'
    },
    net_balance : {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Saldo neto'
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      // defaultValue: true,
      comment: "estado de la caja diaria si esta cerrado o abierto"
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
    tableName: 'daily_box', // Nombre de la tabla en la base de datos
    comment: 'Tabla que almacena información de las cajas diarias'
  });

module.exports =  DailyBox ;
