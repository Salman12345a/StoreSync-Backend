import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Corrected 'reuired' to 'required'
  sequence_value: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
