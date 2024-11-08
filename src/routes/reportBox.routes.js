const { Router } = require('express');
const { dailyBoxReportPdf, weeklyBoxPdf, monthlyBoxPdf, selectedweeklyBoxPdf, selectedmonthlyBoxPdf } = require('../controllers/pdf/cashBox/cashbox');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware');

const router = Router();

router.get('/pdfbox/:id',  dailyBoxReportPdf )

router.get('/weekboxpdf',  weeklyBoxPdf)
router.get('/selectedweekboxpdf',  selectedweeklyBoxPdf)

router.get('/monthboxpdf',  monthlyBoxPdf)
router.get('/selectedmonthboxpdf',  selectedmonthlyBoxPdf)




module.exports = router;


// router.get('/pdfbox/:id', userAuth, adminAuth, dailyBoxReportPdf )

// router.get('/weekboxpdf', userAuth, adminAuth, weeklyBoxPdf)
// router.get('/selectedweekboxpdf', userAuth, adminAuth, selectedweeklyBoxPdf)

// router.get('/monthboxpdf', userAuth, adminAuth, monthlyBoxPdf)
// router.get('/selectedmonthboxpdf', userAuth, adminAuth, selectedmonthlyBoxPdf)


