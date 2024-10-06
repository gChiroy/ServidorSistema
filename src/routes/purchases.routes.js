const { Router }= require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware')
const { createShopping, getPurchase, deleteDetail, updateShopping, deleteShopping, getByIdPurchase, getBillnumber} = require('../controllers/purchases')

// const { generatePDFInvoice } = require('../controllers/pdf/purchase/bill')
 const router = Router();

router.get('/allPurchases', userAuth, adminAuth, getPurchase)
router.get('/bill', userAuth, adminAuth, getBillnumber);


router.get('/purchase/:id', userAuth, adminAuth, getByIdPurchase)
router.post('/purchase', userAuth, adminAuth, createShopping)
// router.post('/purchase', createShopping)

router.put('/purchase/:shoppingId', userAuth, adminAuth, updateShopping)

router.delete('/purchase/detail/:id', userAuth, adminAuth, deleteDetail)

router.delete('/purchase/:shoppingId', userAuth, adminAuth, deleteShopping)


// /********************PARA GENERA PDF */
// // router.get('/purchase/bill/:id', generatePDFInvoice, userAuth, adminAuth)
// router.get('/purchase/bill/:id/:filename', userAuth, adminAuth, generatePDFInvoice)




module.exports = router;