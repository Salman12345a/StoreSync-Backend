import mongoose from "mongoose";
import Product from "../../models/products.js";

export const getProductByCategoryId = async (req, reply) => {
  const { categoryId } = req.params;

  try {
    // Validate if categoryId is a valid ObjectId
    if (!mongoose.isValidObjectId(categoryId)) {
      return reply.status(400).send({ message: "Invalid categoryId format" });
    }

    // Query the products using the correct field name (Category) and ObjectId
    const products = await Product.find({
      Category: new mongoose.Types.ObjectId(categoryId),
    })
      .select("-__v") // Exclude the version key
      .exec();

    // Handle case where no products are found
    if (!products || products.length === 0) {
      return reply
        .status(404)
        .send({ message: "No products found for this category" });
    }

    // Return the found products
    return reply.send(products);
  } catch (error) {
    // Handle any unexpected errors

    return reply.status(500).send({ message: "An error occurred", error });
  }
};
