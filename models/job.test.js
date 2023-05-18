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

describe("create", function () {
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

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        title: "J1",
        salary: 123,
        equity: 0.123,
        companyHandle: "c1"
      },
      {
        title: "J2",
        salary: 456,
        equity: 0.456,
        companyHandle: "c2"
      },
      {
        title: "J3",
        salary: 789,
        equity: 0.789,
        companyHandle: "c3"
      },
    ]);
  });
});