import express from "express";
import { prisma } from "../utils/prisma/index.js";
import Joi from "joi";

const router = express.Router();

// [나중에 다시 확인!] - 이렇게 joi schema를 이렇게 한번에 정의하고 쓰는게 좋을까? 아니면 각 API에 맞는 schema를 따로 정의하는게 맞을까?
// 유효성 검증을 위한 Joi Schema
const schema = Joi.object({
  name: Joi.string().min(1).max(50),
  order: Joi.number().integer(),
  categoryId: Joi.number().integer(),
});

// 1. 카테고리 등록 API - [POST]
router.post("/categories", async (req, res, next) => {
  try {
    // 클라이언트로부터 받은 데이터를 변수에 할당시킨다.
    // const { name } = req.body;
    // validateAsync => 검증에 실패했을 때 에러가 발생한다.
    const validation = await schema.validateAsync(req.body); // req.body에 있는 데이터를 검증

    const { name } = validation; // 검증에 성공한 validation에서 반환된 값을 쓴다.

    // 해당하는 가장 마지막 order를 가져온다(the most recently added order value)
    const maxOrder = await prisma.categories.findFirst({
      select: {
        order: true,
      },
      orderBy: {
        order: "desc",
      },
    });

    // order 값이 이미 존재한다면 1을 더하고, order값이 존재하지 않다면 1을 할당시켜준다.
    const newOder = maxOrder ? maxOrder.order + 1 : 1;

    // 받은 데이터 db에 저장
    const category = await prisma.categories.create({
      data: {
        name,
        order: newOder,
      },
    });

    // 결과를 클라이언트에 리턴
    return res.status(200).json({ message: "카테고리를 등록하였습니다." });
  } catch (error) {
    console.error(error);

    // 발생한 에러가 예상된 에러인 경우
    if (error.name === "ValidationError") {
      // Joi에서 발생한 에러
      return res.status(400).json({ errorMessage: error.message });
    }

    // 예상하지 못한 에러인 경우
    return res
      .status(500)
      .json({ errorMessage: "서버에서 문제가 발생하였습니다." });
  }
});

// 2. 카테고리 목록 조회 API - [GET]
router.get("/categories", async (req, res, next) => {
  try {
    // db에서 데이터를 가져와야한다
    const categories = await prisma.categories.findMany({
      select: {
        categoryId: true,
        name: true,
        order: true,
      },
      orderBy: {
        // order field를 기준으로 정렬
        order: "desc",
      },
    });

    // 클라이언트에게 db에서 가져온 데이터를 리턴한다
    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ errorMessage: "서버에서 문제가 발생하였습니다." });
  }
});

// 3. 카테고리 정보 변경 API [PATCH]
router.patch("/categories/:categoryId", async (req, res, next) => {
  try {
    // const { categoryId } = req.params;
    const idValidation = await schema.validateAsync(req.params);
    const { categoryId } = idValidation;

    // const { name, order } = req.body;
    const validation2 = await schema.validateAsync(req.body);
    const { name, order } = validation2;

    // 현재 카테고리를 가리킨다
    const currentCategory = await prisma.categories.findUnique({
      where: { categoryId: +categoryId },
    });

    if (!currentCategory) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 카테고리입니다." });
    }

    // 현재 카테고리에서 다른 order값으로 변경하려면
    if (order !== currentCategory.order) {
      const targetCategory = await prisma.categories.findFirst({
        where: { order },
      });

      if (targetCategory) {
        const tempOrder = currentCategory.order; // 현재 카테고리의 order 값

        // 현재 카테고리의 order를 변경
        await prisma.categories.update({
          where: { categoryId: currentCategory.categoryId },
          data: { order },
        });

        // 대상 카테고리의 order를 변경
        await prisma.categories.update({
          where: { categoryId: targetCategory.categoryId },
          data: { order: tempOrder },
        });
      } else {
        // 현재 카테고리의 order값을 업데이트
        await prisma.categories.update({
          where: {
            categoryId: currentCategory.categoryId,
          },
          data: {
            name,
            order,
          },
        });
      }
    }

    return res.status(200).json({ message: "카테고리 정보를 수정하였습니다." });
  } catch (error) {
    console.error(error);

    // 발생한 에러가 예상된 에러인 경우
    if (error.name === "ValidationError") {
      // Joi에서 발생한 에러
      return res.status(400).json({ errorMessage: error.message });
    }

    // 예상하지 못한 에러인 경우
    return res
      .status(500)
      .json({ errorMessage: "서버에서 문제가 발생하였습니다." });
  }
});

// 4. 카테고리 삭제 API
router.delete("/categories/:categoryId", async (req, res, next) => {
  try {
    // 삭제할 카테고리 아이디 전달받기
    // const { categoryId } = req.params;
    const idValidation2 = await schema.validateAsync(req.params);
    const { categoryId } = idValidation2;

    // 존재하지 않는 id를 입력했을 때
    if (!categoryId) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 카테고리입니다." });
    }

    // 카테고리가 존재하는지 확인한다 [중요!]
    const findCategory = await prisma.categories.findUnique({
      where: { categoryId: +categoryId },
    });

    if (!findCategory) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 카테고리입니다." });
    }

    // 삭제할 카테고리가 존재할 때
    await prisma.categories.delete({
      where: {
        categoryId: +categoryId,
      },
    });

    return res.status(200).json({ message: "카테고리 정보를 삭제하였습니다." });
  } catch (error) {
    console.error(error);

    // 발생한 에러가 예상된 에러인 경우
    if (error.name === "ValidationError") {
      // Joi에서 발생한 에러
      return res.status(400).json({ errorMessage: error.message });
    }

    // 예상하지 못한 에러인 경우
    return res
      .status(500)
      .json({ errorMessage: "서버에서 문제가 발생하였습니다." });
  }
});

export default router;
