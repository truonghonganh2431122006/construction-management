const request = require("supertest");
const app = require("../src/app");

describe("Construction Management API", () => {
    test("GET / returns the API status as JSON", async () => {
        const response = await request(app)
            .get("/")
            .expect("Content-Type", /json/)
            .expect(200);

        expect(response.body).toEqual({
            message: "Construction Management API running"
        });
    });

    test("GET /unknown-route returns 404", async () => {
        await request(app)
            .get("/unknown-route")
            .expect(404);
    });
});
