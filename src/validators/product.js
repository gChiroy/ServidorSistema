const { check } = require("express-validator");
const Product = require('../models/Product');
const Sale = require("../models/Sales");
const InventoryProduct = require("../models/InventoryProducts");

const existingProduct =  check('code_product').custom(async (value)=>{
    const product = await Product.findOne({where: { code_product: value}});
    if (product){
      throw new Error('El codigo de producto ya existe')
    }
  })

  const existingProforma =  check('bill_number').custom(async (value)=>{
    const sale = await Sale.findOne({where: { bill_number: value}});
    if (sale){
      throw new Error('El numero de factura ya existe')
    }
  })

  const stock = check('stock').custom(async(value)=>{
    const stock = await InventoryProduct.findOne({where : { stock: value}});
    if (stock === 0) {
      throw new Error('No hay suficiente stock para el producto' )
    }
  })

  module.exports = {
    productValid : [existingProduct],
    prformaValid : [existingProforma]
  }