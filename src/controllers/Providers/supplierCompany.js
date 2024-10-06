const CategoryProvider = require('../../models/Category_Providers')
const Provider = require('../../models/Providers')

// id_supplier_company,
//   name,
//   address,
//   phone

exports.allSupplierCom = async (req, res) => {

    try {
        const supplier = await CategoryProvider.findAll({
            // where: {
            //     is_deleted:false,
            // },
        order: [['createdAt', 'DESC']]

        });

        if(supplier.length === 0){
            return res.status(404).send({
                message: 'No se encontraron compañias'
            })
        }
        return res.status(200).send(supplier);
        
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: 'Error en el servidor'
        })
    }
}

exports.allSupplier = async (req, res) => {

  try {
      const supplier = await CategoryProvider.findAll({
          where: {
              is_deleted:true,
          },
      order: [['createdAt', 'DESC']]

      });

      if(supplier.length === 0){
          return res.status(404).send({
              message: 'No se encontraron compañias'
          })
      }
      return res.status(200).send(supplier);
      
  } catch (error) {
      console.error(error);
      return res.status(500).send({
          message: 'Error en el servidor'
      })
  }
}


exports.supplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = await CategoryProvider.findByPk(id);

        if (!supplier) {
            return res.status(404).send({
                message: 'No se encontraron compañias'
            })
        }
        
        return res.status(200).send(supplier);
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            message: 'Error en el servidor'
        })
    }
}

exports.createSupplier = async (req, res) => {
    try {
        const { name, address, phone } = req.body;

        const supplier = await CategoryProvider.create({
            name
        })
        
        return res.status(201).send(supplier);
        
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            message: 'Error en el servidor'
        })
    }
}

exports.updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        const supplier = await CategoryProvider.findByPk(id);
        
        if (!supplier) {
            return res.status(404).send({
                message: 'No se encontraron compañias'
            })
        }
        
        await supplier.update({
            name
        })
        
        return res.status(200).send(supplier);
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            message: 'Error en el servidor'
        })
    }
}

exports.deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        
        const supplier = await CategoryProvider.findByPk(id);
        
        if (!supplier) {
            return res.status(404).send({
                message: 'No se encontraron compañias'
            })
        }
        
        await supplier.destroy();
        
        return res.status(200).send({
            message: 'Tipo proveedor eliminada',
            company: supplier
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            message: 'Error en el servidor'
        })
    }
}




// Controlador para eliminar una compañía y actualizar el modelo Proveedor
exports.DeleCompany = async (req, res) => {
  const { companyId } = req.params;

  try {
    // Verifica si la compañía existe
    const company = await CategoryProvider.findByPk(companyId);
    if (!company) {
      return res.status(404).send({ message: 'Tipo proveedor no existe controlador2.' });
    }

    // Actualiza el campo category_providers_id_category_providers en el modelo Proveedor para establecerlo en NULL
    await Provider.update(
      { category_providers_id_category_providers: null },
      { where: { category_providers_id_category_providers: companyId } }
    );

    // Elimina la compañía
    await company.destroy();

    return res.status(200).json({ 
        message: 'Tipo proveedor eliminada correctamente.',
        company: company,
    
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Error al eliminar Tipo proveedor.' });
  }
};


exports.deleteCompany = async (req, res) => {
    try {
      const { id } = req.params;
      const company = await CategoryProvider.findByPk(id);
      if (!company) {
        return res.status(404).json({ message: 'Tipo proveedor no encontrada' });
      }
      // Set the IdCompañia field in the Proveedor records to NULL
      await Provider.update({ category_providers_id_category_providers: null }, {
        where: { category_providers_id_category_providers: id }
      });
      // Delete the company record
      await company.destroy();
      return res.status(201).json({
        message: 'Tipo proveedor eliminada',
        company: company
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ 
        message: 'Error al eliminar Tipo proveedor' 

    });
    }
  };


  exports.selectedCategoryProvider = async (req, res) => {
    const { id } = req.params;
    try {
      const company = await CategoryProvider.findByPk(id);
  
      if (!company) {
        return res.status(404).json({ message: 'Tipo proveedor no existe.' });
      }
  
      // Obtener el valor actual de is_deleted
      const isDeleted = company.is_deleted;
  
      // Cambiar el valor de is_deleted de false a true o viceversa
      await company.update({ is_deleted: !isDeleted });
  
      return res.status(200).json({
        message: `Tipo proveedor marcada como ${!isDeleted ? 'desactivada' : 'activada'}`,
        company: company,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error al cambiar el estado de la Tipo proveedor.' });
    }
  };
  
  

exports.delTruCompany = async (req, res) => {
  const { id } = req.params;

  try {
    const company = await CategoryProvider.findByPk(id);
    if (!company) {
      return res.status(404).send({ message: 'Tipo proveedor no existe.' });
    }

    // Marcar la compañía como eliminada
    await company.update({ is_deleted: true });


    return res.status(201).json({
        message: 'Compañía marcada como eliminada',
        company: company
      });


    // return res.status(200).send({ message: 'Compañía marcada como eliminada.' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Error al eliminar Tipo proveedor.' });
  }
};



  
