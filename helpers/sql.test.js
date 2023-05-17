"use strict";

const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function() {
  test("works: valid data", function() {
    const data = {firstName: "Test", email: 'test@example.com'}
    const jsToSql = {firstName: "first_name"}
    const result = sqlForPartialUpdate(data, jsToSql)
    expect(result).toEqual({
      setCols: '"first_name"=$1, "email"=$2',
      values: ['Test', 'test@example.com']
    })
  })

  test("works: bad data", function() {
    const data = {}
    const jsToSql = {firstName: "first_name"}
    try {
      const result = sqlForPartialUpdate(data, jsToSql)
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  })
})