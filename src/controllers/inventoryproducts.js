const Produtcs = require('../models/Product');
const InventoryProduct = require('../models/InventoryProducts');
const { Category } = require('../models/Categories');
const DetailShopping = require('../models/DetailShopping');
const DetailSale = require('../models/DetailSales');
const { Op } = require('sequelize');

exports.allInventory = async(req, res)=> {
    try {
        const inventory = await InventoryProduct.findAll({
            include:[
                {
                    model: Produtcs,
                    include:[
                   
                        {
                            model: Category
                        }
                    ]
                }
            ]
        })

        if(inventory.length === 0){
            return res.status(404).json({
                message:'No hay productos en el inventario'
            })
        }

        return res.status(200).json(inventory)
    } catch (error) {
        console.log(error);
    }
}


exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const inventoryProduct = await InventoryProduct.findOne({
      where: { id_inventory: id },
      include: [
        {
          model: Produtcs,
          include: [
     
            {
              model: Category,
            },
          ],
        },
      ],
    });

    if (!inventoryProduct) {
      return res.status(404).json({
        message: 'Producto de inventario no encontrado',
      });
    }

    return res.status(200).json(inventoryProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Error interno del servidor',
    });
  }
};

exports.allInventorySale = async (req, res) => {
  try {
    const inventory = await InventoryProduct.findAll({
      include: [
        {
          model: Produtcs,
          include: [
            // { model: Brand }, 
            { model: Category }
          ],
          where: {
            name: {
              [Op.ne]: null
            }
          }
        }
      ]
    });
    
    if(inventory.length === 0){
       return res.status(404).json({ message: 'No hay productos en el inventario'});
    }

    return res.status(200).json(inventory);

  } catch (error) {
    console.log(error);
  }
}



exports.allInventory2 = async (req, res) => {
  const { type } = req.params;  // Se recibe el parámetro "type"
  
  try {
      const inventory = await InventoryProduct.findAll({
          include: [
              {
                  model: Produtcs,
                  include: [
                 
                      {
                          model: Category,
                      },
                  ],
              },
          ],
      });

      if (inventory.length === 0) {
          return res.status(404).json({
              message: 'No hay productos en el inventario',
          });
      }

      // Verificar el valor del parámetro "type"
      if (type === '1') {
          // Si type es 1, retornar todos los productos
          return res.status(200).json(inventory);
      } else if (type === '2') {
          // Si type es 2, organizar productos por categoría

        // Organizar productos por categoría
        const productsByCategory = {};

        inventory.forEach((inventoryItem) => {
            const product = inventoryItem.Product;

            if (!productsByCategory[product.category.type]) {
                productsByCategory[product.category.type] = [];
            }

            const formattedProduct = {
                id_inventory: inventoryItem.id_inventory,
                stock: inventoryItem.stock,
                discount: inventoryItem.purchase_discount,
                purchase_profit_por : inventoryItem.purchase_profit_por,
                purchase_price: inventoryItem.purchase_price,
                products_id_product: inventoryItem.products_id_product,
                public_price: inventoryItem.public_price,
                total: inventoryItem.total,
                // Agregar más propiedades de InventoryProduct según sea necesario
                Product: product
            };

            productsByCategory[product.category.type].push(formattedProduct);
        });

          return res.status(200).json(productsByCategory);
      } else {
          // Si el parámetro no es ni 1 ni 2, retornar un error
          return res.status(400).json({
              message: 'Parámetro inválido. Debe ser 1 (todos los productos) o 2 (productos por categoría).',
          });
      }
  } catch (error) {
      console.error(error);
      return res.status(500).json({
          message: 'Error en el servidor',
      });
  }
};


//EN USO-------------------------------------------------
exports.getProductMovementHistory1 = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID del producto de la solicitud

    // Consultar la tabla InventoryProduct para obtener el ID de inventario del producto
    const inventoryInfo = await InventoryProduct.findOne({
      where: {
        products_id_product: id,
      },
    });

    if (!inventoryInfo) {
      return res.status(404).json({ message: 'Producto no encontrado en el inventario.' });
    }

    // Consultar los movimientos de compra y venta del producto y ordenarlos por fecha
    const movements = await Promise.all([
      DetailShopping.findAll({
        where: {
          products_id_product: id, // Filtrar por el ID del producto
        },
        attributes: ['movement_type', 'createdAt'], // Seleccionar los campos que deseas mostrar
        order: [['createdAt', 'DESC']], // Ordenar por fecha en orden descendente
      }),
      DetailSale.findAll({
        where: {
          inventory_id_inventory: inventoryInfo.id_inventory, // Filtrar por el ID de inventario del producto
        },
        attributes: ['movement_type', 'createdAt'], // Seleccionar los campos que deseas mostrar
        order: [['createdAt', 'DESC']], // Ordenar por fecha en orden descendente
      }),
      
    ]);

    // Intercalar los movimientos de compra y venta por fecha
    const movementHistory = interleaveMovements(...movements);

    return res.json({ movementHistory, inventoryInfo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Función para intercalar los movimientos de compra y venta por fecha
function interleaveMovements(purchases, sales, credits) {
  const interleaved = [];
  let purchaseIndex = 0;
  let saleIndex = 0;
  // let creditIndex = 0;

  while (purchaseIndex < purchases.length || saleIndex < sales.length) {
    if (purchaseIndex < purchases.length) {
      interleaved.push(purchases[purchaseIndex]);
      purchaseIndex++;
    }

    if (saleIndex < sales.length) {
      interleaved.push(sales[saleIndex]);
      saleIndex++;
    }

  }

  return interleaved;
}










