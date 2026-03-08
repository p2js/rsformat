import { rs } from "rsformat";

describe("Invalid format specifiers", () => {
    test("invalid type specifier throws", () => {
        expect(() => rs.raw`${15}:Q`).toThrow();
    });

    test("invalid width throws", () => {
        expect(() => rs.raw`${15}:^abc`).toThrow();
    });

    test("invalid precision throws", () => {
        expect(() => rs.raw`${15}:.xyz`).toThrow();
    });

    test("multi-character fill throws", () => {
        expect(() => rs.raw`${"a"}:..>5`).toThrow();
    });
});