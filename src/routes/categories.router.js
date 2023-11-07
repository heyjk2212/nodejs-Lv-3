import express from "express";
import { prisma } from "../utils/prisma/index.js";
import Joi from "joi";

const router = express.Router();

// 1. 카테고리 등록 API - [POST]
// [✔️] 카테고리 이름을 **request**에서 전달받기
// [✔️] 새롭게 등록된 카테고리는 **가장 마지막 순서**로 설정됩니다.
router.post("/categories", async (req, res, next) => {
  try {
    // [✔️] 유효성 검증
    // 유효성 검증을 위해 필요한 Joi를 사용하기 위해서 Joi Schema를 구현해야 한다.
    const categorySchema = Joi.object({
      // 클라이언트가 전달한 Body 데이터를 검증
      name: Joi.string().min(1).max(50).required(),
    });

    // 클라이언트로부터 받은 데이터를 변수에 할당시킨다.
    // const { name } = req.body;
    // validateAsync => 검증에 실패했을 때 에러가 발생한다.
    const validation = await categorySchema.validateAsync(req.body); // req.body에 있는 데이터를 검증

    const { name } = validation; // 검증에 성공한 validation에서 반환된 값을 쓴다.

    // maxOrder값 찾기
    const maxOrder = await prisma.categories.findFirst({
      select: {
        order: true,
      },
      orderBy: {
        order: "desc",
      },
    });

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
// [✔️] 등록된 모든 카테고리의 카테고리 이름, 순서를 조회하기
// [✔️] 조회된 카테고리는 지정된 순서대로 정렬됩니다.
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
// [✔️] 카테고리 이름, 순서를 **request**에서 전달받기
// [✔️] 선택한 카테고리가 존재하지 않을 경우, “존재하지 않는 카테고리입니다." 메시지 반환하기
router.patch("/category/:categoryId", async (req, res, next) => {
  try {
    // [✔️] 유효성 검증
    // 유효성 검증을 위해 필요한 Joi를 사용하기 위해서 Joi Schema를 구현해야 한다.
    const idValidationSchema = Joi.object({
      // 클라이언트가 전달한 Params 데이터를 검증
      categoryId: Joi.number().integer().required(),
    });

    const dataSchema = Joi.object({
      // 클라이언트가 전달한 Body 데이터를 검증
      name: Joi.string().min(1).max(50).required(),
      // 숫자가 정수인지 검증
      order: Joi.number().integer().required(),
    });

    // 변경할 정보 id 가져오기
    // const { categoryId } = req.params;
    const idValidation = await idValidationSchema.validateAsync(req.params);
    const { categoryId } = idValidation;

    // 클라이언트에서 보낸 변경할 정보들을 가져온다
    // const { name, order } = req.body;
    const validation2 = await dataSchema.validateAsync(req.body);

    const { name, order } = validation2;

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

    // 받은 categoryId와 일치하는 카테고리가 존재할때
    // 받은 정보들을 가지고 db에 업데이트한다.
    // [중요!]
    await prisma.categories.update({
      data: {
        name,
        order,
      },
      // 이중으로 다시 한번 확인
      where: { categoryId: +categoryId },
    });

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
// [✔️] 선택한 카테고리 삭제하기
// [✔️] 카테고리 삭제 시, 해당 카테고리에 **연관된 모든 메뉴도 함께 삭제**됩니다.
// [✔️] 선택한 카테고리가 존재하지 않을 경우, “존재하지 않는 카테고리입니다." 메시지 반환하기
router.delete("/category/:categoryId", async (req, res, next) => {
  try {
    // [✔️] 유효성 검증
    // 유효성 검증을 위해 필요한 Joi를 사용하기 위해서 Joi Schema를 구현해야 한다.
    const categorySchema3 = Joi.object({
      // 클라이언트가 전달한 Params 데이터를 검증
      categoryId: Joi.number().integer().required(),
    });

    // 삭제할 카테고리 아이디 전달받기
    // const { categoryId } = req.params;
    const idValidation2 = await categorySchema3.validateAsync(req.params);
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
