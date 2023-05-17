"use strict";

const { BadRequestError } = require("../expressError");

/**
 * //FIXME: this docstring sucks.
 * takes in data that needs to be updated and returns the necessary SQL
 * @param {Object} dataToUpdate - contains data to be updated
 * @param {Object} jsToSql - optional, handles inconsistencies between JS property
 * name and SQL column names
 * @returns
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
