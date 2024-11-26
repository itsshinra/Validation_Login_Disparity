import { Schema, model } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import * as yup from "yup";

// main Academy exams
export const ExamSchema = yup
  .object({
    id: yup.number().required(),
    name: yup.string().required(),
    field: yup.string().required(),
    cost: yup.number().positive().required(), // in USD
  })
  .required();

const ExamSchemaDBSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  field: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
});

ExamSchemaDBSchema.plugin(uniqueValidator);

export const Exam = model("Exams", ExamSchemaDBSchema);

// user exams
export const UserExamSchema = yup.object({
  userId: yup.string().required(),
  examId: yup.number().required(),
  date: yup.date(),
  used: yup.boolean().required(),
});

const UserExamDBSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  examId: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
  },
  used: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export const UserExam = model("UserExams", UserExamDBSchema);

// private collection with each exam's content, only accessible to users who have access to the exam
export const ExamContentSchema = yup
  .object({
    examId: yup.number().required(),
    content: yup.string().required(),
  })
  .required();

const examContentDBSchema = new Schema({
  examId: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

export const ExamContent = model("ExamContents", examContentDBSchema);
