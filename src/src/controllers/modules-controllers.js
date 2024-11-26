import { Module, UnlockedModule, moduleTiers } from "../models/module.js";
import { Subscriptions, freeSubscription } from "../models/subscriptions.js";
import { adjustCubeCount } from "./cubes-controllers.js";

export async function getModuleById(req, res, next) {
  const moduleId = req.params.id;
  let module;

  try {
    module = await Module.findOne({
      id: moduleId,
    });

    if (!module) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find any modules with the provided id.",
      statusCode: 404,
    });
  }

  res.json({
    module,
  });
}

export async function getAllModules(req, res, next) {
  let modules;

  try {
    modules = await Module.find();

    if (!modules) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find any modules.",
      statusCode: 404,
    });
  }

  res.json({
    modules,
  });
}

// get all modules unlocked by a user
export async function getModuleUnlockedStatus(req, res) {
  const userId = req.user?.id;
  const moduleId = parseInt(req.params.id);

  let unlockedModule;
  var unlocked = false;

  try {
    unlockedModule = await UnlockedModule.findOne({
      userId: userId,
      moduleId: moduleId,
    });

    if (!unlockedModule) {
      throw new Error();
    } else {
      unlocked = unlockedModule.moduleId === moduleId || false;
    }

    res.json({
      unlocked,
    });
  } catch (err) {
    res.json({
      unlocked: false,
    });
  }
}

export async function unlockModule(req, res, next) {
  const userId = req.user?.id;
  const cubes = req.user?.cubes ?? 0;
  const userSubscription = req.user?.subscription;
  const moduleId = parseInt(req.params.id);

  let subscription;
  let unlockedModule;
  let module;

  // get module details
  try {
    module = await Module.findOne({
      id: moduleId,
    });

    if (!module) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find any modules with the provided id.",
      statusCode: 404,
    });
  }

  // if module condition has 'coming_soon' or 'locked' then return error'
  if (
    module.conditions?.includes("coming_soon") ||
    module.conditions?.includes("locked")
  ) {
    return next({
      message: "Module is not available for purchase.",
      statusCode: 403,
    });
  }

  // first ensure module is not already unlock
  try {
    unlockedModule = await UnlockedModule.findOne({
      userId: userId,
      moduleId: moduleId,
    });

    if (unlockedModule) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Module already unlocked.",
      statusCode: 403,
    });
  }

  // if user subscription is active and covers module tier then unlock module
  try {
    subscription = await Subscriptions.findOne({
      name: userSubscription?.subscriptionName,
    });

    if (!subscription) {
      throw new Error();
    }
  } catch (err) {
    subscription = freeSubscription;
  }

  if (
    subscription.unlockedTiers.includes(module.tier) &&
    new Date(userSubscription.expiresAt) > new Date()
  ) {
    try {
      let unlockModule = new UnlockedModule({
        userId: userId,
        moduleId,
      });

      await unlockModule.save();

      res.status(201).json({
        unlocked: true,
      });
    } catch (err) {
      return next({
        message: "Could not unlock module.",
        statusCode: 500,
      });
    }
  }
  // else, unlock with cubes
  else {
    // ensure user has enough cubes to unlock module
    const moduleCost = moduleTiers.get(module.tier)?.cost;

    if (cubes < moduleCost) {
      return next({
        message: "Not enough cubes to unlock module.",
        statusCode: 403,
      });
    }

    // deduct cubes from user
    try {
      await adjustCubeCount(userId, -moduleCost, next);
    } catch (err) {
      return next({
        message: "Could not deduct cubes from user.",
        statusCode: 500,
      });
    }

    // unlock module
    try {
      let unlockModule = new UnlockedModule({
        userId: userId,
        moduleId,
      });

      await unlockModule.save();

      res.status(201).json({
        unlocked: true,
      });
    } catch (err) {
      return next({
        message: "Could not unlock module.",
        statusCode: 500,
      });
    }
  }
}
