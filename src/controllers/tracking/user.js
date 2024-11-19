import { Customer, DeliveryPartner } from "../../models/index.js";

export const updateUser = async (req, reply) => {
  try {
    const { userId } = req.user; // Extract the userId from the token
    const updateData = req.body; // The data to update the user

    // Find the user based on userId and role (either Customer or DeliveryPartner)
    let user =
      (await Customer.findById(userId)) ||
      (await DeliveryPartner.findById(userId));

    if (!user) {
      return reply.status(404).send({ message: "User not found" });
    }

    // Determine the model to update based on the user's role
    const UserModel = user.role === "Customer" ? Customer : DeliveryPartner;

    // Update the user in the respective model
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return reply.status(404).send({ message: "User not found" });
    }

    return reply.send({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return reply.status(500).send({ message: "Failed to update user", error });
  }
};
