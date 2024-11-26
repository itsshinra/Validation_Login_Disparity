import { Exam, ExamContent, UserExam } from "../models/exam.js";

export async function getExamById(req, res, next) {
  const id = req.params.id;
  let exam;

  try {
    exam = await Exam.findOne({
      id,
    });

    if (!exam) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find a matching exam with the provided id.",
      statusCode: 404,
    });
  }

  res.json({
    exam,
  });
}

export async function getAllExams(req, res, next) {
  let exams;

  try {
    exams = await Exam.find();
  } catch (err) {
    return next({
      message: "Could not find any exams.",
      statusCode: 404,
    });
  }

  res.json({
    exams,
  });
}

export async function getUserExams(req, res, next) {
  const userId = req.user?.id;
  let userExams;

  try {
    userExams = await UserExam.find({
      userId: userId,
      used: false,
    });

    if (!userExams) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find any exams.",
      statusCode: 404,
    });
  }

  res.json({
    userExams,
  });
}

export async function getExamAvailability(req, res, next) {
  const { id, startDate, endDate } = req.body;

  // validate date format
  if (
    !startDate ||
    !endDate ||
    isNaN(Date.parse(startDate)) ||
    isNaN(Date.parse(endDate))
  ) {
    return next({
      message: "Please provide a valid date range.",
      statusCode: 400,
    });
  }

  let exam;
  try {
    // ensure exam exists
    exam = await Exam.findOne({
      id,
    });

    if (!exam) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find a matching exam.",
      statusCode: 404,
    });
  }

  try {
    // get all booked exams in date range
    const bookedExams = UserExam.find({
      examId: exam.id,
      date: {
        $gte: new Date(startDate).setUTCHours(0, 0, 0, 0),
        $lte: new Date(endDate).setUTCHours(23, 59, 59, 999),
      },
      used: false,
    });

    if (!bookedExams) {
      throw new Error();
    } else {
      res.json({
        unavailableSlots: (await bookedExams).map((exam) => exam.date),
      });
    }
  } catch (err) {
    res.json({
      unavailableSlots: [],
    });
  }
}

// only accessed by payment/coupon systems
export async function buyExam(userId, id, next) {
  let exam;

  try {
    // ensure exam exists
    exam = await Exam.findOne({
      id,
    });

    if (!exam) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find a matching exam.",
      statusCode: 404,
    });
  }

  try {
    // create user user exam
    const userExam = new UserExam({
      userId,
      examId: exam.id,
      used: false,
    });

    await userExam.save();
  } catch (err) {
    return next({
      message: "Could not purchase user exam.",
      statusCode: 400,
    });
  }
}

export async function bookExam(req, res, next) {
  const userId = req.user?.id;
  const { id, date } = req.body;

  // validate date format
  if (!date || isNaN(Date.parse(date))) {
    return next({
      message: "Please provide a valid date.",
      statusCode: 400,
    });
  }

  let exam;
  try {
    // ensure exam exists
    exam = await Exam.findOne({
      id,
    });

    if (!exam) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find a matching exam.",
      statusCode: 404,
    });
  }

  try {
    // get exam details
    const updateReq = await UserExam.findOneAndUpdate(
      {
        examId: exam.id,
        userId,
        used: false,
        date: {
          // date must be null 'unbooked' -> can't change date once booked
          $eq: null,
        },
      },
      {
        date: new Date(date),
      }
    );

    if (!updateReq) {
      throw new Error();
    }

    res.json({
      message: `${exam.name} exam successfully booked for ${new Date(
        date
      ).toLocaleDateString("en-UK")}.`,
    });
  } catch (err) {
    return next({
      message: "User has not purchased this exam, or has already booked it.",
      statusCode: 500,
    });
  }
}

// ensure user has access to module by checking if they have a document in the UnlockedModule collection
export async function getExamContent(req, res, next) {
  const id = req.params.id;

  // verify user access to module
  let userExam;
  const userId = req.user?.id;
  let exam;

  try {
    // ensure exam exists
    exam = await Exam.findOne({
      id,
    });

    if (!exam) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find a matching exam.",
      statusCode: 404,
    });
  }

  // ensure user has purchased and booked the exam
  try {
    userExam = await UserExam.findOne({
      userId: userId,
      examId: exam.id,
      used: false,
      // must be unused
      date: {
        // date must be in the future
        $gte: new Date(),
      },
    });

    if (!userExam) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "User does not have access to this exam.",
      statusCode: 401,
    });
  }

  // get section content
  let examContent;

  try {
    examContent = await ExamContent.findOne({
      examId: exam.id,
    });

    if (!examContent) {
      throw new Error();
    }
  } catch (err) {
    return next({
      message: "Could not find any exams with the provided id.",
      statusCode: 404,
    });
  }

  res.json({
    examContent,
  });
}
