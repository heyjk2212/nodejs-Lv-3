import express from "express";
import { prisma } from "../utils/prisma/index.js";
import Joi from "joi";

const router = express.Router();

// 유효성 검증을 위한 Joi Schema
const schema = Joi.object({
  name: Joi.string().min(1).max(30),
  description: Joi.string().min(1).max(100),
  image: Joi.string().min(1).max(50),
  // valid 메소드를 사용하여 허용되는 값을 명시적으로 지정할 수 있다.
  // 이렇게 하면 status 필드의 값은 'FOR_SALE' 또는 'SOLD_OUT' 중 하나여야 하며,
  // 문자열 길이가 1에서 10 사이여야 한다. [중요!]
  status: Joi.string().valid("FOR_SALE", "SOLD_OUT").min(1).max(10),
  price: Joi.number().integer(),
  order: Joi.number().integer(),
  CategoryId: Joi.number().integer(),
  menuId: Joi.number().integer(),
});

// 5. 메뉴 등록 API [POST]
router.post("/category/:CategoryId/menus", async (req, res, next) => {
  try {
    // 메뉴를 등록할 카테고리 id 받아오기
    // const { CategoryId } = req.params;
    const idValidation = await schema.validateAsync(req.params);
    const { CategoryId } = idValidation;

    if (!CategoryId) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 카테고리입니다" });
    }

    // maxOrder값 찾기
    const maxOrder = await prisma.menus.findFirst({
      select: {
        order: true,
      },
      orderBy: {
        order: "desc",
      },
    });

    const newOder = maxOrder ? maxOrder.order + 1 : 1;

    // 클라이언트에서 보낸 정보 받아오기
    // const { name, description, image, price, status } = req.body;
    const validation = await schema.validateAsync(req.body);

    const { name, description, image, price, status } = validation;

    if (price < 0) {
      return res
        .status(404)
        .json({ errorMessage: "메뉴 가격은 0보다 작을 수 없습니다" });
    }

    if (!name || !description || !image || !price) {
      return res
        .status(400)
        .json({ errorMessage: "데이터 형식이 올바르지 않습니다." });
    }

    // db에 저장하기
    await prisma.menus.create({
      data: {
        // CategoryId까지 db에 저장해야 한다
        CategoryId: +CategoryId,
        name,
        description,
        image,
        price,
        order: newOder,
        status: status,
      },
    });

    // db에 저장후 클라이언트에 결과 리턴
    return res.status(201).json({ message: "메뉴를 등록하였습니다." });
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

// 6. 카테고리별 메뉴 조회 API  [GET]
router.get("/category/:CategoryId/menus", async (req, res, next) => {
  try {
    // 조회할 카테고리 Id
    // const { CategoryId } = req.params;
    const idValidation2 = await schema.validateAsync(req.params);
    const { CategoryId } = idValidation2;

    if (!CategoryId) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 카테고리입니다" });
    }

    // db에서 데이터 찾아오기
    const menu = await prisma.menus.findMany({
      where: {
        CategoryId: +CategoryId,
      },
      select: {
        menuId: true,
        name: true,
        image: true,
        price: true,
        order: true,
        status: true,
      },
      orderBy: {
        order: "desc",
      },
    });

    // 결과 리턴
    return res.status(200).json({ data: menu });
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

// 7. 메뉴 상세 조회 API [GET]
router.get("/category/:CategoryId/menu/:menuId", async (req, res, next) => {
  try {
    // 조회하고 싶은 카테고리 ID, 메뉴 ID가져오기
    // const { CategoryId, menuId } = req.params;
    const idValidation3 = await schema.validateAsync(req.params);
    const { CategoryId, menuId } = idValidation3;

    // 나중에 다시 확인 필요!
    if (!CategoryId) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 카테고리입니다" });
    } else if (!menuId) {
      return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다" });
    }

    // db에서 데이터를 가져온다. 이번에는 CategoryId와 menuId 둘다 확인 필요
    const menu = await prisma.menus.findFirst({
      where: {
        CategoryId: +CategoryId,
        menuId: +menuId,
      },
      select: {
        menuId: true,
        name: true,
        description: true,
        image: true,
        price: true,
        order: true,
        status: true,
      },
    });

    return res.status(200).json({ data: menu });
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

// 8. 메뉴 수정 API [PATCH]
router.patch("/category/:CategoryId/menu/:menuId", async (req, res, next) => {
  try {
    // 수정하고 싶은 카테고리 ID, 메뉴 ID가져오기
    // const { CategoryId, menuId } = req.params;
    const idValidation4 = await schema.validateAsync(req.params);
    const { CategoryId, menuId } = idValidation4;

    // 클라이언트에서 보낸 데이터 받기
    // const { name, description, price, order, status } = req.body;
    const validation2 = await schema.validateAsync(req.body);

    const { name, description, price, order, status } = validation2;

    // 가격확인
    if (price < 0) {
      return res
        .status(400)
        .json({ errorMessage: "메뉴 가격은 0보다 작을 수 없습니다." });
    }

    // 나중에 다시 확인 필요!
    if (!CategoryId) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 카테고리입니다" });
    } else if (!menuId) {
      return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다" });
    }

    // 메뉴가 존재하는지 확인
    const menu = await prisma.menus.findFirst({
      where: {
        CategoryId: +CategoryId,
        menuId: +menuId,
      },
    });

    if (!menu) {
      return res.status(200).json({ errorMessage: "존재하지 않는 메뉴입니다" });
    }

    // 수정한 정보들 db에 저장
    await prisma.menus.update({
      data: {
        name,
        description,
        price,
        order,
        status,
      },
      where: {
        // 저장하기 전에 다시 한번 카테고리 ID와 메뉴 ID가 일치하는지 확인
        CategoryId: +CategoryId,
        menuId: +menuId,
      },
    });

    // 결과 리턴
    return res.status(200).json({ message: "메뉴를 수정하였습니다." });
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

// 9. 메뉴 삭제 API [DELETE]
router.delete("/category/:CategoryId/menu/:menuId", async (req, res, next) => {
  try {
    // 삭제하고 싶은 카테고리 ID, 메뉴 ID가져오기
    // const { CategoryId, menuId } = req.params;
    const idValidation5 = await schema.validateAsync(req.params);
    const { CategoryId, menuId } = idValidation5;

    // 나중에 다시 확인 필요!
    if (!CategoryId) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 카테고리입니다" });
    } else if (!menuId) {
      return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다" });
    }

    // 메뉴가 실제로 존재하는지 확인하기
    const menu = await prisma.menus.findFirst({
      where: {
        menuId: +menuId,
        CategoryId: +CategoryId,
      },
    });

    if (!menu) {
      return res.status(404).json({ errorMessage: "존재하지 않는 메뉴입니다" });
    }

    await prisma.menus.delete({
      where: {
        menuId: +menuId,
        CategoryId: +CategoryId,
      },
    });

    // 결과 리턴
    return res.status(200).json({ message: "메뉴를 삭제하였습니다." });
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
