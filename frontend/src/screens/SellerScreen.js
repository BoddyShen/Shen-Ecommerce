import { useContext, useEffect, useReducer } from 'react';
import { Helmet } from 'react-helmet-async';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

import Product from '../components/Products';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Button from 'react-bootstrap/esm/Button';
import Container from 'react-bootstrap/esm/Container';
import Rating from '../components/Rating';
import { Store } from '../Store';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        products: action.payload,
        seller: action.user,
        loading: false,
      };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
// /seller/profile/:id
export default function SellerScreen() {
  const params = useParams();
  const { id: sellerId } = params;
  const { state } = useContext(Store);
  const { userInfo } = state;

  const [{ loading, error, products, seller }, dispatch] = useReducer(reducer, {
    products: [],
    loading: true,
    error: '',
    seller: '',
  });

  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const result = await axios.get(
          `/api/products/seller/profile/${sellerId}`
        );

        dispatch({
          type: 'FETCH_SUCCESS',
          payload: result.data.products,
          user: result.data.seller,
        });
      } catch (err) {
        // console.log(err);
        dispatch({ type: 'FETCH_FAIL', payload: err.message });
      }
    };
    fetchData();
  }, [sellerId]); //for render at the begining

  return (
    <div>
      <Helmet>
        <title></title>
      </Helmet>

      <div>
        {loading ? (
          <LoadingBox></LoadingBox>
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <Container>
            <Col>
              <Card className="profile mb-3">
                <Row>
                  <Col></Col>
                  <Col>
                    <Card.Body>
                      <Card.Title>{seller.name}</Card.Title>

                      <Rating
                        rating={seller.seller.rating}
                        numReviews={seller.seller.numReviews}
                      />
                      <Card.Text>{seller.seller.description}</Card.Text>
                      {userInfo &&
                        (userInfo._id === sellerId || userInfo.isAdmin) && (
                          <Button
                            onClick={() => {
                              navigate(`/seller/profile/edit/${sellerId}`);
                            }}
                          >
                            Edit Profile
                          </Button>
                        )}
                    </Card.Body>
                  </Col>
                  <Col>
                    <img
                      src={seller.seller.logo}
                      className="img-thumbnail2 rounded"
                      alt={seller.name}
                    />
                  </Col>
                  <Col></Col>
                </Row>
              </Card>
            </Col>

            <Row>
              {products.map((product) => (
                <Col key={product.slug} sm={6} md={4} lg={3} className="mb-3">
                  <Product product={product}></Product>
                </Col>
              ))}
            </Row>
          </Container>
        )}{' '}
      </div>
    </div>
  );
}
