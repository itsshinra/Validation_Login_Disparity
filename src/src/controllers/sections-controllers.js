import {
  CompletedSection,
  Section,
  SectionContent,
} from "../models/section.js";
import { UnlockedModule, Module } from "../models/module.js";

export async function getModuleSectionsById(req, res, next) {
  const moduleId = req.params.moduleId;
  let sections;
  try {
    sections = await Section.find({
      moduleId: moduleId,
    });

    if (!sections || sections.length === 0) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find any sections with the provided module id.",
      statusCode: 404,
    });
  }

  res.json({
    sections,
  });
}

export async function getSectionsProgress(req, res, next) {
  const moduleId = req.params.moduleId;
  const userId = req.user?.id;

  // ensure module exists
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
      message: "Module does not exist.",
      statusCode: 404,
    });
  }

  let completedSections;

  try {
    completedSections = await CompletedSection.find({
      moduleId: moduleId,
      userId: userId,
    });

    if (!completedSections) {
      throw new Error();
    }
  } catch (err) {
    completedSections = [];
  }

  res.json({
    completedSections: completedSections.map((s) => s.sectionId),
  });
}

// ensure user has access to module by checking if they have a document in the UnlockedModule collection
export async function getSectionContent(req, res, next) {
  const sectionId = req.params.sectionId;
  const moduleId = req.params.moduleId;

  // verify user access to module
  let unlockedModule;
  const userId = req.user?.id;

  try {
    unlockedModule = await UnlockedModule.findOne({
      moduleId: moduleId,
      userId: userId,
    });

    if (!unlockedModule) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "User does not have access to this module.",
      statusCode: 401,
    });
  }

  // get section content
  let sectionContent;

  try {
    sectionContent = await SectionContent.findOne({
      id: sectionId,
      moduleId,
    });

    if (!sectionContent) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find any sections with the provided id.",
      statusCode: 404,
    });
  }

  res.json({
    sectionContent,
  });
}

export async function markSectionAsCompleted(req, res, next) {
  const { sectionId, moduleId } = req.body;

  // verify user access to module
  let unlockedModule;
  const userId = req.user?.id;

  // ensure user has access to module by checking if they have a document in the UnlockedModule collection
  try {
    unlockedModule = await UnlockedModule.findOne({
      moduleId: moduleId,
      userId: userId,
    });

    if (!unlockedModule) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "User does not have access to this module.",
      statusCode: 401,
    });
  }

  // ensure section exists in module
  let section;

  try {
    section = await Section.findOne({
      id: sectionId,
      moduleId,
    });

    if (!section) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find any sections with the provided id.",
      statusCode: 404,
    });
  }

  // ensure section is not already completed
  let completedSection;

  completedSection = await CompletedSection.findOne({
    moduleId,
    sectionId,
    userId: userId,
  });

  if (completedSection) {
    return next({
      message: "Section is already completed.",
      statusCode: 400,
    });
  }

  // add section to completedSection
  try {
    let completeSection = new CompletedSection({
      moduleId,
      sectionId,
      userId: userId,
    });

    await completeSection.save();
    res.status(201).json({
      completed: true,
    });
  } catch (err) {
    return next({
      message: "Could not complete section.",
      statusCode: 500,
    });
  }
}
