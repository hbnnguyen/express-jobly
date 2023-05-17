"use strict";

const { BadRequestError } = require("../expressError");

/**
 * //FIXME: this docstring sucks.
 * takes in data that needs to be updated and returns the necessary SQL
 * @param {Object} dataToUpdate - contains data to be updated like: { firstName: "Test", email: 'test@example.com' }
 * @param {Object} jsToSql - can be empty. handles inconsistencies between JS property
 * name and database column names. looks like:  { firstName: "first_name" }
 * @returns object like: {
    setCols: '"first_name"=$1, "email"=$2',
    values: ['Test', 'test@example.com']
  }
  where the value of setCols is a string of database column names and
  the value of values is an array of corresponding values to update
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
