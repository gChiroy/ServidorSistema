const Product = require('../../models/Product');
const { Category} = require('../../models/Categories');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const cloud_name = process.env.CLOUD_NAME;
const api_key = process.env.API_KEY;
const api_secret = process.env.API_SECRET;



// Configurar cloudinary con las credenciales
cloudinary.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret,
  });

// id_product,
//   url_product,
//   id_public,
//   name,
//   code_product,
//   profit_porc,
//   createdAt,
//   updatedAt
exports.getProduct = async (req, res) => {
    try {
        // Sincronizar los modelos Category con la base de datos
        const allProduct = await Product.findAll({
            order: [['createdAt', 'DESC']],
            include: [
            {
                model: Category,
                // attributes: ['type']
            }
        ]
        });
        if(allProduct.length === 0) {
            return res.status(404).json({
                message: 'No hay productos registrados'
            })
        }
        res.status(200).json(allProduct);
        
    } catch (error) {
        console.log(error);
    }
}

exports.getProductById = async (req, res) =>{
    const { id } = req.params;   
    try {
        const product = await Product.findOne({
            where: {
                id_product : id
            }
        });
   // forma simplificada        // const product = await Product.findByPk(id);     
        if (!product){
            return res.status(404).json({
                message: 'Producto no encontrado'
            })
        }
        res.json(product);
    } catch (error) {
        console.log(error);
    }
}




exports.createProduct = async (req, res) => {
    try {
        const { name, detail, code_product, profit_porc, categories_id_category } = req.body;
        const image = req.file; // The uploaded file is in req.file

        // Check if the category exist

        const existingCategory = await Category.findByPk(categories_id_category);

        if (!existingCategory) {
            return res.status(404).json({
                message: 'Categoria no encontrado'
            });
        }

        let imageUrl, publicId;
        if (image) {
            // Subir la imagen a la nube
            const cloudinaryUploadResult = await cloudinary.uploader.upload(image.path);

            // guardar la url y id puclbico de la imagen
            imageUrl = cloudinaryUploadResult.secure_url;
            publicId = cloudinaryUploadResult.public_id;

            // eliminar el path de la imagen para no sobrecargar la carpeta upload
            fs.unlinkSync(image.path);
        }

        // const profit_porc_decimal = profit_porc / 100;

        // Insertar los datos a la bd, la imagen no es necesario
        const newProduct = await Product.create({
            name,
            detail,
            code_product,
            profit_porc,
            // profit_porc: profit_porc_decimal,
            categories_id_category,
            url_product: imageUrl,
            id_public: publicId
        });

        // ternar el json de respuesta
        res.json(newProduct);
    } catch (error) {
        
        console.log(error);
    }
}


// id_product,
//   url_product,
//   id_public,
//   name,
//   code_product,
//   profit_porc,
//   createdAt,
//   updatedAt
exports.editProduct = async (req, res) => {
    try {
        const { id }  = req.params;
        // const { title, description } = req.body;
        const { name, detail, code_product, profit_porc, categories_id_category } = req.body;


        // Obtener la tarea existente para obtener su imagen y public_id (si existe)
        const existingTask = await Product.findByPk(id);

        if (!existingTask) {
            return res.status(404).json({
                message: 'Tarea no encontrada'
            });
        }

        const existingCategory = await Category.findByPk(categories_id_category);
        
     
        if (!existingCategory) {
            return res.status(404).json({
                message: 'Categoria no encontrada'
            });
        }

        let imageUrl = existingTask.url_product;
        let publicId = existingTask.id_public;

        if (req.file) {
            const image = req.file; // El archivo subido se encuentra en req.file
            
            // Subir la nueva imagen a Cloudinary
            const cloudinaryUploadResult = await cloudinary.uploader.upload(image.path);

            // Actualizar la URL y el public_id de la imagen
            imageUrl = cloudinaryUploadResult.secure_url;
            publicId = cloudinaryUploadResult.public_id;

            // Eliminar la imagen anterior de Cloudinary si existía
            if (existingTask.id_public) {
                await cloudinary.uploader.destroy(existingTask.id_public);
            }

            fs.unlinkSync(image.path);
        }

          // Actualizar la tarea en la base de datos
        //campos base de datos  // campos req body nuevo
        // existingTask.name = name,
        // existingTask.detail = detail,
        // existingTask.code_product = code_product,
        // existingTask.profit_porc = profit_porc,
        // existingTask.categories_id_category = categories_id_category,
        // existingTask.url_product = imageUrl,
        // existingTask.id_public = publicId;
        // await existingTask.save();

        // const profit_porc_decimal = profit_porc / 100;


        await existingTask.update({
            name,
        detail,
        code_product,
        // profit_porc: profit_porc_decimal,
        profit_porc,
        categories_id_category,
        url_product: imageUrl,
        id_public: publicId
        })

        res.json(existingTask);
    } catch (error) {
        // Manejar el error
        console.log(error);
    }
};


exports.deletedProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener el producto existente para obtener su id_public y eliminar la imagen de Cloudinary
        const existingProduct = await Product.findByPk(id);

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        // Eliminar la imagen de Cloudinary si existe un id_public
        if (existingProduct.id_public) {
            await cloudinary.uploader.destroy(existingProduct.id_public);
        }

        // Eliminar el producto de la base de datos
        await existingProduct.destroy();

        res.json({
            message: 'Producto eliminado exitosamente',
            product: existingProduct,
        });
    } catch (error) {
        // Manejar el error
        console.log(error);
    }
};

