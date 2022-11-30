import bcrypt from 'bcryptjs';

const data = {
  users: [
    {
      name: 'Basir',
      email: 'admin@example.com',
      password: bcrypt.hashSync('123456'),
      isAdmin: true,
    },
    {
      name: 'John',
      email: 'user@example.com',
      password: bcrypt.hashSync('123456'),
      isAdmin: false,
    },
  ],

  products: [
    {
      // _id: '1',
      name: 'Goopi jacket',
      slug: 'goopi-jacket',
      category: 'Shirts',
      image: '/images/p1.jpeg',
      price: 120,
      countInStock: 10,
      brand: 'Nike',
      rating: 3.5,
      numReviews: 10,
      description: 'high quality shirt',
    },
    {
      // _id: '2',
      name: 'Goopi jacket2',
      slug: 'goopi-jacket2',
      category: 'Shirts',
      image: '/images/p2.jpeg',
      price: 120,
      countInStock: 0,
      brand: 'Nike',
      rating: 4.5,
      numReviews: 10,
      description: 'high quality shirt',
    },
    {
      // _id: '3',
      name: 'Goopi shirts',
      slug: 'goopi-shirts',
      category: 'Shirts',
      image: '/images/p3.jpeg',
      price: 120,
      countInStock: 10,
      brand: 'Nike',
      rating: 4.5,
      numReviews: 10,
      description: 'high quality shirt',
    },
  ],
};

export default data;
