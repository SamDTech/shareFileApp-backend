import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log('DB Connected'.underline.green.bold);
  } catch (error) {
    console.log('Error Connection DB'.red.bold);
  }
};

export default connectDB;
