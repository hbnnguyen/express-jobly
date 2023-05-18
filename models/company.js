"use strict";

const { validate } = require("jsonschema");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Takes an object of any combination of query parameters like:
   * {
   *   minEmployees: 1,
   *   maxEmployees: 3,
   *   nameLike: "company"
   * }
   *
   * returns an object of "WHERE" clause statements and their values like:
   * {
   * whereClause: "WHERE num_employees >= $1 AND num_employees <= $2 AND name ILIKE $3",
   * values: [1, 3, "%company%"]
   * }
   * */
  static whereBuilder(queries) {
    const queryStatements = [];
    const values = [];
    
    if (queries) {
      const { minEmployees, maxEmployees, nameLike } = queries;

      if (minEmployees > maxEmployees) {
        throw new BadRequestError("minimum employees cannot be greater than maximum employees");
      }

      if (minEmployees) {
        queryStatements.push(`num_employees >= $${values.length + 1}`);
        values.push(minEmployees);
      }

      if (maxEmployees) {
        queryStatements.push(`num_employees <= $${values.length + 1}`);
        values.push(maxEmployees);
      }

      if (nameLike) {
        queryStatements.push(`name ILIKE $${values.length + 1}`);
        values.push(`%${nameLike}%`);
      }
    }

    const whereClause = queryStatements.length > 0 ? "WHERE " + queryStatements.join(" AND ") : "";

    return { whereClause, values };
  }

  /** Find all companies.
   * Can take any combination of optional query filters like:
   * {
   *   minEmployees: 1,
   *   maxEmployees: 3,
   *   nameLike: "company"
   * }
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(queries) {
    const { whereClause, values } = Company.whereBuilder(queries)

    const companiesRes = await db.query(`
      SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url      AS "logoUrl"
      FROM companies
      ${whereClause}
      ORDER BY name`,
      values);

    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
