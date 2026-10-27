import mongoose from "mongoose";
const { Schema } = mongoose;
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);
const sessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});
const expenseSchema = new Schema(
  { id: String, title: String, amount: Number, category: String, date: String },
  { _id: false },
);
const stopSchema = new Schema(
  {
    id: String,
    title: String,
    day: Number,
    time: String,
    durationMinutes: { type: Number, default: 60 },
    notes: String,
  },
  { _id: false },
);
const entrySchema = new Schema(
  { id: String, title: String, body: String, date: String, mood: String },
  { _id: false },
);
const tripSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: String,
    destination: String,
    country: String,
    startDate: String,
    endDate: String,
    status: String,
    planStatus: { type: String, default: "Draft" },
    budget: Number,
    currency: String,
    cover: String,
    notes: String,
    expenses: [expenseSchema],
    itinerary: [stopSchema],
    entries: [entrySchema],
  },
  { timestamps: true },
);
export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Session =
  mongoose.models.Session || mongoose.model("Session", sessionSchema);
export const Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema);
let connection;
export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    const error = new Error(
      "Cloud storage is not configured yet. You can still explore the demo.",
    );
    error.status = 503;
    throw error;
  }
  if (mongoose.connection.readyState === 1) return;
  connection ??= mongoose
    .connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 5,
    })
    .catch((error) => {
      connection = undefined;
      throw error;
    });
  await connection;
}
