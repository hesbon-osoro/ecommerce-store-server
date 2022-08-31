const Product = require('../models/product');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ApiFeatures = require('../utils/apifeatures');
const cloudinary = require('cloudinary');

// Create Product -- Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
	let images = [];
	if (typeof req.body.images === 'string') {
		images.push(req.body.images);
	} else {
		images = req.body.images;
	}
	const imagesLinks = [];
	for (let image of images) {
		const result = await cloudinary.v2.uploader.upload(image, {
			folder: 'products',
		});
		imagesLinks.push({
			public_id: result.public_id,
			url: result.secure_url,
		});
	}
	req.body.images = imagesLinks;
	req.body.user = req.user.id;

	const product = await Product.create(req.body);
	res.status(201).json({ success: true, product });
});

// Get All Products
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
	const resultPerPage = 8;
	const productsCount = await Product.countDocuments();

	const apiFeature = new ApiFeatures(Product.find(), req.query)
		.search()
		.filter();

	let products = await apiFeature.query;

	let filteredProductsCount = products.length;

	apiFeature.pagination(resultPerPage);

	products = await apiFeature.query;

	res.status(200).json({
		success: true,
		products,
		productsCount,
		resultPerPage,
		filteredProductsCount,
	});
});

// Get all product (Admin)
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
	const products = await Product.find();

	res.status(200).json({ success: true, products });
});

// Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
	const product = await Product.findById(req.params.id);

	if (!product) {
		return next(new ErrorHandler('Product not found', 404));
	}

	res.status(200).json({ success: true, product });
});

// Update Product -- Admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
	let product = await Product.findById(req.params.id);
	if (!product) {
		return next(new ErrorHandler('Product not found', 404));
	}
	// Images start here
	let images = [];
	if (typeof req.body.images === 'string') {
		images.push(req.body.images);
	} else {
		images = req.body.images;
	}
	if (images !== undefined) {
		// Deleting Images from Cloudinary
		for (let image of product.images) {
			await cloudinary.v2.uploader.destroy(image.public_id);
		}
		const imagesLinks = [];
		for (let image of images) {
			const result = await cloudinary.v2.uploader.upload(image, {
				folder: 'products',
			});

			imagesLinks.push({
				public_id: result.public_id,
				url: result.secure_url,
			});
		}
		req.body.images = imagesLinks;
	}
	product = await Product.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});
	res.status(200).json({ success: true, product });
});

// Delete Product
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
	const product = await Product.findById(req.params.id);
	if (!product) {
		return next(new ErrorHandler('Product not found', 404));
	}
	// Deleting images from cloudinary
	for (let image of product.images) {
		await cloudinary.v2.uploader.destroy(image.public_id);
	}
	await product.remove();
	res
		.status(200)
		.json({ success: true, message: 'Product deleted successfully' });
});

// Create new review or Update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
	const { rating, comment, productId } = req.body;
	const review = {
		user: req.user._id,
		name: req.user.name,
		rating: Number(rating),
		comment,
	};
	const product = await Product.findById(productId);
	const isReviewed = product.reviews.find(
		review => review.user.toString() === req.user._id.toString()
	);
	if (isReviewed) {
		product.reviews.forEach(review => {
			if (review.user.toString() === req.user._id.toString())
				(review.rating = rating), (review.comment = comment);
		});
	} else {
		product.reviews.push(review);
		product.numOfReviews = product.reviews.length;
	}
	let avg = 0;
	product.reviews.forEach(review => {
		avg += review.rating;
	});
	product.ratings = avg / product.reviews.length;
	await product.save({ validateBeforeSave: false });
	res.status(200).json({ success: true });
});

// Get all reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
	const product = await Product.findById(req.query.id);
	if (!product) {
		return next(new ErrorHandler('Product not found', 404));
	}
	res.status(200).json({ success: true, reviews: product.reviews });
});

// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
	const product = await Product.findById(req.query.productId);
	if (!product) {
		return next(new ErrorHandler('Product not found', 404));
	}
	const reviews = product.reviews.filter(
		review => review._id.toString() !== req.query.id.toString()
	);
	let avg = 0;
	reviews.forEach(review => {
		avg += review.rating;
	});
	let ratings;
	if (reviews.length === 0) {
		ratings = 0;
	} else {
		ratings = avg / reviews.length;
	}
	const numOfReviews = reviews.length;
	await Product.findByIdAndUpdate(
		req.query.productId,
		{ reviews, ratings, numOfReviews },
		{ new: true, runValidators: true, useFindAndModify: false }
	);
	res.status(200).json({ success: true });
});
