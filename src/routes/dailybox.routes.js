const { Router } = require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware');
const { createDailyBox, allBox, closeDailyBox, getPreviousEndingBalance, getActiveDailyBoxStatus, getByIdBox } = require('../controllers/boxdaily');
const router = Router();
router.get('/allBox',  allBox);

router.get('/box/:id',  getByIdBox)
/**esto es para obtener el saldo anterior */
router.get('/ending',  getPreviousEndingBalance);
/**esto es para obtener el estado actual de caja */
router.get('/status',  getActiveDailyBoxStatus);

router.post('/boxd',  createDailyBox);

router.put('/closebox/:id',  closeDailyBox);




module.exports = router;

// router.get('/allBox', userAuth, allBox);

// router.get('/box/:id', userAuth, getByIdBox)
// /**esto es para obtener el saldo anterior */
// router.get('/ending', userAuth, getPreviousEndingBalance);
// /**esto es para obtener el estado actual de caja */
// router.get('/status', userAuth, getActiveDailyBoxStatus);

// router.post('/boxd', userAuth, createDailyBox);

// router.put('/closebox/:id', userAuth, closeDailyBox);

