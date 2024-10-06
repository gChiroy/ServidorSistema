const { Category } = require('../../models/Categories')


// ** API Category ** --------------------------------
exports.getAllCategories = async (req, res) => {
    try {
        const allCategories = await Category.findAll({
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json(allCategories);
    } catch (error) {
        console.log(error);
    }
};

exports.getCateryById = async(req, res) => {
    const { id } = req.params;
    try {
        const category = await Category.findOne({
            where: { 
                id_category: id 
            },
            
        });
        res.status(200).json(category);
        
    } catch (error) {
        console.log(error);
    }
}

exports.createCategory = async (req, res) => {
    const { type } = req.body;
    try {
        
        const category = await Category.create({
            type
        });

        res.status(201).json(category);
    }catch (error) {
        console.log(error);
    }
}

exports.editCategory = async (req, res) => {
    const { id } = req.params;
    const { type } = req.body;
    try {

     // Buscar la categoria por su ID
     const existCategory = await Category.findByPk(id);
    
     if (!existCategory) {
        return res.status(404).json({
            success: false,
            message: "Categoria no encontrada"
        })
    }
    // Actualizar el campo "name"
    existCategory.type = type;
    await existCategory.save();

    res.status(200).json(existCategory);

    } catch (error) {
        console.log(error);
    }
}

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
         // Buscar la Categoria por su ID
     const existCategory = await Category.findByPk(id);
    
     if (!existCategory) {
        return res.status(404).json({
            success: false,
            message: "Categoria no encontrada"
        })
    }

    await existCategory.destroy();
    res.status(200).json({
        success: true,
        message: "Categoria eliminada"
    })
        
    } catch (error) {
        console.error(error);
    }
}
// exports.getUserId = async (req, res) =>
