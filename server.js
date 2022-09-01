const app = require('./app');
const cloudinary = require('cloudinary');
const connectDatabase = require('./config/database');

// Handle Uncaught Exceptions
process.on('uncaughtException', err => {
	console.log(`Error: ${err.message}`);
	console.log('Shutting Down Server Due To Uncaught Exception');
	process.exit(1);
});

// config
if (process.env.NODE_ENV !== 'PRODUCTION') {
	require('dotenv').config({ path: 'config/config.env' });
}

// Connecting to Database
connectDatabase();

// Setting up config file for cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const server = app.listen(process.env.PORT, () =>
	console.log(
		`Server Started On Port: ${process.env.PORT} in ${process.env.NODE_ENV} mode`
	)
);

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', err => {
	console.log(`Error: ${err.message}`);
	console.log('Shutting Down Server Due To Unhandled Promise Rejection');
	server.close(() => {
		process.exit(1);
	});
});
