import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    index: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model('Chunk', chunkSchema);
