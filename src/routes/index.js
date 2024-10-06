const fs = require('fs');
const path = require('path');

const routes = {};

const routesDir = path.join(__dirname);

fs.readdirSync(routesDir).forEach((file) => {
    if (file !== 'index.js' && file.endsWith('.js')) {
        const routePath = path.join(routesDir, file);
        const routeName = file.replace('.js', ''); // Nombre de la ruta sin la extensión
        routes[routeName] = require(routePath);
    }
});

module.exports = routes;
