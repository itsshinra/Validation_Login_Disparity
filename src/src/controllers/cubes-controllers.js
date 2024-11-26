import { Cubes } from "../models/cubes.js";

export async function getCubesByUserId(userId) {
  let cubes;

  try {
    cubes = await Cubes.findOne({
      userId,
    });

    if (!cubes) {
      throw new Error();
    }
  } catch (err) {
    cubes = new Cubes({
      userId,
      count: 0,
    });
  }
  return cubes;
}

export async function getCubes(req, res, next) {
  const userId = req.user?.id;
  let cubes;

  try {
    cubes = await getCubesByUserId(userId);
  } catch (err) {
    return next({
      message: "Could not find any cubes with the provided id.",
      statusCode: 404,
    });
  }

  res.json({
    cubes: cubes.count,
  });
}

export async function adjustCubeCount(userId, adjustment, next) {
  let cubes;

  try {
    cubes = await Cubes.findOne({
      userId,
    });

    if (!cubes) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find any cubes with the provided id.",
      statusCode: 404,
    });
  }

  try {
    cubes.count = cubes.count + adjustment;

    await Cubes.updateOne(
      {
        userId,
      },
      cubes
    );
  } catch (err) {
    return next({
      message: "Could not update cubes count.",
      statusCode: 404,
    });
  }
  return cubes;
}

// only accessed by payment/coupon systems
export async function buyCubes(userId, amount, next) {
  let cubes;

  try {
    cubes = await adjustCubeCount(userId, amount, next);

    if (!cubes) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not update cubes count.",
      statusCode: 404,
    });
  }
}
