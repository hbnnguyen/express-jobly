"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** whereBuilder */

describe("whereBuilder", function () {
  test("works: given no query filters", function () {
    let filter = Company.whereBuilder();
    expect(filter).toEqual({
      whereClause: "",
      values: []
    });
  });

  test("works: given nameLike query filter", function () {
    let filter = Company.whereBuilder({ nameLike: "c" });
    expect(filter).toEqual({
      whereClause: "WHERE name ILIKE $1",
      values: ["%c%"]
    });
  });

  test("works: given minEmployees query filter", function () {
    let filter = Company.whereBuilder({ minEmployees: 2 });
    expect(filter).toEqual({
      whereClause: "WHERE num_employees >= $1",
      values: [2]
    });
  });

  test("works: given maxEmployees query filter", function () {
    let filter = Company.whereBuilder({ maxEmployees: 2 });
    expect(filter).toEqual({
      whereClause: "WHERE num_employees <= $1",
      values: [2]
    });
  });

  test("works: given minEmployees and maxEmployees query filters", function () {
    let filter = Company.whereBuilder({
      minEmployees: 2,
      maxEmployees: 2
    });
    expect(filter).toEqual({
      whereClause: "WHERE num_employees >= $1 AND num_employees <= $2",
      values: [2, 2]
    });
  });

  test("works: given all query filters", function () {
    let filter = Company.whereBuilder({
      nameLike: "c",
      minEmployees: 2,
      maxEmployees: 2
    });
    expect(filter).toEqual({
      whereClause: "WHERE num_employees >= $1 AND num_employees <= $2 AND name ILIKE $3",
      values: [2, 2, "%c%"]
    });
  });
});

test("works: throws error if minEmployees > maxEmployees", function () {
  try {
    Company.whereBuilder({
      minEmployees: 2,
      maxEmployees: 1
    })
    throw new Error("fail test, you shouldn't get here");
  } catch (err) {
    expect(err instanceof BadRequestError).toBeTruthy();
  }
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let companies = await Company.findAll();
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });
});

test("works: nameLike filter", async function () {
  let companies = await Company.findAll({ nameLike: "c2" });
  expect(companies).toEqual([
    {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      numEmployees: 2,
      logoUrl: "http://c2.img"
    }
  ]);
});

test("works: minEmployees filter", async function () {
  let companies = await Company.findAll({ minEmployees: 2 });
  expect(companies).toEqual([
    {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      numEmployees: 2,
      logoUrl: "http://c2.img"
    },
    {
      handle: "c3",
      name: "C3",
      description: "Desc3",
      numEmployees: 3,
      logoUrl: "http://c3.img"
    }
  ]);
});

test("works: maxEmployees filter", async function () {
  let companies = await Company.findAll({ maxEmployees: 2 });
  expect(companies).toEqual([
    {
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
    },
    {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      numEmployees: 2,
      logoUrl: "http://c2.img"
    }
  ]);
});

test("works: two filters", async function () {
  let companies = await Company.findAll({
    minEmployees: 2,
    nameLike: "c"
  });
  expect(companies).toEqual([
    {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      numEmployees: 2,
      logoUrl: "http://c2.img"
    },
    {
      handle: "c3",
      name: "C3",
      description: "Desc3",
      numEmployees: 3,
      logoUrl: "http://c3.img"
    }
  ]);
});

test("works: all filters", async function () {
  let companies = await Company.findAll({
    minEmployees: 1,
    maxEmployees: 2,
    nameLike: "c"
  });
  expect(companies).toEqual([
    {
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
    },
    {
      handle: "c2",
      name: "C2",
      description: "Desc2",
      numEmployees: 2,
      logoUrl: "http://c2.img"
    }
  ]);
});

test("works: filters don't return matching data", async function () {
  let companies = await Company.findAll({
    nameLike: "d"
  });
  expect(companies).toEqual([]);
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
      "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
