# nodejs-Lv-3

## 과제 요구 사항:

- ERD 작성하기
- prisma.schema 파일에서 각 모델을 작성하기
- API 구현하기

```
1. 카테고리 등록 API
    - 카테고리 이름을 **request**에서 전달받기
    - 새롭게 등록된 카테고리는 **가장 마지막 순서**로 설정됩니다.
2. 카테고리 조회 API
    - 등록된 모든 카테고리의 카테고리 이름, 순서를 조회하기
    - 조회된 카테고리는 지정된 순서대로 정렬됩니다.
3. 카테고리 수정 API
    - 카테고리 이름, 순서를 **request**에서 전달받기
    - 선택한 카테고리가 존재하지 않을 경우, “존재하지 않는 카테고리입니다." 메시지 반환하기
4. 카테고리 삭제 API
    - 선택한 카테고리 삭제하기
    - 카테고리 삭제 시, 해당 카테고리에 **연관된 모든 메뉴도 함께 삭제**됩니다.
    - 선택한 카테고리가 존재하지 않을 경우, “존재하지 않는 카테고리입니다." 메시지 반환하기
5. 메뉴 등록 API
    - 메뉴 이름, 설명, 이미지, 가격을 **request**에서 전달받기
    - 새롭게 등록된 메뉴는 **가장 마지막 순서**로 설정됩니다.
    - 메뉴는 두 가지 상태, **판매 중(`FOR_SALE`)및 매진(`SOLD_OUT`)** 을 가질 수 있습니다.
    - 메뉴 등록 시 기본 상태는 **판매 중(`FOR_SALE`)** 입니다.
    - 가격이 0원 이하일 경우, “메뉴 가격은 0보다 작을 수 없습니다.” 메시지 반환하기
6. 카테고리별 메뉴 조회 API
    - 선택한 카테고리의 메뉴 이름, 이미지, 가격, 순서, 판매 상태 조회하기
    - 조회된 메뉴는 지정된 순서에 따라 정렬됩니다.
7. 메뉴 상세 조회 API
    - 선택한 카테고리의 메뉴 이름, 설명, 이미지, 가격, 순서, 판매 상태 조회하기
8. 메뉴 수정 API
    - 메뉴 이름, 설명, 이미지, 가격, 순서, 판매 상태를 **request**에서 전달받기
    - 가격이 0원 이하일 경우, “메뉴 가격은 0보다 작을 수 없습니다.” 메시지 반환하기
    - 선택한 메뉴가 존재하지 않을 경우, “존재하지 않는 메뉴입니다." 메시지 반환하기
9. 메뉴 삭제 API
    - 선택한 메뉴 삭제하기
    - 선택한 메뉴가 존재하지 않을 경우, “존재하지 않는 메뉴입니다." 메시지 반환하기
```

## Directory Structure

```
├── prisma
│   └── schema.prisma
├── src
│   ├── app.js
│   ├── routes
│   │   ├── categories.router.js
│   │   └── menus.router.js
│   └── utils
│       └── prisma
│           └── index.js
├── package.json
└── yarn.lock
```

## Tech Stack

1. 데이터베이스: `MySQL`
2. ORM: `Prisma`
3. 웹 프레임워크: `Express.js`
4. 패키지 매니저: `yarn`
5. 모듈 시스템: `ES6`

## ERD

<img src= "https://github.com/heyjk2212/nodejs-Lv-3/assets/147573753/cc06cd0e-3191-44e3-b78f-fc8bda2f8784" width="700">

## API SPEC

### 3000 포트사용

| 기능                 | METHOD | URL                                       | Req body | Res body |
| :------------------- | :----: | :---------------------------------------- | :------- | :------- |
| 카테고리 등록        |  POST  | http://localhost:3000/api/categories                           |       { "name": "중식" }   |{ "message": "카테고리를 등록하였습니다." }
| 카테고리 목록 조회        |  GET   | http://localhost:3000/api/categories                           |       {  }   |      { "data": [ { "id": 1, "name": "한식", "order": 1 }, { "id": 2, "name": "일식", "order": 2 }, { "id": 4, "name": "중식", "order": 3 } ] }    |
| 카테고리 정보 변경        | PATCH  | http://localhost:3000/api/categories/:categoryId               |{ "name": "양식", "order": 2 }| { "message": "카테고리 정보를 수정하였습니다." }
| 카테고리 삭제        | DELETE | http://localhost:3000/api/categories/:categoryId               |       { }   |      { "message": "카테고리 정보를 삭제하였습니다." }    |
| 메뉴 등록            |  POST  | http://localhost:3000/api/categories/:CategoryId/menus         |    { "name": "김치찌개", "description":"김치찌개는 맛있다.", "image":"https://hanghae99-assets-1.s3.ap-northeast-2.amazonaws.com/Lv/Screenshot-Kimchi", "price": 8000 }      |{ "message": "메뉴를 등록하였습니다." }
| 카테고리별 메뉴 조회 |  GET   | http://localhost:3000/api/categories/:CategoryId/menus/:menuId |       {}   |{ "data": [ { "id": 2, "name": "된장찌개", "image": "https://hanghae99-assets-1.s3.ap-northeast-2.amazonaws.com/Lv/Screenshot-Miso", "price": 7500, "order": 1, "status": "SOLD_OUT" }, { "id": 1, "name": "김치찌개", "image": "https://hanghae99-assets-1.s3.ap-northeast-2.amazonaws.com/Lv/Screenshot-Kimchi", "price": 8000, "order": 2, "status": "FOR_SALE" } ] }
| 메뉴 상세 조회       |  GET   | http://localhost:3000/api/categories/:CategoryId/menus/:menuId |      {  }    |     { "data": { "id": 1, "name": "김치찌개", "description": "김치찌개는 맛있다.", "image": "https://hanghae99-assets-1.s3.ap-northeast-2.amazonaws.com/Lv/Screenshot-Kimchi", "price": 8000, "order": 2, "status": "FOR_SALE" } }     |
| 메뉴 수정            | PATCH  | http://localhost:3000/api/categories/:CategoryId/menus/:menuId |   { "name": "된장찌개", "description":"된장찌개는 맛있었을것이다?", "price": 7500, "order":1, "status":"SOLD_OUT" }       |   { "message": "메뉴를 수정하였습니다." }       |
| 메뉴 삭제            | DELETE | http://localhost:3000/api/categories/:CategoryId/menus/:menuId |       { }   |{ "message": "메뉴를 삭제하였습니다." }
