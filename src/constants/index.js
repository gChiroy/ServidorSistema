const { config } = require ('dotenv');
config();


module.exports = {
    PORT : process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,
    CLIENT_URL: process.env.CLIENT_URL,
    SECRET: process.env.SECRET,
    DB_NAME: process.env.DB_NAME, 
    DB_USERNAME: process.env.DB_USERNAME, 
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_HOST: process.env.DB_HOST,
    // DB_DIALECT: process.env.DB_DIALECT,
    DB_PORT: process.env.DB_PORT
}