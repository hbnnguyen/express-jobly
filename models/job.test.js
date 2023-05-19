"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
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

describe("create", async function () {
  const newJob = {
    title: "test job",
    salary: 10,
    equity: 0.1,
    companyHandle: "c1"
  };

  test("works with valid data", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT title, salary, equity, companyHandle
           FROM jobs
           WHERE id = ${job.id}`);
    expect(result.rows).toEqual([
      {
        title: "test job",
        salary: 10,
        equity: 0.1,
        companyHandle: "c1"
      },
    ]);
  });

  test("bad request with invalid data", async function () {
    try {
      await Job.create({
        title: "test job",
        salary: "ten",
        equity: 2,
        companyHandle: "fake company"
      });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** whereBuilder */

describe("whereBuilder", async function () {
  test("works: given no query filters", async function () {
    let filter = Job.whereBuilder();
    expect(filter).toEqual({
      whereClause: "",
      values: []
    });
  });

  test("works: given title query filter", async function () {
    let filter = Company.whereBuilder({ title: "J" });
    expect(filter).toEqual({
      whereClause: "WHERE title ILIKE $1",
      values: ["%J%"]
    });
  });

  test("works: given minSalary query filter", async function () {
    let filter = Company.whereBuilder({ minSalary: 2 });
    expect(filter).toEqual({
      whereClause: "WHERE salary >= $1",
      values: [2]
    });
  });

  test("works: given hasEquity query filter", async function () {
    let filter = Company.whereBuilder({ hasEquity: true });
    expect(filter).toEqual({
      whereClause: "WHERE equity > $1",
      values: [0]
    });
  });

  test("works: given minSalary and hasEquity query filters", async function () {
    let filter = Company.whereBuilder({
      minSalary: 2,
      hasEquity: true
    });
    expect(filter).toEqual({
      whereClause: "WHERE salary >= $1 AND equity > $2",
      values: [2, 0]
    });
  });

  test("works: given all query filters", async function () {
    let filter = Company.whereBuilder({
      title: "J",
      minSalary: 2,
      hasEquity: true
    });
    expect(filter).toEqual({
      whereClause: "WHERE salary >= $1 AND equity > $2 AND title ILIKE $3",
      values: [2, 0, "%J%"]
    });
  });
});

/************************************** findAll */

describe("findAll", async function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        title: "J1",
        salary: 100,
        equity: 0,
        companyHandle: "c1"
      },
      {
        title: "J2",
        salary: 200,
        equity: 0.02,
        companyHandle: "c2"
      },
      {
        title: "J3",
        salary: 300,
        equity: 0.03,
        companyHandle: "c3"
      },
    ]);
  });

  test("works: title filter", async function () {
    let jobs = await Job.findAll({ title: "J2" });
    expect(jobs).toEqual([
      {
        title: "J2",
        salary: 200,
        equity: 0.02,
        companyHandle: "c2"
      }
    ]);
  });

  test("works: minSalary filter", async function () {
    let jobs = await Job.findAll({ minSalary: 200 });
    expect(jobs).toEqual([
      {
        title: "J2",
        salary: 200,
        equity: 0.02,
        companyHandle: "c2"
      },
      {
        title: "J3",
        salary: 300,
        equity: 0.03,
        companyHandle: "c3"
      }
    ]);
  });

  test("works: hasEquity filter", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        title: "J2",
        salary: 200,
        equity: 0.02,
        companyHandle: "c2"
      },
      {
        title: "J3",
        salary: 300,
        equity: 0.03,
        companyHandle: "c3"
      }
    ]);
  });

  test("works: title, minSalary, and hasEquity filters", async function () {
    let jobs = await Job.findAll({
      title: "J",
      minSalary: 300,
      hasEquity: true
    });
    expect(jobs).toEqual([
      {
        title: "J3",
        salary: 300,
        equity: 0.03,
        companyHandle: "c3"
      }
    ]);
  });

  test("works: filters don't return matching data", async function () {
    let jobs = await Job.findAll({ title: "K", });
    expect(jobs).toEqual([]);
  });
});

describe("get by id", async function () {
  test("works", async function () {

  });

  test("not found if no such id", async function () {

  });
});

describe("update", async function () {
  test("works", async function () {

  });

  test("works: invalid inputs", async function () {

  });

  test("not found if no such id", async function () {

  });
});

describe("delete", async function () {
  test("works", async function () {

  });

  test("not found if no such id", async function () {

  });
});