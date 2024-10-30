const DailyBox = require("../models/Daily_Box");
const MovementBox = require("../models/Movement_Box");
const { Op } = require('sequelize');
const moment = require('moment');


exports.allBox = async(req, res) => {
  try {
    const dailybox = await DailyBox.findAll({
      order: [['createdAt', 'DESC']]
    });
    if(dailybox.length === 0){
      return res.status(404).json({ message: 'no hay datos'})
    }

    res.status(200).json({dailybox});
  } catch (error) {
    console.log(error);
  }
}

// exports.getByIdBox = async(req, res) => {
//   try {
//     const { id } = req.params;
//     // Obtener la compra con el ID especificado
//     const daily = await DailyBox.findByPk(id);
//     if (!daily) {
//       return res.status(404).json({ message: 'La caja no existe' });
//     }

//     res.status(200).json(daily);
//   } catch (error) {
//     console.log(error);
//   }
// }

exports.getByIdBox = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'No se proporcionó un ID' });
    }

    const daily = await DailyBox.findByPk(id);

    if (!daily) {
      return res.status(404).json({ message: 'No hay cajas activas para obtener el estatus' });
    }

    // Si se encuentra la caja, devolverla en la respuesta
    res.status(200).json(daily);
  } catch (error) {
    console.log(error);
    // Manejo de errores generales
    res.status(500).json({ message: 'Ocurrió un error al obtener la caja' });
  }
};



// Esta función actualiza los totales de effective_income y effective_expenditure en DailyBox
const updateDailyBoxTotals = async () => {
  // Encuentra el registro de DailyBox más reciente
  const latestDailyBox = await DailyBox.findOne({
    order: [['createdAt', 'DESC']],
  });

  if (latestDailyBox) {
    // Obtén el id_daily_box del último DailyBox registrado
    const latestDailyBoxId = latestDailyBox.id_daily_box;

    // Calcula y actualiza el total de ventas (type_movement_box_id_type_movement_box = 1)
    const salesTotal = await MovementBox.sum('total', {
      where: {
        type_movement_box_id_type_movement_box: 1, // Identificador de venta
        daily_box_id_daily_box: latestDailyBoxId, // Solo registros relacionados con el último DailyBox
      },
    });

    // Calcula y actualiza el total de compras (type_movement_box_id_type_movement_box = 2)
    const purchasesTotal = await MovementBox.sum('total', {
      where: {
        type_movement_box_id_type_movement_box: 2, // Identificador de compra
        daily_box_id_daily_box: latestDailyBoxId, // Solo registros relacionados con el último DailyBox
      },
    });

    const renu = salesTotal - purchasesTotal;
    // Actualiza los campos effective_income y effective_expenditure en DailyBox
    await latestDailyBox.update({
      effective_income: salesTotal,
      effective_expenditure: purchasesTotal,
      revenue: renu,
    });
  }
};

// Escucha un evento que se dispara cuando se agrega un nuevo registro en MovementBox
MovementBox.afterCreate(() => {
  // Actualiza los totales en DailyBox después de agregar un nuevo movimiento en MovementBox
  updateDailyBoxTotals();
});
MovementBox.afterUpdate(() => {
  // Actualiza los totales en DailyBox después de agregar un nuevo movimiento en MovementBox
  updateDailyBoxTotals();
});

MovementBox.afterDestroy(() => {
  // Actualiza los totales en DailyBox después de agregar un nuevo movimiento en MovementBox
  updateDailyBoxTotals();
});



async function calculateAndUpdateRevenue(dailyBox) {
  const latestDailyBoxId = dailyBox.id_daily_box;

  // Calcula y actualiza el total de ventas (type_movement_box_id_type_movement_box = 1)
  const salesTotal = await MovementBox.sum('total', {
    where: {
      type_movement_box_id_type_movement_box: 1, // Identificador de venta
      daily_box_id_daily_box: latestDailyBoxId, // Solo registros relacionados con el último DailyBox
    },
  });

  // Calcula y actualiza el total de compras (type_movement_box_id_type_movement_box = 2)
  const purchasesTotal = await MovementBox.sum('total', {
    where: {
      type_movement_box_id_type_movement_box: 2, // Identificador de compra
      daily_box_id_daily_box: latestDailyBoxId, // Solo registros relacionados con el último DailyBox
    },
  });


  const revenue = (dailyBox.initial_balance + salesTotal) - purchasesTotal;
  const net_balance = revenue;

  // Actualiza el campo "revenue" en el DailyBox correspondiente
  await dailyBox.update({ net_balance });
}

// Escucha un evento que se dispara cuando se agrega un nuevo registro en MovementBox
MovementBox.afterCreate(async (movementBox) => {
  // Obtén el ID del DailyBox relacionado con este MovementBox
  const dailyBoxId = movementBox.daily_box_id_daily_box;

  // Encuentra el registro de DailyBox correspondiente
  const dailyBox = await DailyBox.findByPk(dailyBoxId);

  if (dailyBox) {
    // Calcula y actualiza el campo "revenue" en el DailyBox correspondiente
    await calculateAndUpdateRevenue(dailyBox);
  }
});

MovementBox.afterUpdate(async (movementBox) => {
  // Obtén el ID del DailyBox relacionado con este MovementBox
  const dailyBoxId = movementBox.daily_box_id_daily_box;

  // Encuentra el registro de DailyBox correspondiente
  const dailyBox = await DailyBox.findByPk(dailyBoxId);

  if (dailyBox) {
    // Calcula y actualiza el campo "revenue" en el DailyBox correspondiente
    await calculateAndUpdateRevenue(dailyBox);
  }
});

MovementBox.afterDestroy(async (movementBox) => {
  // Obtén el ID del DailyBox relacionado con este MovementBox
  const dailyBoxId = movementBox.daily_box_id_daily_box;

  // Encuentra el registro de DailyBox correspondiente
  const dailyBox = await DailyBox.findByPk(dailyBoxId);

  if (dailyBox) {
    // Calcula y actualiza el campo "revenue" en el DailyBox correspondiente
    await calculateAndUpdateRevenue(dailyBox);
  }
});



// exports.createDailyBox = async (req, res) => {
//   try {
//     // Obtén el saldo inicial desde la solicitud
//     const { initial_balance } = req.body;

//     // Verifica si ya existe una caja diaria con la misma fecha
//     const today = moment().tz('America/Guatemala').startOf('day'); // Fecha actual en el huso horario de Guatemala
//     const existingDailyBox = await DailyBox.findOne({
//       where: {
//         createdAt: {
//           [Op.gte]: today,
//           [Op.lt]: moment(today).add(1, 'day'), // Agrega 1 día a la fecha actual para obtener el límite superior
//         },
//       },
//     });

//     if (existingDailyBox) {
//       return res.status(400).json({ error: 'Ya existe una caja diaria para hoy' });
//     }

//     // Calcula el nuevo saldo inicial sumando el valor ingresado y el saldo final anterior (si existe)
//     const previousDailyBox = await DailyBox.findOne({
//       attributes: ['ending_balance'],
//       order: [['createdAt', 'DESC']],
//     });

//     const calculatedInitialBalance = previousDailyBox
//       ? initial_balance + previousDailyBox.ending_balance
//       : initial_balance;

//     const balance = calculatedInitialBalance - initial_balance;

//     // Crea un nuevo registro en DailyBox con el saldo inicial
//     const newDailyBox = await DailyBox.create({
//       initial_balance: calculatedInitialBalance,
//       previous_balance: balance,
//       status: true,
//     });

//     // Calcula y actualiza el campo "revenue" en el nuevo DailyBox
//     await calculateAndUpdateRevenue(newDailyBox);

//     res.status(201).json(newDailyBox);
//   } catch (error) {
//     console.error('Error al crear la caja diaria:', error);
//     res.status(500).json({ error: 'Error al crear la caja diaria' });
//   }
// };

exports.createDailyBox = async (req, res) => {
  try {
    // Obtén el saldo inicial desde la solicitud
    const { initial_balance } = req.body;

    // Primero verifica si hay alguna caja activa (status = true)
    const activeBox = await DailyBox.findOne({
      where: {
        status: true
      }
    });

    if (activeBox) {
      return res.status(400).json({ error: 'Ya existe una caja activa. Debe cerrar la caja actual antes de crear una nueva.' });
    }

    // Verifica si ya existe una caja diaria con la misma fecha
    const today = moment().tz('America/Guatemala').startOf('day');
    const existingDailyBox = await DailyBox.findOne({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: moment(today).add(1, 'day'),
        },
      },
    });

    if (existingDailyBox) {
      return res.status(400).json({ error: 'Ya existe una caja diaria para hoy' });
    }

    // Calcula el nuevo saldo inicial sumando el valor ingresado y el saldo final anterior (si existe)
    const previousDailyBox = await DailyBox.findOne({
      attributes: ['ending_balance'],
      order: [['createdAt', 'DESC']],
    });

    const calculatedInitialBalance = previousDailyBox
      ? initial_balance + previousDailyBox.ending_balance
      : initial_balance;
    
    const balance = calculatedInitialBalance - initial_balance;

    // Crea un nuevo registro en DailyBox con el saldo inicial
    const newDailyBox = await DailyBox.create({
      initial_balance: calculatedInitialBalance,
      previous_balance: balance,
      status: true,  // Nueva caja siempre inicia como activa
    });

    // Calcula y actualiza el campo "revenue" en el nuevo DailyBox
    await calculateAndUpdateRevenue(newDailyBox);

    res.status(201).json(newDailyBox);
  } catch (error) {
    console.error('Error al crear la caja diaria:', error);
    res.status(500).json({ error: 'Error al crear la caja diaria' });
  }
};


exports.getPreviousEndingBalance = async (req, res) => {
  try {
    // Busca la última caja cerrada ordenada por createdAt en orden descendente
    const previousDailyBox = await DailyBox.findOne({
      where: {
        status: false, // Busca cajas cerradas
      },
      order: [['createdAt', 'DESC']],
    });

    // Si se encontró una caja cerrada, devuelve su valor de ending_balance
    if (previousDailyBox) {
      return res.status(200).json({ previousEndingBalance: previousDailyBox.ending_balance });
    }

    // Si no se encontró ninguna caja cerrada, devuelve 0
    return res.status(200).json({ previousEndingBalance: 0 });
  } catch (error) {
    console.error('Error al obtener el saldo anterior:', error);
    res.status(500).json({ error: 'Error al obtener el saldo anterior' });
  }
};

exports.getActiveDailyBoxStatus = async (req, res) => {
  try {
    // Busca la caja diaria más reciente que esté activa (con status=true)
    const activeDailyBox = await DailyBox.findOne({
      where: {
        status: true,
      },
      order: [['createdAt', 'DESC']],
    });

    // Si se encuentra una caja activa, devuelve su estado (status)
    if (activeDailyBox) {
      const { status } = activeDailyBox;
      res.json({ status });
    } else {

      res.json({ message: 'no es posible obtenerlo' });
    }
  } catch (error) {
    console.error('Error al obtener el estado de la caja diaria activa:', error);
    res.status(500).json({ error });
  }
};





exports.closeDailyBox = async (req, res) => {
  try {
    const { id } = req.params; // Obtén el ID de la caja diaria desde los parámetros de la solicitud
    const { deliver_cash } = req.body; // Obtén el valor deliver_cash desde el cuerpo de la solicitud

    // Busca la caja diaria por su ID
    const dailyBox = await DailyBox.findByPk(id);

    if (!dailyBox) {
      return res.status(404).json({ error: 'Caja diaria no encontrada' });
    }

    if (!dailyBox.status) {
      return res.status(400).json({ error: 'La caja ya está cerrada' });
    }

    // Calcula el campo ending_balance restando deliver_cash de revenue
    const { net_balance } = dailyBox;

    // Verifica si el monto a retirar es mayor que el saldo neto
    if (deliver_cash > net_balance) {
      return res.status(400).json({ error: 'No se puede retirar un monto mayor al saldo neto' });
    }
    
    const endingBalance = net_balance - deliver_cash;

    // Actualiza la caja diaria con los nuevos valores
    await dailyBox.update({
      deliver_cash: deliver_cash,
      ending_balance: endingBalance, // Actualiza el campo ending_balance
      status: false, // Establece el estado de la caja a cerrado
    });

    res.status(200).json(dailyBox);
  } catch (error) {
    console.error('Error al cerrar la caja diaria:', error);
    res.status(500).json({ error: 'Error al cerrar la caja diaria' });
  }
};



