const { Router } = require('express');
const { userAuth, adminAuth } = require ('../middlewares/auth.middleware');
const { createDailyBox, allBox, closeDailyBox, getPreviousEndingBalance, getActiveDailyBoxStatus, getByIdBox } = require('../controllers/boxdaily');
const router = Router();
router.get('/allBox', userAuth, allBox);

router.get('/box/:id', userAuth, getByIdBox)
/**esto es para obtener el saldo anterior */
router.get('/ending', userAuth, getPreviousEndingBalance);
/**esto es para obtener el estado actual de caja */
router.get('/status', userAuth, getActiveDailyBoxStatus);

router.post('/boxd', userAuth, createDailyBox);

router.put('/closebox/:id', userAuth, closeDailyBox);




module.exports = router;