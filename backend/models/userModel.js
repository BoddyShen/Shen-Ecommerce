import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false, required: true },
    seller: {
      logo: {
        type: String,
        default:
          'https://res.cloudinary.com/ddoxghbna/image/upload/v1670774942/uo3tdnidmalfr9gtxpuf.jpg',
      },
      description: {
        type: String,
        default: 'Welcome to my store!',
        required: true,
      },
      rating: { type: Number, default: 0, required: true },
      numReviews: { type: Number, default: 0, required: true },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;
