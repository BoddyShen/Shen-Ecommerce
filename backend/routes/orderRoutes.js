import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import { isAuth } from '../utils.js';

const orderRouter = express.Router();
orderRouter.post(
  '/',
  isAuth, //是為了驗證並拿到user._id
  expressAsyncHandler(async (req, res) => {
    const newOrder = new Order({
      //拿到product的_id
      orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      itemsPrice: req.body.itemsPrice,
      shippingPrice: req.body.shippingPrice,
      taxPrice: req.body.taxPrice,
      totalPrice: req.body.totalPrice,
      user: req.user._id,
    });

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

    const order = await newOrder.save();
    res.status(201).send({ message: 'New Order Created', order });
  })
);
export default orderRouter;
