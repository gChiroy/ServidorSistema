const Customer = require("../models/Customers");

// id_customer
// dpi
// name
// address
// phone

exports.allCustomer = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      order:[['createdAt', 'DESC']]
    });

    if (customers.length === 0) {
      return res.status(404).json({
        message: "No hay clientes registrados",
      });
    }

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.customersById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        message: "No se encontró el cliente",
      });
    }
    res.status(200).json(customer);
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

exports.createCustomer = async (req, res) => {
    try {
        const { nit, name, address, phone } = req.body;
        // Verificar si el cliente ya existe
        const existingCustomer = await Customer.findOne({ where: { nit } });
        if (existingCustomer) {
            return res.status(400).json({
                message: 'El cliente ya existe'
            });
        }
        const customer = await Customer.create({
            nit,
            name,
            address,
            phone
        })
        return res.status(201).json(customer);
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
          error: error.message,
        });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { nit, name, address, phone } = req.body;
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({
                message: "No se encontró el cliente",
            });
        }
        await customer.update( {
            nit,
            name,
            address,
            phone
        });
       
        res.status(200).json(customer);
        
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
}

exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({
                message: "No se encontró el cliente",
            });
        }
        await customer.destroy();
        res.status(200).json({
            message: "Cliente eliminado",
            customer: customer
        });
        
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
}
