import { createContext, useReducer } from 'react';

export const Store = createContext();

const initialState = {
  userInfo: localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null,

  cart: {
    shippingAddress: localStorage.getItem('shippingAddress')
      ? JSON.parse(localStorage.getItem('shippingAddress'))
      : {},
    paymentMethod: localStorage.getItem('paymentMethod')
      ? localStorage.getItem('paymentMethod')
      : '',

    cartItems: localStorage.getItem('cartItems')
      ? JSON.parse(localStorage.getItem('cartItems'))
      : [],
  },
};
function reducer(state, action) {
  switch (action.type) {
    case 'CART_ADD_ITEM':
      // add to cart
      // ctxDispatch({
      //type: 'CART_ADD_ITEM',
      //payload: { ...product, quantity },});
      //所以cart的item會多一個quantity表示放在cart裡的數量
      const newItem = action.payload;
      const existItem = state.cart.cartItems.find(
        (item) => item._id === newItem._id
      );
      //如果newItem在cart裡(existItem存在)，就map所有item，是新的就更新成newItem，
      //不是的其他item保持原樣
      //如果不在，那就展開加入newItem
      const cartItems = existItem
        ? state.cart.cartItems.map((item) =>
            item._id === existItem._id ? newItem : item
          )
        : [...state.cart.cartItems, newItem];

      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      //update cart(return 新的 state)
      return { ...state, cart: { ...state.cart, cartItems } };
    case 'CART_REMOVE_ITEM': {
      const cartItems = state.cart.cartItems.filter(
        // remove -> 商品id不同者才能過filter
        (item) => item._id !== action.payload._id
      );
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      return { ...state, cart: { ...state.cart, cartItems } };
    }

    case 'CART_CLEAR':
      return { ...state, cart: { ...state.cart, cartItems: [] } };

    case 'USER_SIGNIN':
      return { ...state, userInfo: action.payload }; //sign in 時在store state放入使用者資訊

    case 'USER_SIGNOUT':
      return {
        ...state,
        userInfo: null,
        cart: {
          cartItems: [],
          shippingAddress: {},
          paymentMethod: '',
        },
      };

    case 'SAVE_SHIPPING_ADDRESS':
      return {
        ...state,
        cart: {
          ...state.cart,
          shippingAddress: action.payload,
        },
      };

    case 'SAVE_PAYMENT_METHOD':
      return {
        ...state,
        cart: {
          ...state.cart,
          paymentMethod: action.payload,
        },
      };

    default:
      return state;
  }
}
//StoreProvider兩個標籤夾的是props
export function StoreProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { state, dispatch };
  return <Store.Provider value={value}>{props.children} </Store.Provider>;
}
