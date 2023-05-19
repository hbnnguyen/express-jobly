"use strict";

const { validate } = require("jsonschema");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(`
                INSERT INTO jobs (
                  title,
                  salary,
                  equity,
                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                title,
                salary,
                equity,
                company_handle AS "companyHandle"`, [
      title,
      salary,
      equity,
      companyHandle
    ],
    );
    const job = result.rows[0];

    return job;
  }

    /** Takes an object of any combination of query parameters like:
   * {
   *   title: "test",
   *   minSalary: 100,
   *   hasEquity: true
   * }
   *
   * returns an object of "WHERE" clause statements and their values like:
   * {
   * whereClause: "WHERE minSalary >= $1 AND equity > $2 AND title ILIKE $3",
   * values: [100, 0, "%test%"]
   * }
   * */
    static whereBuilder(queries) {
      const queryStatements = [];
      const values = [];

      if (queries) {
        const { title, minSalary, hasEquity } = queries;

        if (minSalary) {
          queryStatements.push(`salary >= $${values.length + 1}`);
          values.push(minSalary);
        }

        if (hasEquity) {
          queryStatements.push(`equity > $${values.length + 1}`);
          values.push(0);
        }

        if (title) {
          queryStatements.push(`title ILIKE $${values.length + 1}`);
          values.push(`%${title}%`);
        }
      }

      const whereClause = queryStatements.length > 0 ? "WHERE " + queryStatements.join(" AND ") : "";

      return { whereClause, values };
    }

  /** Find all jobs.
   * Can take any combination of optional query filters like:
   * {
   *   title: "test",
   *   minSalary: 100,
   *   hasEquity: true
   * }
   *
   * Returns [{ title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(queries) {
    const { whereClause, values } = Job.whereBuilder(queries);

    const jobsRes = await db.query(`
      SELECT title,
        salary,
        equity,
        company_handle AS "companyHandle"
      FROM jobs
      ${whereClause}
      ORDER BY title`,
      values);

    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(`
        SELECT title,
          salary,
          equity,
          company_handle AS "companyHandle"
        FROM companies
        WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING
          title,
          salary,
          equity,
          company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
 *
 * Throws NotFoundError if job not found.
 **/

  static async remove(id) {
    const result = await db.query(`
          DELETE
          FROM jobs
          WHERE id = $1
          RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;