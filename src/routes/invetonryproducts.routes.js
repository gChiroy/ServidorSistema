const { Router }= require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware')
const { allInventory, getProductMovementHistory1, getProductById, allInventory2, allInventorySale } = require('../controllers/inventoryproducts')

const router = Router();

router.get('/allInventoryproducts',  allInventory)

router.get('/catInv2/:type', allInventory2)
router.get('/allInventorySales', allInventorySale)
router.get('/historyt/:id',  getProductMovementHistory1)
router.get('/productById/:id',  getProductById);
// router.put('/editStock/:id',  editSotck)


module.exports = router


// router.get('/allInventoryproducts', userAuth, adminAuth, allInventory)

// router.get('/catInv2/:type', userAuth, adminAuth, allInventory2)
// router.get('/allInventorySales', userAuth, allInventorySale)
// router.get('/historyt/:id', userAuth, adminAuth, getProductMovementHistory1)
// router.get('/productById/:id', userAuth, adminAuth, getProductById);
// // router.put('/editStock/:id', userAuth, adminAuth, editSotck)
