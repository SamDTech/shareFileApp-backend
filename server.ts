import express, { urlencoded } from "express";
import dotenv from "dotenv";
import cors from "cors";
import colors from "colors";
import connectDB from "./config/db";
import errorMiddleware from "./middlewares/errorHandler";
import fileRoute from "./routes/fileRoute";
import cloudinaryConfig from "./utils/cloudinary";
const app = express();
// configure colors
colors.enable();
app.use(cors({ origin: "*" }));

dotenv.config();

// connect to DB
connectDB();

// configure cloudinary
cloudinaryConfig();

// MIDDLEWARES

app.use(express.json());
//app.use(urlencoded({extended: true}))

const PORT = process.env.PORT;

// Mount Routes
app.use("/api/files", fileRoute);

//global Error Handler
app.use(errorMiddleware);

app.listen(PORT, () =>
  console.log(`App running on PORT ${PORT}`.underline.cyan.bold)
);
