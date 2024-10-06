// const { Provider, CategoryProvides } = require('../models');
const Provider = require('../../models/Providers')
const CategoryProvides = require('../../models/Category_Providers')
const { Op } = require('sequelize');


exports.allProviders = async (req, res) => {
    try {
        const providers = await Provider.findAll();
        if(providers.length === 0) {
            return res.status(404).json({
                message: 'No se encontraron proveedores'
            });
        }
        res.json(providers);

    } catch (error) {
        console.error('Error al obtener los proveedores:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
}

exports.getProvidersPagi = async (req, res) => {
    try {
      const { page, perPage } = req.params; // Obtener los parámetros de la consulta
      const currentPage = parseInt(page, 10) || 1; // Página actual, por defecto 1
      const itemsPerPage = parseInt(perPage, 10) || 10; // Elementos por página, por defecto 10
  
      // Calcular el índice de inicio y fin en función de la página y elementos por página
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = currentPage * itemsPerPage;
  
      // Realizar la consulta a la base de datos utilizando startIndex y endIndex
      const providers = await Provider.findAndCountAll({
        offset: startIndex,
        limit: itemsPerPage,
        include: [{
            model: CategoryProvides,
            attributes: ['name', 'is_deleted']
        }],
        order: [['createdAt', 'DESC']]
        // ... otras condiciones de consulta
      });
  
      res.json({
        providers: providers.rows, // Los registros de proveedores para la página actual
        totalProviders: providers.count, // El número total de proveedores en la base de datos
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'Error interno del servidor',
      });
    }
  };
  


exports.allProvidersName = async (req, res) => {
    try {
        const providers = await Provider.findAll({
            include: [{
                model: CategoryProvides,
                attributes: ['name']
            }]
        });
        if(providers.length === 0) {
            return res.status(404).json({
                message: 'No se encontraron proveedores'
            });
        }
        res.json(providers);

    } catch (error) {
        console.error('Error al obtener los proveedores:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

exports.getProviderCompany = async (req, res) => {
    const { id } = req.params;
    try {
      const tasks = await Provider.findAll({
        attributes: ["id_provider", "category_providers_id_supplier_company", "name", "phone", "nit"],
        where: { category_providers_id_supplier_company: id },
      });
      res.json(tasks);
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }


exports.getDelProviders = async (req, res) => {
  try { 
const providers = await Provider.findAll({
    include: [{
      model: CategoryProvides,
      required: false, // Esto permite que los proveedores se incluyan incluso si no tienen una compañía asociada
      where: {
        [Op.or]: [
          { is_deleted: false }, // Filtra las compañías que no están marcadas como eliminadas
          { is_deleted: true },  // Incluye compañías marcadas como eliminadas
        ],
      },
      order: [['createdAt', 'DESC']]

    }],
  });
  
  return res.status(200).send(providers);
  
} catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Error al obtener los proveedores.' });
  }
};


exports.providerById = async (req, res) => {
    const { id } = req.params;
    try {

        const provider = await Provider.findByPk(id);
        if (!provider) {
            return res.status(404).json({
                message: 'Proveedor no encontrado'
            });
        }
        res.json(provider);
    } catch (error) {
        console.error('Error al obtener el proveedor:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
}

exports.registerProvider = async (req, res) => {
    try {
        const { name, phone, nit, category_providers_id_supplier_company } = req.body;

        // Verificar si la compañía proveedora existe
        const existingCompany = await CategoryProvides.findByPk(category_providers_id_supplier_company);

        if (!existingCompany) {
            return res.status(404).json({
                message: 'Compañía proveedora no encontrada'
            });
        }

        // Crear el proveedor
        const newProvider = await Provider.create({
            name,
            phone,
            nit,
            category_providers_id_supplier_company
        });

        res.json(newProvider);
    } catch (error) {
        console.error('Error al registrar el proveedor:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

exports.updateProvider = async (req, res) => {
    const id = req.params.id;
    const { name, phone, nit, category_providers_id_supplier_company } = req.body;

  
    try {
        const provider = await Provider.findOne({
            where: { id_provider: id }
        });
        if (!provider) {
            return res.status(404).json({
                message: 'Proveedor no encontrado'
            });
        }

        // Verificar si la compañía proveedora existe
        const existingCompany = await CategoryProvides.findByPk(category_providers_id_supplier_company);
        if (!existingCompany) {
            return res.status(404).json({
                message: 'Compañía proveedora no encontrada'
            });
        }
        
        // Actualizar el proveedor
        await provider.update({
            name,
            phone,
            nit,
            category_providers_id_supplier_company
        });
        
        res.json(provider);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }

}

exports.deleteProvider = async (req, res) => {
    const { id } = req.params;
    try {
        
        const provider = await Provider.findByPk(id);

        if (!provider) {
            return res.status(404).json({
                message: 'Proveedor no encontrado'
            });
        }
        
        // Borrar el proveedor
        await provider.destroy();
        
        res.json(provider);
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
}
