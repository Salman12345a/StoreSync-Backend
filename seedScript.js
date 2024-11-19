import "dotenv/config.js";
import mongoose from "mongoose";
import { Category, Product } from "./src/models/index.js";
import { categories, products } from "./seedData.js";

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Category.deleteMany({});

    const categoryDocs = await Category.insertMany(categories);

    const categoryMap = categoryDocs.reduce((map, category) => {
      map[category.name] = category._id; // Correctly mapping category name to _id
      return map;
    }, {});

    // Ensure each product has the correct category _id (with uppercase 'C' for Category)
    const productWithCategoryIds = products.map((product) => {
      const categoryId = categoryMap[product.category]; // Find category _id from the map
      if (!categoryId) {
        throw new Error(
          `Category ${product.category} not found for product ${product.name}`
        );
      }
      return {
        ...product,
        Category: categoryId, // Correctly using 'Category' with uppercase 'C'
      };
    });

    await Product.insertMany(productWithCategoryIds);
    console.log("DATABASE SEEDED SUCCESSFULLY");
  } catch (error) {
    console.error("Error Seeding database:", error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();
