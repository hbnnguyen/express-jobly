"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin,
  ensureIsCurrentUserOrAdmin
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

function next(err) {
  if (err) throw new Error("Got error from middleware");
}


describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test" } } };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureLoggedIn(req, res, next))
      .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {};
    const res = { locals: { user: {} } };
    expect(() => ensureLoggedIn(req, res, next))
      .toThrow(UnauthorizedError);
  });
});

describe("ensureIsAdmin", function () {
  test("works: user is admin", function () {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    ensureIsAdmin(req, res, next);
  });

  test("unauth if not admin", function () {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    expect(() => ensureIsAdmin(req, res, next))
      .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {};
    const res = { locals: { user: {} } };
    expect(() => ensureIsAdmin(req, res, next))
      .toThrow(UnauthorizedError);
  });
});

describe("ensureIsCurrentUserOrAdmin", function () {
  test("works: user is admin", function () {
    const req = { params: { username: "test2" } };
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    ensureIsCurrentUserOrAdmin(req, res, next);
  });

  test("works: user is current user", function () {
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    ensureIsCurrentUserOrAdmin(req, res, next);
  });

  test("unauth if not admin or current user", function () {
    const req = { params: { username: "test2" } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    expect(() => ensureIsCurrentUserOrAdmin(req, res, next))
      .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = { params: { username: "test2" } };
    const res = { locals: { user: {} } };
    expect(() => ensureIsCurrentUserOrAdmin(req, res, next))
      .toThrow(UnauthorizedError);
  });
});