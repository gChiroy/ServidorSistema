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




const validateStock = async (req, res, next) => {
  try {
    const { details } = req.body;

    if (!details || !Array.isArray(details)) {
      return res.status(400).json({
        errors: [{
          type: 'field',
          value: details,
          msg: 'Detalles de venta inválidos',
          path: 'details',
          location: 'body'
        }]
      });
    }

    for (const detail of details) {
      const inventoryProduct = await InventoryProduct.findByPk(detail.product_id);
      
      if (!inventoryProduct) {
        return res.status(404).json({
          errors: [{
            type: 'field',
            value: detail.product_id,
            msg: `Producto con ID ${detail.product_id} no encontrado en inventario`,
            path: 'product_id',
            location: 'body'
          }]
        });
      }
      
      if (inventoryProduct.stock <= 0 || detail.amount > inventoryProduct.stock) {
        return res.status(400).json({
          errors: [{
            type: 'field',
            value: detail.amount,
            msg: `No hay suficiente stock para ${detail.producto.Product.name}`,
            path: 'amount',
            location: 'body',
            availableStock: inventoryProduct.stock
          }]
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error al validar el stock:', error);
    res.status(500).json({
      errors: [{
        type: 'internal',
        msg: 'Error interno al validar el stock',
        path: 'internal',
        location: 'server'
      }]
    });
  }
};



  module.exports = {
    productValid : [existingProduct],
    prformaValid : [existingProforma],
    prStock: [validateStock]
  }