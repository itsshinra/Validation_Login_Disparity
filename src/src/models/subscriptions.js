import { Schema, model } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import * as yup from "yup";

export const freeSubscription = {
  name: "free",
  description: "Free subscription",
  cost: 0,
  reward: 0,
  duration: 0,
  unlockedTiers: [],
};

// main Academy subscriptions
export const SubscriptionsSchema = yup
  .object({
    name: yup.string().required(),
    description: yup.string().required(),
    cost: yup.number().required(),
    // in USD
    reward: yup.number().required(),
    // in cubes
    duration: yup.number().required(),
    // in months
    unlockedTiers: yup.array().of(yup.string()).required(), // array of tier names
  })
  .required();

const SubscriptionsDBSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  reward: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  unlockedTiers: {
    type: [String],
    required: true,
  },
});

SubscriptionsDBSchema.plugin(uniqueValidator);

export const Subscriptions = model("Subscriptions", SubscriptionsDBSchema);

// user subscriptions (default to free/non-subscribed)
export const UserSubscriptionsSchema = yup.object({
  userId: yup.string().required(),
  subscriptionName: yup.string().required(),
  expiresAt: yup.date().required(),
});

const UserSubscriptionDBSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  subscriptionName: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

UserSubscriptionDBSchema.plugin(uniqueValidator);

export const UserSubscription = model(
  "UserSubscriptions",
  UserSubscriptionDBSchema
);
