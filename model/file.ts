import mongoose, { Document } from 'mongoose';

interface IFile extends Document {
  filename: string;
  secureUrl: string;
  format: string;
  sizeInBytes: string;
  sender?: string;
  receiver?: string;
}

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },

    secureUrl: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },

    sizeInBytes: {
      type: String,
      required: true,
    },
    sender: String,
    receiver: String,
  },
  { timestamps: true }
);

const File = mongoose.model<IFile>('File', fileSchema);

export default File;
