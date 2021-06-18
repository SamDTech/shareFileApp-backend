import { NextFunction, Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import multer from "multer";
import AppError from "../utils/appError";
import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import File from "../model/file";
import https from "https";
import nodemailer from "nodemailer";
import createEmailTemplate from "../utils/createEmailTemplate";

const router = Router();

const storage = multer.diskStorage({});

const upload = multer({
  storage,
});

router.post(
  "/upload",
  upload.single("myFile"),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new AppError(400, "Sorry! we need a file"));
    }

    const upload = await cloudinary.uploader.upload(req.file.path, {
      folder: "shareMe",
      resource_type: "auto",
    });

    if (!upload) {
      return next(new AppError(400, "cloudinary error"));
    }

    // grab name of file
    const { originalname } = req.file;
    const { secure_url, bytes, format } = upload;

    const file = await File.create({
      filename: originalname,
      sizeInBytes: bytes,
      secureUrl: secure_url,
      format,
    });

    res.status(201).json({
      id: file._id,
      downloadPageLink: `${process.env.API_BASE_ENDPOINT_CLIENT}/download/${file._id}`,
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const file = await File.findById(id);

    if (!file) {
      return next(new AppError(404, "File not found"));
    }

    const { filename, format, sizeInBytes } = file;

    res.status(200).json({
      name: filename,
      sizeInBytes,
      format,
      id,
    });
  })
);

router.get(
  "/:id/download",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const file = await File.findById(id);

    if (!file) {
      return next(new AppError(404, "File not found"));
    }

    // get the file from cloudinary
    https.get(file.secureUrl, (fileStream) => {
      fileStream.pipe(res);
    });
  })
);

router.post(
  "/email",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    //1 validate request
    const { id, emailFrom, emailTo } = req.body;

    //2 check if file exists
    const file = await File.findById(id);

    if (!file) {
      return next(new AppError(404, "File not found"));
    }

    //3 create the transporter
    let transporter = nodemailer.createTransport({
      // @ts-ignore
      host: process.env.SENDINBLUE_SMTP_HOST,
      port: process.env.SENDINBLUE_SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: { 
        user: process.env.SENDINBLUE_SMTP_USER, // generated ethereal user
        pass: process.env.SENDINBLUE_SMTP_PASSWORD, // generated ethereal password
      },
    });

    //4 prepare email data
    const { filename, sizeInBytes } = file;

    const fileSize = `${(Number(sizeInBytes) / (1024 * 1024)).toFixed(2)} MB`;

    const downloadPageLink = `${process.env.API_BASE_ENDPOINT_CLIENT}/download/${id}`;

    const mailOptions = {
      from: emailFrom, // sender address
      to: emailTo, // list of receivers
      subject: "File Shared With You✔", // Subject line
      text: `${emailFrom} shared a file with you`, // plain text body
      html: createEmailTemplate(
        emailFrom,
        downloadPageLink,
        filename,
        fileSize
      ), // html body
    };

    //5 send the email
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(error);
        return next(new AppError(500, "server error :("));
      }

      // save in db
      file.sender = emailFrom;
      file.receiver = emailTo;

      await file.save();

      // 6. save the data and send the response
      res.status(200).json({
        message: "Email sent",
      });
    });
  })
);

export default router;
