const { Router }= require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware')
const { allInventory, getProductMovementHistory1, getProductById, allInventory2 } = require('../controllers/inventoryproducts')

const router = Router();

router.get('/allInventoryproducts', userAuth, adminAuth, allInventory)

router.get('/catInv2/:type', userAuth, adminAuth, allInventory2)

router.get('/historyt/:id', userAuth, adminAuth, getProductMovementHistory1)
router.get('/productById/:id', userAuth, adminAuth, getProductById);
// router.put('/editStock/:id', userAuth, adminAuth, editSotck)


module.exports = router