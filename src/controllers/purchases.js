const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const DetailShopping = require("../models/DetailShopping");
const Product = require("../models/Product");
const Shopping = require("../models/Shopping");
const Provider = require("../models/Providers");
const CategoryProvides = require("../models/Category_Providers");
const { Op } = require('sequelize');
const { Category } = require("../models/Categories");
const { jsPDF } = require('jspdf');
const DailyBox = require('../models/Daily_Box');
const MovementBox = require('../models/Movement_Box');
const ShoppingMovementBox = require('../models/ShoppingMovementBox');
const InventoryProduct = require('../models/InventoryProducts');
require('jspdf-autotable');


exports.getPurchase = async (req, res) => {
    try {
        const shopping = await Shopping.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                model: Provider,
                include : [{
                    model: CategoryProvides,
                }]
            },
            {
              model: DetailShopping,
                include:[
                {
                    model: Product,
                    include: [
                      {
                          model: Category
                      }
                  ]
                }]
            //   order: [['createdAt', 'DESC']]
            }],
          });

          if (shopping.length === 0) {
            return res.status(404).json({
              message: "No hay compras registrados",
            });
          }
          
          return res.status(200).send(shopping);
    } catch (error) {
        console.log(error)
    }
}

// Controlador para obtener el número de factura actual
exports.getBillnumber = async (req, res) => {
    try {
      // Obtener el número de factura actual de la base de datos
      const maxBillNumber = await Shopping.max('bill_number');
      const newBillNumber = maxBillNumber ? maxBillNumber + 1 : 1;
  
      if (maxBillNumber !== null) {
        // Devolver el número de factura en la respuesta JSON
        res.json({ bill_number: newBillNumber});
      } else {
        // Si no hay registros en la tabla, iniciar desde 1
        res.json({ bill_number: 1 });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener el número de factura' });
    }
  };

exports.getByIdPurchase = async(req, res) =>{

    try {
        const { id } = req.params;
        const purchase = await Shopping.findOne({
            where:{
                id_shopping: id || null,
            },
            include:[{
                model: Provider
            },
            {

                model: DetailShopping,
                  include:[
                  {
                      model: Product,
                      include: [
                        {
                            model: Category
                        }
                    ]
                  }]          
              }]
        });

        if(!purchase){
            return res.status(404).json({
                message: 'Compra no encontrada'
            })
        }

        res.status(200).json({
            purchase
        })
    } catch (error) {
        console.log(error)
    }
}
///registra compras
exports.createShopping = async (req, res) => {
  try {
      const { provider_id, details } = req.body;

      // Verificar si existen todos los productos en los detalles
      const productErrors = [];

      for (const detail of details) {
          const idProduct = detail.id_product;
          const verifyProduct = await Product.findByPk(idProduct);

          if (!verifyProduct) {
              productErrors.push({
                  id_product: idProduct,
                  message: 'No existe producto'
              });
          }
      }
      if (productErrors.length > 0) {
          return res.status(400).json({
              message: 'Uno o más productos no existen',
              errors: productErrors
          });
      }
      // Si todos los productos existen, continuar con la creación de la compra
      // Obtener el número de factura actual (el máximo)
      const maxBillNumber = await Shopping.max('bill_number');
      const newBillNumber = maxBillNumber ? maxBillNumber + 1 : 1; // Incrementar en uno
      const verifyProvider = await Provider.findByPk(provider_id);
      if (!verifyProvider) {
          return res.status(404).json({
              message: 'No existe proveedor'
          });
      }
      // Crear una nueva compra sin asignar shopping_id_shopping aún
      const newShopping = await Shopping.create({
          bill_number: newBillNumber,
          providers_id_provider: provider_id // Asignar el proveedor a la compra
      });
//genera detalle shopping
      const detailPromises = details.map(async (detail) => {
          const discount = parseFloat(detail.discount) || 0;
          const idProduct = detail.id_product;
//cantidad * precio compra -descuento
          const subtotal = (detail.amount * detail.purchase_price) - discount;

          await DetailShopping.create({
              amount: detail.amount,
              purchase_price: detail.purchase_price,
              discount: discount,
              copy_amount: detail.amount || 0,
              subtotal,
              shopping_id_shopping: newShopping.id_shopping || null,
              products_id_product: idProduct,
              sale_price: detail.sale_price
          });
      });

      // Calcular el total
      const total = details.reduce((acc, detail) => {
          return acc + ((detail.amount * detail.purchase_price) - detail.discount);
      }, 0);

      // Actualizar el campo total en la compra
      await newShopping.update({ total });

      return res.status(201).json({ message: 'Compra registrada exitosamente', shopping: newShopping });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al crear la compra' });
  }
};


/** inicio EDITAR */
exports.updateShopping = async (req, res) => {
    try {
      const { shoppingId } = req.params;
      const { provider_id, DetailShoppings } = req.body;
  
      // Verificar si la compra existe
      const existingShopping = await Shopping.findByPk(shoppingId);
  
      if (!existingShopping) {
        return res.status(404).json({ message: 'Compra no encontrada' });
      }
  
      // Actualizar los datos de la compra (número de factura y proveedor)
      await existingShopping.update({
        providers_id_provider: provider_id,
      });

              // Agregado quitar si no funciona
        const detailIdsToKeep = DetailShoppings
        .filter((detail) => detail.id_details_shopping)
        .map((detail) => detail.id_details_shopping);

        // Elimina los detalles que no están en la lista detailIdsToKeep
        await DetailShopping.destroy({
            where: {
                shopping_id_shopping: shoppingId,
                id_details_shopping: { [Op.notIn]: detailIdsToKeep },
            },
        });
        //FIN AGREGADO RECIENTEMENTE
  
      // Procesar los detalles proporcionados en el cuerpo de la solicitud
      for (const detail of DetailShoppings) {
        const {
          id_details_shopping,
          purchase_price,
          amount,
          discount,
          products_id_product,
          sale_price
        } = detail;
  
        if (id_details_shopping) {
          // Si hay un ID de detalle, actualizar el detalle existente si existe
          const existingDetail = await DetailShopping.findByPk(id_details_shopping);
          if (existingDetail) {
            const discount1 = parseFloat(discount) || 0;
            const subtotal = (amount * purchase_price) - discount1;

          //    // Guardar el precio antiguo
          // const oldPurchasePrice = existingDetail.purchase_price;

            await existingDetail.update({
              amount,
              purchase_price,
              discount: discount1,
              subtotal,
              products_id_product,
              sale_price
            });

          }
        } else {
          const discount1 = parseFloat(discount) || 0;
          // Si no hay un ID de detalle, crear un nuevo detalle
          const subtotal = (amount * purchase_price) - discount1;
          await DetailShopping.create({
            amount,
            purchase_price,
            discount: discount1,
            subtotal,
            products_id_product,
            shopping_id_shopping: shoppingId,
            sale_price
          });
        }
      }
  
      // Calcular el nuevo total de la compra después de editar los detalles
      const updatedDetails = await DetailShopping.findAll({
        where: { shopping_id_shopping: shoppingId },
      });
  
      const total = updatedDetails.reduce((acc, detail) => {
        return acc + detail.subtotal;
      }, 0);
  
      // Actualizar el campo total en la compra
      await existingShopping.update({ total });

  
      res.json({  
        message: 'Compra actualizada exitosamente', 
        shopping: existingShopping 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar la compra' });
    }
  };
  


exports.deleteDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el detalle de compra por su ID
    const detailToDelete = await DetailShopping.findByPk(id);

    if (!detailToDelete) {
      return res.status(404).json({ message: 'Detalle de compra no encontrado' });
    }

    // Obtener el ID del producto asociado al detalle que se va a eliminar
    const productId = detailToDelete.products_id_product;

    // Obtener la cantidad del detalle
    const amountToDelete = detailToDelete.amount;

    // Obtener el ID de la compra asociada al detalle
    const shoppingId = detailToDelete.shopping_id_shopping;

    // Eliminar el detalle de compra
    await detailToDelete.destroy();

  
    // Recalcular el total de la compra después de eliminar el detalle
    const shopping = await Shopping.findByPk(shoppingId);

    let newTotal;

    if (shopping) {
      const details = await DetailShopping.findAll({
        where: { shopping_id_shopping: shoppingId },
      });

      // Calcular el nuevo total
      newTotal = details.reduce((acc, detail) => {
        return acc + ((detail.amount * detail.purchase_price) - detail.discount);
      }, 0);

      // Actualizar el campo total en la compra
      await shopping.update({ total: newTotal });
    }

    res.json({ message: 'Detalle de compra eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el detalle de compra' });
  }
};

//eliminar toda una compra

exports.deleteShopping = async (req, res) => {
    try {
        const { shoppingId } = req.params;

        // Verificar si la compra existe
        const existingShopping = await Shopping.findByPk(shoppingId);

        if (!existingShopping) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        // Eliminar los detalles de compra relacionados con la compra
        await DetailShopping.destroy({
            where: { shopping_id_shopping: shoppingId },
        });

    

        // Eliminar la compra
        await existingShopping.destroy();

        res.json({ message: 'Compra eliminada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la compra' });
    }
};



