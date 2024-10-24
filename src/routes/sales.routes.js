const { Router }= require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware')
const { createSale, allSales, getByIdSale, getProformanumber, updateSale, deleteSale} = require('../controllers/sales');
const { prformaValid, prStock } = require('../validators/product');
const { validationMiddleware } = require('../middlewares/validation.middleware');

 const router = Router(); 

router.get('/proform', getProformanumber)

 router.get('/allSales', userAuth, allSales);
 router.get('/sale/:id', userAuth, getByIdSale);
 router.post('/sale', prformaValid, prStock, validationMiddleware, userAuth, createSale);
 router.put('/sale/:saleId', userAuth, updateSale);

router.delete('/sale/:saleId', userAuth, adminAuth, deleteSale)



 module.exports = router;