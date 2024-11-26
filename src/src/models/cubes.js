import { Schema, model } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import * as yup from "yup";

// initiated to 30, re-calculated on cube purchases and module unlocks
export const CubesSchema = yup
  .object({
    userId: yup.string().required(),
    count: yup.number().required(),
  })
  .required();

const CubesDBSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    required: true,
  },
});

CubesDBSchema.plugin(uniqueValidator);

export const Cubes = model("Cubes", CubesDBSchema);
