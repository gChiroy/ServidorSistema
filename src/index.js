const { compareSync } = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const app = express();
const { PORT, CLIENT_URL} = require("./constants");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const fs = require("fs");
const path = require("path");
const { sequelize } = require("./db/index.js")



//LIS MODELS START
const {Category} = require('./models/Categories')
const Customer = require('./models/Customers')
const DailyBox = require('./models/Daily_Box')
const DetailSale = require('./models/DetailSales')
const DetailShopping = require('./models/DetailShopping')
const InventoryProduct = require('./models/InventoryProducts')
const MovementBox = require('./models/Movement_Box')
const Product = require('./models/Product')
const Provider = require('./models/Providers')
const Sales = require('./models/Sales')
const SalesMovementBox = require('./models/SalesMovementBox')
const Shopping = require('./models/Shopping')
const ShoppingMovementBox = require('./models/ShoppingMovementBox')
const ProviderCategory = require('./models/Category_Providers.js')
const TypeMovementBox = require('./models/Type_movement_box')
const Users = require('./models/Users')



// require('dotenv').config();


//LIST MODELS END



//import passport middleware
require("./middlewares/passport.middleware");

//initailize middlewares
app.use(express.json());

app.use(cookieParser());
// app.use(cors({ origin: CLIENT_URL, credentials: true }))
// app.use(cors());

var corsOptions = {
  origin: CLIENT_URL,
  credentials: true,
  optionsSuccessStatus: 200 
}

// app.use(cors(corsOptions));
// app.use(cors({
//   origin: process.env.CLIENT_URL,
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
// }));



// app.use(
//   cors({
//     origin: process.env.CLIENT_URL,
//     credentials: true,
//   })
// );

// // Configura opciones de CORS
// const corsOptions = {
//   origin: 'http://localhost:5173', // Origen permitido
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true,  // Habilita el intercambio de cookies y credenciales
//   optionsSuccessStatus: 204,
// };

// // Aplica el middleware de CORS a todas las rutas
// app.use(cors(corsOptions));
app.use(passport.initialize());

//import routes
// const authRoutes = require("./routes/auth.routes");

// //initialize routes
// app.use("/api", authRoutes);

// const routesPath = path.join(__dirname, 'routes'); // Ruta de la carpeta de rutas

// fs.readdirSync(routesPath).forEach(file => {
//   const routePath = path.join(routesPath, file);
//   const route = require(routePath);
//   app.use('/api', route); // Agregar la ruta a la aplicación
// });

const routes = require('./routes');

// Importa las rutas automáticamente
Object.keys(routes).forEach((routeName) => {
    app.use('/api', cors(corsOptions), routes[routeName]);
    // app.use('/api', routes[routeName]);

    
});


//arranca
const appStart = async () => {

  try {
    // const Users = require("./models/Users.js") 
    // await Users.sync();
    
    // await Category.sync({force:true})
    // await Customer.sync({force:true});
    // await DailyBox.sync({force:true})
    // await ProviderCategory.sync({force:true});
    // await Product.sync({force: true})
    // await Sales.sync({force:true})
    // await Users.sync({force:true})
    // await Provider.sync({force:true});
    // await InventoryProduct.sync({force:true})
    // await DetailSale.sync({force:true})
    // await TypeMovementBox.sync({force:true})
    // await Shopping.sync({force:true})
    // await ShoppingMovementBox.sync({force:true})
    // await DetailShopping.sync({force:true})
    // await SalesMovementBox.sync({force:true})
    // await MovementBox.sync({force:true})
   
    // await Category.sync( )
    // await Customer.sync( );
    // await DailyBox.sync( )
    // await ProviderCategory.sync( );
    // await Product.sync()
    // await Sales.sync( )
    // await Users.sync( )
    // await Provider.sync( );
    // await InventoryProduct.sync( )
    // await DetailSale.sync( )
    // await TypeMovementBox.sync( )
    // await Shopping.sync( )
    // await ShoppingMovementBox.sync( )
    // await DetailShopping.sync( )
    // await SalesMovementBox.sync( )
    // await MovementBox.sync( )


    await sequelize.sync({
      alter: true,
    });

    await sequelize.authenticate();
    // console.log("Connection has been established successfully sequelize.");
    app.listen(PORT, () => {
      console.log(`The app is running at PORT : ${PORT}`);
    });
  } catch (error) {
          console.log(`Error: ${error.message}`);


  }
};

exports.module = appStart();
