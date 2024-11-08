const { Router }= require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware')

const { getAllCategories, getCateryById, createCategory, editCategory, deleteCategory } = require('../controllers/Products/Categories')
const router = Router();



router.get('/allCategories', getAllCategories);
router.get('/category/:id', getCateryById);
router.post('/category', createCategory);
router.put('/category/:id', editCategory);
router.delete('/category/:id', deleteCategory);




module.exports = router;
 

// router.get('/allCategories', userAuth, adminAuth, getAllCategories);
// router.get('/category/:id', userAuth, adminAuth, getCateryById);
// router.post('/category', userAuth, adminAuth, createCategory);
// router.put('/category/:id', userAuth, adminAuth, editCategory);
// router.delete('/category/:id', userAuth, adminAuth, deleteCategory);