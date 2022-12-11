import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import Rating from './Rating';
import axios from 'axios';
import { useContext } from 'react';
import { Store } from '../Store';
import { toast } from 'react-toastify';
//Products in HomeScreen
//props是HomeScreen裡<Product product={product}></Product>給的props，
//如果裡面有文字要用props.children

function Product(props) {
  const { product } = props;
  //Store 傳state, dispatch出來
  const { state, dispatch: ctxDispatch } = useContext(Store);
  //解構state可以讓cartItems得到item的array
  const {
    cart: { cartItems },
  } = state;

  const addToCartHandler = async (item) => {
    const existItem = cartItems.find((x) => x._id === product._id);
    //如果item存在在cartItem裡就quantity ＝existItem.quantity + 1，不然為1
    //再確認庫存，沒有就return，不然就dispatch CART_ADD_ITEM
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${item._id}`);
    if (data.countInStock < quantity) {
      toast.error('Sorry. Product is out of stock');
      return;
    }
    //quantity: quantity -> quantity
    ctxDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...item, quantity },
    });
    toast.success('Add to cart!');
  };

  return (
    <Card>
      <Link to={`/product/${product.slug}`}>
        <img
          src={product.image}
          className="card-img-top card-height "
          alt={product.name}
        />
      </Link>
      <Card.Body>
        <Link to={`/product/${product.slug}`} className="seller">
          <Card.Title>{product.name}</Card.Title>
        </Link>
        <Rating rating={product.rating} numReviews={product.numReviews} />
        <Card.Text>${product.price}</Card.Text>
        <Link to={`/seller/profile/${product.sellerID._id}`} className="seller">
          <Card.Text className="seller">
            Seller: {product.sellerID.name}
          </Card.Text>
        </Link>
        {product.countInStock === 0 ? (
          <Button variant="light" disabled>
            Out of stock
          </Button>
        ) : (
          <Button onClick={() => addToCartHandler(product)}>Add to cart</Button>
        )}
      </Card.Body>
    </Card>
  );
}
export default Product;
