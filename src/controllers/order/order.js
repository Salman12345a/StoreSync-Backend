import Order from "../../models/order.js";
import Branch from "../../models/branch.js";
import { Customer, DeliveryPartner } from "../../models/user.js";

// Default location template for fallback
const defaultLocation = {
  latitude: 0,
  longitude: 0,
  address: "No address available",
};

export const createOrder = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { items, branch, totalPrice } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return reply
        .status(400)
        .send({ message: "Invalid or missing items array" });
    }
    if (!branch || !totalPrice) {
      return reply
        .status(400)
        .send({ message: "Branch and total price are required" });
    }

    // Fetch customer and branch data
    const customerData = await Customer.findById(userId);
    const branchData = await Branch.findById(branch);

    if (!customerData) {
      return reply.status(404).send({ message: "Customer not found" });
    }
    if (!branchData) {
      return reply.status(404).send({ message: "Branch not found" });
    }

    // Validate and map items
    const mappedItems = items.map((item) => {
      if (!item.id || !item.count) {
        throw new Error("Each item must include `id` and `count` fields");
      }
      return { id: item.id, item: item.id, count: Number(item.count) };
    });

    // Create order locations
    const deliveryLocation = {
      latitude: customerData.liveLocation?.latitude || defaultLocation.latitude,
      longitude:
        customerData.liveLocation?.longitude || defaultLocation.longitude,
      address: customerData.address || defaultLocation.address,
    };

    const pickupLocation = {
      latitude: branchData.location?.latitude || defaultLocation.latitude,
      longitude: branchData.location?.longitude || defaultLocation.longitude,
      address: branchData.address || defaultLocation.address,
    };

    const newOrder = new Order({
      customer: userId,
      items: mappedItems,
      branch,
      totalPrice,
      deliveryLocation,
      pickupLocation,
    });

    const savedOrder = await newOrder.save();
    return reply.status(201).send(savedOrder);
  } catch (err) {
    console.error("Error Creating Order:", err.message);
    return reply
      .status(500)
      .send({ message: "Failed to create order", error: err.message });
  }
};

export const confirmOrder = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;
    const { deliveryPersonLocation } = req.body;

    const deliveryPerson = await DeliveryPartner.findById(userId);
    if (!deliveryPerson) {
      return reply.status(404).send({ message: "Delivery Person not found" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return reply.status(404).send({ message: "Order not found" });
    }
    if (order.status !== "available") {
      return reply.status(400).send({ message: "Order is not available" });
    }

    order.status = "confirmed";
    order.deliveryPartner = userId;
    order.deliveryPersonLocation = {
      latitude: deliveryPersonLocation?.latitude || defaultLocation.latitude,
      longitude: deliveryPersonLocation?.longitude || defaultLocation.longitude,
      address: deliveryPersonLocation?.address || defaultLocation.address,
    };

    await order.save();
    req.server.io.to(orderId).emit("orderConfirmed", order);

    return reply.send(order);
  } catch (err) {
    console.error("Error Confirming Order:", err.message);
    return reply
      .status(500)
      .send({ message: "Failed to confirm order", error: err.message });
  }
};

export const updateOrderStatus = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryPersonLocation } = req.body;
    const { userId } = req.user;

    const deliveryPerson = await DeliveryPartner.findById(userId);
    if (!deliveryPerson) {
      return reply.status(404).send({ message: "Delivery Person not found" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return reply.status(404).send({ message: "Order not found" });
    }
    if (["cancelled", "delivered"].includes(order.status)) {
      return reply
        .status(400)
        .send({ message: "Order cannot be updated at this stage" });
    }
    if (order.deliveryPartner.toString() !== userId) {
      return reply.status(403).send({ message: "Unauthorized action" });
    }

    order.status = status;
    order.deliveryPersonLocation = deliveryPersonLocation;
    await order.save();

    req.server.io.to(orderId).emit("liveTrackingUpdates", order);
    console.log(
      "Order updated successfully, emitting LiveTrackingUpdates:",
      order
    );

    return reply.send(order);
  } catch (err) {
    console.error("Error Updating Order Status:", err.message);
    return reply
      .status(500)
      .send({ message: "Failed to update order status", error: err.message });
  }
};

export const getOrders = async (req, reply) => {
  try {
    const { status, customerId, deliveryPartnerId, branchId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (customerId) query.customer = customerId;
    if (deliveryPartnerId) query.deliveryPartner = deliveryPartnerId;
    if (branchId) query.branch = branchId;

    const orders = await Order.find(query).populate(
      "customer branch items.item deliveryPartner"
    );

    return reply.send(orders);
  } catch (err) {
    console.error("Error Fetching Orders:", err.message);
    return reply
      .status(500)
      .send({ message: "Failed to retrieve orders", error: err.message });
  }
};

export const getOrderById = async (req, reply) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate(
      "customer branch items.item deliveryPartner"
    );

    if (!order) {
      return reply.status(404).send({ message: "Order not found" });
    }

    return reply.send(order);
  } catch (err) {
    console.error("Error Fetching Order By ID:", err.message);
    return reply
      .status(500)
      .send({ message: "Failed to retrieve order", error: err.message });
  }
};
