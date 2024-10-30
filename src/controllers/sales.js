const { Category } = require("../models/Categories");
const Customer = require("../models/Customers");
const DailyBox = require("../models/Daily_Box");
const DetailSale = require("../models/DetailSales");
const InventoryProduct = require("../models/InventoryProducts");
const MovementBox = require("../models/Movement_Box");
const Product = require("../models/Product");
const Sale = require("../models/Sales");
const { Op } = require('sequelize');
const SalesMovementBox = require("../models/SalesMovementBox");


exports.allSales = async(req, res)=>{
    try {
          const sales = await Sale.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                model: Customer
            },{
                model: DetailSale,
                include:[{
                    model: InventoryProduct,
                    include: [{
                        model: Product,
                        include: [
                          {
                            model: Category
                        }
                      ]
                    }]
                }]
            }]
          })

          if (sales.length === 0) {
            return res.status(404).json({
                message: 'No se encuentran ventas'
            })
            
          }

          return res.status(200).json(sales);
    } catch (error) {
        console.log(error)
    }
}

exports.getByIdSale = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await Sale.findOne({
            where:{
                id_sales : id
            },
            include:[{
                model: Customer
            }, 
            {
                model: DetailSale,
                include:[{
                    model: InventoryProduct,
                    include: [{
                        model: Product,
                        include:[
                        {
                            model:Category
                        }
                    ]
                    }]
                }]

            }]
        })
   if (!sale) {
    return res.status(404).json({
        message: 'No se encontro la venta'
    })
   }
   res.status(200).json({
        sale
    })
        
    } catch (error) {
        console.log(error)
    }

}

exports.getProformanumber = async (req, res) => {
    try {
      // Obtener el número de factura actual de la base de datos
      const maxProNumber = await Sale.max('bill_number');
      const newProNumber = maxProNumber ? maxProNumber + 1 : 1;
  
      if (maxProNumber !== null) {
        // Devolver el número de factura en la respuesta JSON
        res.json({ bill_number: newProNumber});
      } else {
        // Si no hay registros en la tabla, iniciar desde 1
        res.json({ bill_number: 1 });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener el número de factura' });
    }
  };



exports.createSale = async (req, res) => {
  try {
    const { customerId, details, tax, bill_number } = req.body;

    const verifyCustomer = await Customer.findByPk(customerId);
    if (!verifyCustomer) {
      return res.status(404).json({
        message: 'No existe cliente',
      });
    }

    let totalNoTax = 0;
    let stockError = false;

    for (const detail of details) {
      const inventoryProduct = await InventoryProduct.findByPk(detail.product_id);

      if (!inventoryProduct) {
        return res.status(404).json({ message: 'Producto no encontrado en inventario' });
      }

      if (inventoryProduct.stock <= 0 || detail.amount > inventoryProduct.stock) {
        stockError = true;
        break;
      }

      // const priceInvProd = inventoryProduct.public_price;
      // const subtotal = (detail.amount * priceInvProd) - (detail.discount || 0);

      // totalNoTax += subtotal;
    }

    if (stockError) {
      return res.status(400).json({ message: 'No hay suficiente stock' });
    }

    // Crear una nueva venta en la tabla Sale
    const newSale = await Sale.create({
      total: 0,
      tax: tax || 0,
      total_no_tax: 0,
      bill_number,
      customers_id_customer: customerId,
    });

    for (const detail of details) {
      const inventoryProduct = await InventoryProduct.findByPk(detail.product_id);

      const priceInvProd = inventoryProduct.public_price;
      const subtotal = (detail.amount * priceInvProd) - (detail.discount || 0);

      totalNoTax += subtotal;

      await DetailSale.create({
        amount: detail.amount,
        subtotal,
        price_inv_prod: priceInvProd,
        discount: detail.discount || 0,
        copy_amount: detail.amount,
        sales_id_sales: newSale.id_sales,
        inventory_id_inventory: detail.product_id,
      });
    }

    const por_tac = tax / 100;
    const iva_include = totalNoTax * por_tac;
    const tot_fac = totalNoTax + iva_include;
    const fin_tot = parseFloat(tot_fac.toFixed(2));
    const fin_tot_not_tax = parseFloat(totalNoTax.toFixed(2));

    

    await newSale.update({ total: fin_tot, total_no_tax: fin_tot_not_tax });

// Obtiene la caja diaria activa
    const cajaDiaria = await DailyBox.findOne({
      where: { status: true },
    });

    if (cajaDiaria) {
      // Inserta un nuevo registro en la tabla MovementBox con el total calculado
      const mov = await MovementBox.create({
        type_movement_box_id_type_movement_box: 1,
        concept: 'Venta',
        total: fin_tot,
        daily_box_id_daily_box: cajaDiaria.id_daily_box,
      });

      // Crear un nuevo registro en la tabla sales_movement_box
      await SalesMovementBox.create({
        sales_id_sales: newSale.id_sales,
        movement_box_id_movement_box: mov.id_movement_box,
      });

      return res.status(201).json({ message: 'Venta registrada exitosamente', sale: newSale });
    } else {
      return res.status(400).json({ error: 'No hay caja diaria activa.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al registrar la venta' });
  }
};


exports.updateSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const { customerId, DetailSales, tax } = req.body;

    // Verificar si la venta existe
    const existingSale = await Sale.findByPk(saleId);

    if (!existingSale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    const existingTax = existingSale.tax;
    console.log('ta',existingTax)

    // Actualizar los datos de la venta (cliente)
    await existingSale.update({
      customers_id_customer: customerId,
      tax
      // tax: (tax !== undefined && tax !== existingTax) ? tax : existingTax,
    });

    // Eliminar los detalles que no están en la lista de details
    const detailIdsToKeep = DetailSales
      .filter((detail) => detail.id_details_sales)//id_details_sales
      .map((detail) => detail.id_details_sales);

    await DetailSale.destroy({
      where: {
        sales_id_sales: saleId,
        id_details_sales: { [Op.notIn]: detailIdsToKeep },
      },
    });
    //fin eliminar si no existe en detalles

    // Procesar los detalles proporcionados en el cuerpo de la solicitud
    for (const detail of DetailSales) {
      const {
        id_details_sales,
        inventory_id_inventory,
        amount,
        discount,
      } = detail;

      if (id_details_sales) {
        // Si hay un ID de detalle, actualizar el detalle existente si existe
        const existingDetail = await DetailSale.findByPk(id_details_sales);
        if (existingDetail) {
          const discount1 = parseFloat(discount) || 0;
          const inventoryProduct = await InventoryProduct.findByPk(inventory_id_inventory);

          if (!inventoryProduct) {
            return res.status(404).json({ message: 'Producto no encontrado en inventario' });
          }

          const priceInvProd = inventoryProduct.public_price;
          const subtotal = (amount * priceInvProd) - discount1;

          await existingDetail.update({
            amount,
            discount: discount1,
            subtotal,
            price_inv_prod: priceInvProd,
            inventory_id_inventory,
          });
        }
      } else {// Si no hay un ID de detalle, crear un nuevo detalle
        const discount1 = parseFloat(discount) || 0;
        const inventoryProduct = await InventoryProduct.findByPk(inventory_id_inventory);

        if (!inventoryProduct) {
          return res.status(404).json({ message: 'Producto no encontrado en inventario' });
        }

        const priceInvProd = inventoryProduct.public_price;
        const subtotal = (amount * priceInvProd) - discount1;

        await DetailSale.create({
          amount,
          discount: discount1,
          subtotal,
          price_inv_prod: priceInvProd,
          sales_id_sales: saleId,
          inventory_id_inventory,
        });
      }
    }
    
    // Calcular el nuevo total de la venta después de editar los detalles
    const updatedDetails = await DetailSale.findAll({
      where: { sales_id_sales: saleId },
    });

    const totalNoTax = updatedDetails.reduce((acc, detail) => {
      return acc + detail.subtotal;
    }, 0);

    let porTac, ivaInclude, totalFac;

    if (!tax) {
      ivaInclude = totalNoTax * existingTax;
      totalFac = totalNoTax + ivaInclude;
      // await existingSale.update({ tax: existingTax });
      await existingSale.update({
        total: totalFac,
        total_no_tax: totalNoTax,
        // tax: existingTax
      });
      // Actualizar 'tax' con el nuevo valor
    } else {
      // Si se proporciona tax<, calcular 'porTac' y 'ivaInclude' basados en el nuevo valor
      porTac = tax / 100;
      ivaInclude = totalNoTax * porTac;
      totalFac = totalNoTax + ivaInclude;
      // await existingSale.update({  });
      await existingSale.update({
        total: totalFac,
        total_no_tax: totalNoTax,
        // tax: porTac
      });
    }

    // Buscar el registro en SalesMovementBox y obtener el ID de MovementBox
    const salesMovementBox = await SalesMovementBox.findOne({
      where: { sales_id_sales: saleId },
    });

    if (salesMovementBox) {
      const movementBoxId = salesMovementBox.movement_box_id_movement_box;

      // Actualizar el campo total en el registro de MovementBox correspondiente
      const movementBox = await MovementBox.findByPk(movementBoxId);

      if (movementBox) {
        await movementBox.update({ total: totalFac });
      }
    }

    res.json({  
      message: 'Venta actualizada exitosamente', 
      sale: existingSale 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la venta' });
  }
};


exports.deleteDetailSale = async (req, res) => {
  try {
    const { detailId } = req.params; // Obtén el ID del detalle a eliminar desde los parámetros de la solicitud

    // Busca el detalle de venta por su ID
    const detail = await DetailSale.findByPk(detailId, {
      include: Sale, // Asegúrate de incluir la venta asociada
    });

    if (!detail) {
      return res.status(404).json({ message: 'Detalle de venta no encontrado' });
    }

    // Obten la cantidad del producto que se eliminará del detalle
    const amountToDelete = detail.amount;

    // Obtiene el ID de la compra a la que pertenece el detalle
    const saleId = detail.sales_id_sales;

    // Obtiene el detalle de compra para actualizar el total
    const sale = await Sale.findByPk(saleId);

    if (!sale) {
      return res.status(404).json({ message: 'venta no encontrada' });
    }

    const iva = sale.tax / 100;

    const totalNoTax = sale.total_no_tax;
    // Obtiene el campo 'total' actual de la compra
    const currentTotal = sale.total;


    // Obtiene el subtotal del detalle a eliminar
    const subtotalToDelete = detail.subtotal;

    // Calcula el nuevo total restando el subtotal del detalle a eliminar
    const newsubTotal = totalNoTax - subtotalToDelete;

    const ivaSub = newsubTotal * iva;
    const newTotal = newsubTotal + ivaSub;  

    // Actualiza el stock en InventoryProduct
    const inventoryProduct = await InventoryProduct.findByPk(detail.inventory_id_inventory);

    if (inventoryProduct) {
      const publicPrice = inventoryProduct.public_price;


      const newStock = inventoryProduct.stock + amountToDelete;

      const newTotalInventory = newStock * publicPrice;

      await inventoryProduct.update({ stock: newStock, total: newTotalInventory });
    }

    // Actualiza el campo 'total' en la compra
    await sale.update({ total: newTotal, total_no_tax: newsubTotal });

     // Actualiza el campo 'total' en la tabla MovementBox
    // Busca el registro en la tabla SalesMovementBox que corresponde a esta venta
    const salesMovementBox = await SalesMovementBox.findOne({
      where: { sales_id_sales: saleId },
    });

    if (salesMovementBox) {
      // Obtiene el registro en la tabla MovementBox
      const movementBox = await MovementBox.findByPk(salesMovementBox.movement_box_id_movement_box);

      if (movementBox) {
        // Resta el nuevo total al campo 'total' en MovementBox
        // const newMovementBoxTotal = movementBox.total - newTotal;
        await movementBox.update({ total: newTotal });
      }
    }
       // Elimina el detalle de venta
       await detail.destroy();

    return res.status(200).json({ message: 'Detalle de venta eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al eliminar el detalle de venta' });
  }
};




exports.deleteSale = async (req, res) => {
  try {
      const { saleId } = req.params;

      // Verificar si la compra existe
      const existingSale = await Sale.findByPk(saleId);

      if (!existingSale) {
          return res.status(404).json({ message: 'Compra no encontrada' });
      }

      // Eliminar los detalles de compra relacionados con la compra
      await DetailSale.destroy({
          where: { sales_id_sales: saleId },
      });
      
         // Buscar el registro en SalesMovementBox asociado a la venta
         const salesMovementBox = await SalesMovementBox.findOne({
          where: { sales_id_sales: saleId },
        });
  
        if (salesMovementBox) {
          // Obtener el ID de MovementBox asociado a SalesMovementBox
          const movementBoxId = salesMovementBox.movement_box_id_movement_box;
  
          // Eliminar el registro en SalesMovementBox
          await salesMovementBox.destroy();
  
          // Buscar y eliminar el registro en MovementBox asociado a la venta
          const movementBox = await MovementBox.findByPk(movementBoxId);
  
          if (movementBox) {
            await movementBox.destroy();
          }
        }  

      // Eliminar la compra
      await existingSale.destroy();

      res.json({ message: 'Compra eliminada exitosamente' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al eliminar la compra' });
  }
};
