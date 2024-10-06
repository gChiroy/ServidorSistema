const { check } = require('express-validator')
const SupplierCompany = require('../models/Category_Providers')
const Provider = require('../models/Providers')


const existinProvider = check('name').custom(async (value) => {
    const name = await Provider.findOne({where: { name : value}});
    if(name){
        throw new Error('El trabajador ya esta registrado')
    }
})
const existinnitProvider = check('nit').custom(async (value) => {
    const nit = await Provider.findOne({where: { nit : value}});
    if(nit){
        throw new Error('Nit de trabajador ya  registrado')
    }
})

const exisPhoneWor = check('phone').custom(async (value)=> {
    const phone =  await Provider.findOne({where:{ phone: value}})
    if (phone) {
        throw new Error('El numero telefonico del trabajador ya esta en uso')
        
    }
})


const existingCompany =  check('name').custom(async (value)=>{
  const company = await SupplierCompany.findOne({where: { name: value}});
  if (company){
    throw new Error('El tipo proveedor ya esta registrado')
  }
})

module.exports = {
    companyValid: [existingCompany],
    providerValid: [ existinProvider, exisPhoneWor, existinnitProvider ]
}