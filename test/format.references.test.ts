import { rs } from "rsformat";

describe("rs.ref advanced behavior", () => {
    test("forward reference", () => {
        expect(rs.raw`${rs.ref(1)} ${"later"}`).toBe("later later");
    });

    test("multiple references to same index", () => {
        expect(rs.raw`${""}${rs.ref(0)} + ${rs.ref(0)}`).toBe(" + ");
    });

    test("nested rs with references", () => {
        const out = rs.raw`${rs`${""}${rs.ref(0)}`}`;
        expect(out).toBe("");
    });

    test("out of range reference throws", () => {
        expect(() => rs.raw`${rs.ref(10)}`).toThrow();
    });

    test("recursive reference throws", () => {
        expect(() => rs`${rs.ref(1)} ${rs.ref(0)}`).toThrow();
    });
});
