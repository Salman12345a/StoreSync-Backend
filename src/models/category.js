import mongoose from "mongoose";

// Define the category schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensure category name is unique
      trim: true, // Remove leading/trailing whitespace
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
); // Optionally, add timestamps for createdAt and updatedAt

// Create the Category model using the schema
const Category = mongoose.model("Category", categorySchema);

// Export the Category model to use in other files
export default Category;
