const { Router }= require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware')

const { getAllCategories, getCateryById, createCategory, editCategory, deleteCategory } = require('../controllers/Products/Categories')
const router = Router();



router.get('/allCategories', userAuth, adminAuth, getAllCategories);
router.get('/category/:id', userAuth, adminAuth, getCateryById);
router.post('/category', userAuth, adminAuth, createCategory);
router.put('/category/:id', userAuth, adminAuth, editCategory);
router.delete('/category/:id', userAuth, adminAuth, deleteCategory);




module.exports = router;
 