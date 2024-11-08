const { Router } = require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware');
const { dayPurPdf, weeklyPurPdf, monthlyPurPdf, selectdayPurPdf, selectweeklyPurPdf, selectmonthlyPurPdf } = require('../controllers/pdf/purchase/reports/purchaseday');

const router = Router();

router.get('/pdfpday',  dayPurPdf);
router.get('/weekpurpdf', weeklyPurPdf);
router.get('/monthpurpdf',  monthlyPurPdf);

router.get('/pdfpday/pdf',  selectdayPurPdf);
router.get('/pdfsweek/pdf',  selectweeklyPurPdf);
router.get('/pdfsmonthly/pdf',  selectmonthlyPurPdf);




module.exports = router;


// router.get('/pdfpday', userAuth, adminAuth, dayPurPdf);
// router.get('/weekpurpdf', userAuth, adminAuth, weeklyPurPdf);
// router.get('/monthpurpdf', userAuth, adminAuth, monthlyPurPdf);

// router.get('/pdfpday/pdf', userAuth, adminAuth, selectdayPurPdf);
// router.get('/pdfsweek/pdf', userAuth, adminAuth, selectweeklyPurPdf);
// router.get('/pdfsmonthly/pdf', userAuth, adminAuth, selectmonthlyPurPdf);


