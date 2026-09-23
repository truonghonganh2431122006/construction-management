const request = require("supertest");
const session = require("express-session");
const argon2 = require("argon2");
const { createApp } = require("../src/app");
const { createAuthService } = require("../src/services/authService");

const EMAIL = "builder@example.com";
const PASSWORD = "A correct password for the test";
const INVALID_CREDENTIALS = {
    message: "Thông tin đăng nhập không chính xác"
};
const LOCK_DURATION_MS = 15 * 60 * 1000;

function createUserModel(passwordHash) {
    let now = Date.parse("2026-09-23T10:00:00.000Z");
    const user = {
        id: 1,
        email: EMAIL,
        password_hash: passwordHash,
        role_id: 2,
        failed_login_attempts: 0,
        locked_until: null
    };

    const model = {
        withLockedUser: jest.fn(async (email, callback) => {
            const found = email === user.email;
            const lockedUntil = user.locked_until?.getTime();
            return callback(found ? {
                ...user,
                is_locked: lockedUntil !== undefined && lockedUntil > now,
                lock_expired: lockedUntil !== undefined && lockedUntil <= now
            } : null, {
                recordFailure: async (attempts) => {
                    user.failed_login_attempts = attempts;
                    user.locked_until = attempts >= 5
                        ? new Date(now + LOCK_DURATION_MS)
                        : null;
                },
                resetFailures: async () => {
                    user.failed_login_attempts = 0;
                    user.locked_until = null;
                }
            });
        })
    };

    return {
        model,
        user,
        advanceTime: (milliseconds) => { now += milliseconds; },
        currentTime: () => now
    };
}

function storedSessions(store) {
    return new Promise((resolve, reject) => {
        store.all((error, sessions) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(sessions);
        });
    });
}

function sessionCookie(response) {
    const cookie = response.headers["set-cookie"]?.find((value) =>
        value.startsWith("construction.sid="));
    expect(cookie).toBeDefined();
    return cookie.split(";")[0];
}

describe("Authentication", () => {
    let passwordHash;
    let fixture;
    let store;
    let app;

    beforeAll(async () => {
        passwordHash = await argon2.hash(PASSWORD, {
            type: argon2.argon2id,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1
        });
    });

    beforeEach(() => {
        fixture = createUserModel(passwordHash);
        store = new session.MemoryStore();
        app = createApp({
            authService: createAuthService({ userModel: fixture.model }),
            sessionStore: store,
            sessionSecret: "test-session-secret-with-at-least-32-characters",
            secureCookies: false,
            trustProxy: false
        });
        app.get("/__test/session", (req, res) => {
            res.json({ userId: req.session.userId ?? null });
        });
    });

    test("valid Argon2id credentials reset failures and create an authenticated session", async () => {
        fixture.user.failed_login_attempts = 3;
        const agent = request.agent(app);

        const response = await agent.post("/auth/login")
            .send({ email: EMAIL, password: PASSWORD })
            .expect(200);

        expect(passwordHash).toMatch(/^\$argon2id\$/);
        expect(response.body).toEqual({
            message: "Đăng nhập thành công",
            user: { id: 1, email: EMAIL, role_id: 2 }
        });
        expect(fixture.user.failed_login_attempts).toBe(0);
        expect(fixture.user.locked_until).toBeNull();
        sessionCookie(response);
        const cookieHeader = response.headers["set-cookie"].find((value) =>
            value.startsWith("construction.sid="));
        expect(cookieHeader).toMatch(/; HttpOnly(?:;|$)/);
        expect(cookieHeader).toMatch(/; SameSite=Lax(?:;|$)/);
        await agent.get("/__test/session").expect(200, { userId: 1 });

        const sessions = Object.values(await storedSessions(store));
        expect(sessions).toHaveLength(1);
        expect(sessions[0].userId).toBe(1);
        expect(JSON.stringify(sessions)).not.toContain(passwordHash);
        expect(JSON.stringify(sessions)).not.toContain(PASSWORD);
    });

    test("incorrect password and unknown email return the same generic error", async () => {
        const incorrectPassword = await request(app).post("/auth/login")
            .send({ email: EMAIL, password: "incorrect password" })
            .expect(401);
        const unknownEmail = await request(app).post("/auth/login")
            .send({ email: "unknown@example.com", password: PASSWORD })
            .expect(401);

        expect(incorrectPassword.body).toEqual(INVALID_CREDENTIALS);
        expect(unknownEmail.body).toEqual(INVALID_CREDENTIALS);
        expect(fixture.user.failed_login_attempts).toBe(1);
        expect(fixture.user.locked_until).toBeNull();
        expect(await storedSessions(store)).toEqual({});
    });

    test.each(["plaintext", "argon2i"])("legacy %s passwords are rejected with the generic error", async (format) => {
        fixture.user.password_hash = format === "plaintext"
            ? PASSWORD
            : await argon2.hash(PASSWORD, {
                type: argon2.argon2i,
                memoryCost: 19456,
                timeCost: 2,
                parallelism: 1
            });

        await request(app).post("/auth/login")
            .send({ email: EMAIL, password: PASSWORD })
            .expect(401, INVALID_CREDENTIALS);

        expect(fixture.user.failed_login_attempts).toBe(1);
        expect(await storedSessions(store)).toEqual({});
    });

    test("a failed session save cannot authenticate through an automatic save retry", async () => {
        jest.spyOn(store, "set").mockImplementationOnce((sessionId, data, callback) => {
            process.nextTick(callback, new Error("Session store unavailable"));
        });
        const agent = request.agent(app);

        await agent.post("/auth/login")
            .send({ email: EMAIL, password: PASSWORD })
            .expect(500);

        const sessions = Object.values(await storedSessions(store));
        expect(sessions.filter((value) => value.userId !== undefined)).toEqual([]);
        await agent.get("/__test/session").expect(200, { userId: null });
    });

    test("five incorrect passwords lock the account for 15 minutes", async () => {
        for (let attempt = 1; attempt <= 5; attempt += 1) {
            await request(app).post("/auth/login")
                .send({ email: EMAIL, password: "incorrect password" })
                .expect(401, INVALID_CREDENTIALS);
            expect(fixture.user.failed_login_attempts).toBe(attempt);
            if (attempt < 5) {
                expect(fixture.user.locked_until).toBeNull();
            }
        }

        expect(fixture.user.locked_until.getTime()).toBe(
            fixture.currentTime() + LOCK_DURATION_MS);
        expect(await storedSessions(store)).toEqual({});

        await request(app).post("/auth/login")
            .send({ email: EMAIL, password: PASSWORD })
            .expect(401, INVALID_CREDENTIALS);
        expect(fixture.user.failed_login_attempts).toBe(5);
        expect(fixture.user.locked_until.getTime()).toBe(
            fixture.currentTime() + LOCK_DURATION_MS);
        expect(await storedSessions(store)).toEqual({});
    });

    test("correct credentials work at lock expiry and clear the lock and counter", async () => {
        fixture.user.failed_login_attempts = 5;
        fixture.user.locked_until = new Date(fixture.currentTime() + LOCK_DURATION_MS);
        fixture.advanceTime(LOCK_DURATION_MS);

        await request(app).post("/auth/login")
            .send({ email: EMAIL, password: PASSWORD })
            .expect(200);

        expect(fixture.user.failed_login_attempts).toBe(0);
        expect(fixture.user.locked_until).toBeNull();
    });

    test("an incorrect password after lock expiry starts a new failure count", async () => {
        fixture.user.failed_login_attempts = 5;
        fixture.user.locked_until = new Date(fixture.currentTime() + LOCK_DURATION_MS);
        fixture.advanceTime(LOCK_DURATION_MS);

        await request(app).post("/auth/login")
            .send({ email: EMAIL, password: "incorrect password" })
            .expect(401, INVALID_CREDENTIALS);

        expect(fixture.user.failed_login_attempts).toBe(1);
        expect(fixture.user.locked_until).toBeNull();
    });

    test("logout destroys the session, clears the cookie, and invalidates the old cookie", async () => {
        const agent = request.agent(app);
        const loginResponse = await agent.post("/auth/login")
            .send({ email: EMAIL, password: PASSWORD })
            .expect(200);
        const oldCookie = sessionCookie(loginResponse);

        const logoutResponse = await agent.post("/auth/logout")
            .expect(200, { message: "Đăng xuất thành công" });

        expect(logoutResponse.headers["set-cookie"]).toEqual(expect.arrayContaining([
            expect.stringMatching(/^construction\.sid=;/)
        ]));
        expect(await storedSessions(store)).toEqual({});
        await agent.get("/__test/session").expect(200, { userId: null });
        await request(app).get("/__test/session")
            .set("Cookie", oldCookie)
            .expect(200, { userId: null });
    });

    test("successful login rotates the session id and invalidates the previous session", async () => {
        const agent = request.agent(app);
        const first = await agent.post("/auth/login")
            .send({ email: EMAIL, password: PASSWORD })
            .expect(200);
        const firstCookie = sessionCookie(first);
        const second = await agent.post("/auth/login")
            .send({ email: EMAIL, password: PASSWORD })
            .expect(200);

        expect(sessionCookie(second)).not.toBe(firstCookie);
        expect(Object.keys(await storedSessions(store))).toHaveLength(1);
        await request(app).get("/__test/session")
            .set("Cookie", firstCookie)
            .expect(200, { userId: null });
        await agent.get("/__test/session").expect(200, { userId: 1 });
    });

    test.each([
        {},
        { email: EMAIL },
        { password: PASSWORD },
        { email: "", password: PASSWORD },
        { email: EMAIL, password: "" },
        { email: 42, password: PASSWORD },
        { email: EMAIL, password: 42 },
        { email: { value: EMAIL }, password: PASSWORD },
        { email: EMAIL, password: [PASSWORD] }
    ])("malformed credentials return the generic error without querying users: %j", async (body) => {
        await request(app).post("/auth/login")
            .send(body)
            .expect(401, INVALID_CREDENTIALS);

        expect(fixture.model.withLockedUser).not.toHaveBeenCalled();
        expect(await storedSessions(store)).toEqual({});
    });

    test("logout succeeds without an existing authenticated session", async () => {
        await request(app).post("/auth/logout")
            .expect(200, { message: "Đăng xuất thành công" });
        expect(await storedSessions(store)).toEqual({});
    });
});
