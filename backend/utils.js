import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );
};

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (authorization) {
    const token = authorization.slice(7, authorization.length); //Bearer xxxxx
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        res.status(401).send({ message: 'Invalid Token' });
      } else {
        req.user = decode;

        next();
      }
    });
  } else {
    res.status(401).send({ message: 'No Token' });
  }
};

//因為isAdmin前面會先isAuth，所以不用verify
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send({ message: 'Invalid Admin Token' });
  }
};

export const isAdminOrSeller = (req, res, next) => {
  if (
    (req.user && req.user.isAdmin) ||
    (req.query && req.query.seller === 'true') ||
    (req.user && req.headers.seller && req.user._id === req.headers.seller)
  ) {
    next();
  } else {
    res.status(401).send({ message: 'Invalid Admin Token' });
  }
};
