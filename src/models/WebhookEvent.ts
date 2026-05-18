import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookEvent extends Document {
  eventId: string;
  processed: boolean;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    processed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);

export default WebhookEvent;
