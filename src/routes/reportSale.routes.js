const { Router } = require('express');
const { daySalesPdf, weeklySalesPdf, monthlySalePdf, SelecteddaySalesPdf, selectedweeklySalesPdf, selectedmonthlySalePdf } = require('../controllers/pdf/sales/sales');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware');

const router = Router();

router.get('/pdfsday',   daySalesPdf)
router.get('/selectedpdfsday',   SelecteddaySalesPdf )


router.get('/weeksalepdf',  weeklySalesPdf)
router.get('/selectedweeksalepdf',  selectedweeklySalesPdf)


router.get('/monthsalepdf',  monthlySalePdf)

router.get('/selectedmonthsalepdf',  selectedmonthlySalePdf)



module.exports = router;



// router.get('/pdfsday', userAuth, adminAuth,  daySalesPdf)
// router.get('/selectedpdfsday', userAuth, adminAuth,  SelecteddaySalesPdf )


// router.get('/weeksalepdf', userAuth, adminAuth, weeklySalesPdf)
// router.get('/selectedweeksalepdf', userAuth, adminAuth, selectedweeklySalesPdf)


// router.get('/monthsalepdf', userAuth, adminAuth, monthlySalePdf)

// router.get('/selectedmonthsalepdf', userAuth, adminAuth, selectedmonthlySalePdf)

