const { Router }= require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware')
const { getProvidersPagi ,allProviders, providerById, registerProvider, updateProvider, deleteProvider, getProviderCompany, allProvidersName, getDelProviders} = require('../controllers/Providers/providers')
const { allSupplier, supplierById, createSupplier, updateSupplier, deleteSupplier, delTruCompany, selectedCategoryProvider, allSupplierCom, deleteCompany } = require('../controllers/Providers/supplierCompany')
const { companyValid, providerValid } = require('../validators/provider')
const { validationMiddleware } =require('../middlewares/validation.middleware')
const router = Router();

router.get('/allProviders', userAuth, adminAuth, allProviders);
// router.get('/allProviders', allProviders);

router.get('/provider/:id', userAuth, adminAuth, providerById);
router.post('/provider', providerValid, validationMiddleware, userAuth, adminAuth, registerProvider);
router.put('/provider/:id', userAuth, adminAuth, updateProvider);
router.delete('/provider/:id', userAuth, adminAuth, deleteProvider);
//saber a que compañia pertenece un proveedor
// router.get("/provider/:id/company", getProviderCompany);
// router.get("/providername", allProvidersName);

router.get('/getdelProvider', userAuth, adminAuth, getDelProviders)

// router.get('/allProvidersPagi/page/:page/perPage/:perPage', getProvidersPagi, userAuth, adminAuth);





router.get('/allCompanies', userAuth, adminAuth, allSupplier);

router.get('/allSupplier', userAuth, adminAuth, allSupplierCom);

router.get('/campany/:id', userAuth, adminAuth, supplierById);
router.post('/campany', companyValid, validationMiddleware, userAuth, adminAuth, createSupplier);
router.put('/campany/:id', userAuth, adminAuth, updateSupplier);
router.delete('/campany/:id', userAuth, adminAuth, deleteSupplier);

router.delete('/deleteCompany/:id', userAuth, adminAuth, deleteCompany);

router.patch('/is_deleted/:id', userAuth, adminAuth, selectedCategoryProvider)



module.exports = router;