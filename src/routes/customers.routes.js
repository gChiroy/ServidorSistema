const { Router } = require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware')

const { allCustomer, customersById, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customers')
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const router = Router();

router.get("/allCustomers", userAuth, allCustomer)
router.get("/customer/:id", userAuth, customersById)
router.post("/customer", userAuth, createCustomer)
router.put("/customer/:id", userAuth, updateCustomer)
router.delete("/customer/:id", userAuth, adminAuth, deleteCustomer)


module.exports = router;