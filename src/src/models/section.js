import { Schema, model } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import * as yup from "yup";

// public collection with each sections title, accessible to all users (shown in module preview)
export const SectionSchema = yup
  .object({
    id: yup.number().required(),
    moduleId: yup.number().required(),
    title: yup.string().required(),
    isPractical: yup.boolean().default(false),
  })
  .required();

const sectionDBSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  moduleId: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  isPractical: {
    type: Boolean,
    default: false,
  },
});

sectionDBSchema.plugin(uniqueValidator);

export const Section = model("Sections", sectionDBSchema);

// private collection with each sections content, only accessible to users who have access to the module
export const SectionContentSchema = yup
  .object({
    id: yup.number().required(),
    moduleId: yup.number().required(),
    content: yup.string().required(),
  })
  .required();

const sectionContentDBSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  moduleId: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

sectionContentDBSchema.plugin(uniqueValidator);

export const SectionContent = model("SectionContents", sectionContentDBSchema);

// added when a user completes a section, used to track progress
export const CompletedSectionSchema = yup
  .object({
    moduleId: yup.number().required(),
    sectionId: yup.number().required(),
    userId: yup.string().required(),
  })
  .required();

const CompletedSectionDBSchema = new Schema({
  moduleId: {
    type: Number,
    required: true,
  },
  sectionId: {
    type: Number,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
});

export const CompletedSection = model(
  "CompletedSections",
  CompletedSectionDBSchema
);
