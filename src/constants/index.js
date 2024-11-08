const { config } = require ('dotenv');
config();


module.exports = {
    PORT : process.env.PORT || 80,
    SERVER_URL: "bQdsnC6cmer2a1VK9Ldrq0rjdIWfyaCL@dpg-csmnk1o8fa8c73a988hg-a.oregon-postgres.render.com",
    CLIENT_URL: "https://tipicos-chiroy-web.onrender.com",
    SECRET: "Mi_mensaje_Secreto",
    DB_NAME: "tipicoschiroydb", 
    DB_USERNAME: "postgresdb", 
    DB_PASSWORD: "bQdsnC6cmer2a1VK9Ldrq0rjdIWfyaCL",
    DB_HOST: "dpg-csmnk1o8fa8c73a988hg-a",
    // DB_DIALECT: process.env.DB_DIALECT,
    DB_PORT: 5432
}


// PORT : process.env.PORT,
// SERVER_URL: process.env.SERVER_URL,
// CLIENT_URL: process.env.CLIENT_URL,
// SECRET: process.env.SECRET,
// DB_NAME: process.env.DB_NAME, 
// DB_USERNAME: process.env.DB_USERNAME, 
// DB_PASSWORD: process.env.DB_PASSWORD,
// DB_HOST: process.env.DB_HOST,
// // DB_DIALECT: process.env.DB_DIALECT,
// DB_PORT: process.env.DB_PORT
