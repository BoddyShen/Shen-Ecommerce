import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import { isAuth, isAdmin } from '../utils.js';
import mongoose from 'mongoose';

const orderRouter = express.Router();

orderRouter.get(
  '/',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    let sellerMode = query.seller;
    let filter = {};
    sellerMode === 'true' ? (filter = { seller: req.user._id }) : (filter = {});

    const orders = await Order.find(filter)
      .populate('buyer', 'name')
      .populate('seller', 'name');

    res.send(orders);
  })
);

orderRouter.post(
  '/',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    for (let i = 0; i < req.body.orderItems.length; i++) {
      const existedProduct = await Product.findById(req.body.orderItems[i]._id);

      if (
        !existedProduct ||
        existedProduct.countInStock < req.body.orderItems[i].quantity
      ) {
        res.status(404).send({ message: 'Product Not Found or Out of stock.' });
        return;
      }
    }
    for (let i = 0; i < req.body.orderItems.length; i++) {
      const existedProduct = await Product.findById(req.body.orderItems[i]._id);

      existedProduct.countInStock =
        existedProduct.countInStock - req.body.orderItems[i].quantity;
      await existedProduct.save();
    }

    const newOrder = new Order({
      orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      itemsPrice: req.body.itemsPrice,
      shippingPrice: req.body.shippingPrice,
      taxPrice: req.body.taxPrice,
      totalPrice: req.body.totalPrice,
      buyer: req.user._id,
      seller: req.body.seller,
    });
    const order = await newOrder.save();
    res.status(201).send({ message: 'New Order Created', order });
  })
);

orderRouter.get(
  '/summary',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);
    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: { $sum: 1 },
        },
      },
    ]);
    console.log(users);

    const dailyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          sales: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const productCategories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);
    res.send({ users, orders, dailyOrders, productCategories });
  })
);

orderRouter.get(
  '/seller/summary',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    // console.log(req.user._id);
    const orders = await Order.aggregate([
      {
        $match: { seller: mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);

    const userNum = await Order.aggregate([
      {
        $match: { seller: mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $group: {
          _id: '$buyer',
        },
      },
    ]);

    const users = [{ numUsers: userNum.length }];

    const dailyOrders = await Order.aggregate([
      {
        $match: { seller: mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          sales: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const productCategories = await Product.aggregate([
      {
        $match: { sellerID: mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);
    res.send({ users, orders, dailyOrders, productCategories });
  })
);

//orderHistory
orderRouter.get(
  '/mine',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('buyer', 'name')
      .populate('seller', 'name');

    res.send(orders);
  })
);
orderRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.put(
  '/:id/deliver',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (
      order &&
      (order.seller._id.toHexString() === req.user._id || req.user.isAdmin)
    ) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      await order.save();
      res.send({ message: 'Order Delivered' });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.put(
  '/:id/pay',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };
      const updatedOrder = await order.save();
      res.send({ message: 'Order Paid', order: updatedOrder });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.delete(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (
      order &&
      (order.seller._id.toHexString() === req.user._id || req.user.isAdmin)
    ) {
      await order.remove();
      res.send({ message: 'Order Deleted' });
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

export default orderRouter;
