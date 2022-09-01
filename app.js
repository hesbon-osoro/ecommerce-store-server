const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const errorMiddleware = require('./middleware/error');
// Route Imports
const product = require('./routes/product');
const user = require('./routes/user');
const order = require('./routes/order');
const payment = require('./routes/payment');

const app = express();

// config
if (process.env.NODE_ENV !== 'PRODUCTION') {
	require('dotenv').config({ path: 'config/config.env' });
}

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.use('/api/v1', product);
app.use('/api/v1', user);
app.use('/api/v1', order);
app.use('/api/v1', payment);

app.use(express.static(path.join(__dirname, '~/Web/ecommerce-store/build')));

app.get('*', (req, res) => {
	res.sendFile(
		path.resolve(__dirname, '~/Web/ecommerce-store/build/index.html')
	);
});

// Middleware for Errors
app.use(errorMiddleware);

module.exports = app;
