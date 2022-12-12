import express from 'express';
import Product from '../models/productModel.js';
import expressAsyncHandler from 'express-async-handler';
import { isAuth, isAdmin, isAdminOrSeller } from '../utils.js';
import User from '../models/userModel.js';

const productRouter = express.Router();

//render all products on HomeScreen
productRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const products = await Product.find().populate('sellerID', 'name');
    res.send(products);
  })
);

//create products
productRouter.post(
  '/',
  isAuth,
  isAdminOrSeller,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Product({
      name: 'sample name ' + Date.now(),
      slug: 'sample-name-' + Date.now(),
      image: 'sample',
      brand: 'sample brand',
      sellerID: req.user._id,
      category: 'sample category',
      description: 'sample description',
      price: 0,
      countInStock: 0,
      rating: 0,
      numReviews: 0,
    });

    const product = await newProduct.save();

    res.send({ message: 'Product Created', product });
  })
);

//Edit product
productRouter.put(
  '/:id',
  isAuth,
  isAdminOrSeller,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (product) {
      product.name = req.body.name;
      product.slug = req.body.slug;
      product.price = req.body.price;
      product.image = req.body.image;
      product.category = req.body.category;
      product.brand = req.body.brand;
      product.countInStock = req.body.countInStock;
      product.description = req.body.description;

      await product.save();
      res.send({ message: 'Product Updated' });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

productRouter.delete(
  '/:id',
  isAuth,
  isAdminOrSeller,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.remove();
      res.send({ message: 'Product Deleted' });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

productRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (product) {
      if (product.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((a, c) => c.rating + a, 0) /
        product.reviews.length;

      const seller = await User.findById(product.sellerID);
      if (seller) {
        let n = seller.seller.numReviews;
        seller.seller.rating =
          (seller.seller.rating * n + Number(req.body.rating)) / (n + 1);
        seller.seller.numReviews = n + 1;
      }
      await seller.save();

      const updatedProduct = await product.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedProduct.reviews[updatedProduct.reviews.length - 1],
        numReviews: product.numReviews,
        rating: product.rating,
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

const PAGE_SIZE = 3;
//product list
productRouter.get(
  '/admin',
  isAuth,
  isAdminOrSeller,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;
    let sellerMode = query.seller;
    let filter = {};

    sellerMode === 'true'
      ? (filter = { sellerID: req.user._id })
      : (filter = {});

    const products = await Product.find(filter)
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countProducts = await Product.countDocuments(filter);
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || '';
    const price = query.price || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? {
            name: {
              $regex: searchQuery,
              $options: 'i',
            },
          }
        : {};
    const categoryFilter = category && category !== 'all' ? { category } : {};
    const ratingFilter =
      rating && rating !== 'all'
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};
    const priceFilter =
      price && price !== 'all'
        ? {
            // 1-50
            price: {
              $gte: Number(price.split('-')[0]),
              $lte: Number(price.split('-')[1]),
            },
          }
        : {};
    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'lowest'
        ? { price: 1 }
        : order === 'highest'
        ? { price: -1 }
        : order === 'toprated'
        ? { rating: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };

    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .populate('sellerID', 'name')
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countProducts = await Product.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct('category');
    res.send(categories);
  })
);

//render a product on ProductScreen
productRouter.get('/slug/:slug', async (req, res) => {
  //find裡是一個callback，並return array中第一個為True的值
  //filter則是return 所有符合的
  const product = await Product.findOne({ slug: req.params.slug }).populate(
    'sellerID',
    'name'
  );
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});
//add cart
productRouter.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    'sellerID',
    'name'
  );
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});

productRouter.get(
  '/seller/profile/:id',
  expressAsyncHandler(async (req, res) => {
    const sellerID = req.params.id;

    const products = await Product.find({ sellerID }).populate(
      'sellerID',
      'name'
    );
    const seller = await User.findById(sellerID);

    res.send({
      products,
      seller,
    });
  })
);

export default productRouter;
