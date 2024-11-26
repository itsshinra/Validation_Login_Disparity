import { Schema, model } from "mongoose";
import * as yup from "yup";

export const moduleDifficulties = ["Fundamental", "Easy", "Medium", "Hard"];

export const moduleCategories = ["Offensive", "Defensive", "General"];

export const moduleTiers = new Map([
  [
    "Tier 0",
    {
      cost: 10,
      reward: 10,
    },
  ],
  [
    "Tier I",
    {
      cost: 50,
      reward: 10,
    },
  ],
  [
    "Tier II",
    {
      cost: 100,
      reward: 20,
    },
  ],
  [
    "Tier III",
    {
      cost: 500,
      reward: 100,
    },
  ],
  [
    "Tier IV",
    {
      cost: 1000,
      reward: 200,
    },
  ],
]);

export const ModuleSchema = yup
  .object({
    id: yup.number().required(),
    title: yup.string().required(),
    maker: yup.string().required(),
    imageUrl: yup.string().required(),
    difficulty: yup.string().oneOf(moduleDifficulties).required(),
    tier: yup
      .string()
      .oneOf([...moduleTiers.keys()])
      .required(),
    category: yup.string().oneOf(moduleCategories).required(),
    description: yup.string().required(),
    prelude: yup.string().required(),
    hoursToComplete: yup.number().positive().min(1).required(),
    releaseDate: yup.date().required(),
    conditions: yup.array().of(yup.string()), // currently only 'coming soon' is handled in frontend
  })
  .required();

const moduleDBSchema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: String,
  maker: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: moduleDifficulties,
    required: true,
  },
  tier: {
    type: String,
    enum: [...moduleTiers.keys()],
    required: true,
  },
  category: {
    type: String,
    enum: moduleCategories,
    required: true,
  },
  prelude: {
    type: String,
    required: true,
  },
  hoursToComplete: {
    type: Number,
    required: true,
  },
  releaseDate: {
    type: Date,
    default: Date.now,
  },
  conditions: [
    {
      type: String,
    },
  ],
});

export const Module = model("Modules", moduleDBSchema);

// added when a user unlocks a module, updated when they complete it
export const UnlockedModuleSchema = yup
  .object({
    moduleId: yup.number().required(),
    userId: yup.string().required(),
  })
  .required();

const UnlockedModuleDBSchema = new Schema({
  moduleId: {
    type: Number,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
});

export const UnlockedModule = model("UnlockedModules", UnlockedModuleDBSchema);
