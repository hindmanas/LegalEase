import mongoose from 'mongoose';

const clauseSchema = new mongoose.Schema(
  {
    title: String,
    category: String,
    explanation: String
  },
  { _id: false }
);

const riskSchema = new mongoose.Schema(
  {
    title: String,
    level: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    explanation: String,
    suggestion: String,
    excerpt: String
  },
  { _id: false }
);

const hiddenChargeSchema = new mongoose.Schema(
  {
    title: String,
    amount: String,
    explanation: String,
    excerpt: String
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    summary: String,
    simplifiedText: String,
    documentOverview: String,
    keyInformation: String,
    clauses: [clauseSchema],
    risks: [riskSchema],
    hiddenCharges: [hiddenChargeSchema],
    provider: String,
    analyzedAt: Date
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    extractedText: { type: String, default: '' },
    status: { type: String, enum: ['uploaded', 'parsed', 'analyzed', 'failed'], default: 'uploaded' },
    analysis: analysisSchema
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
