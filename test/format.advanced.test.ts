import { rs } from "rsformat";

describe("Advanced specifier interactions", () => {
    test("sign + zero padding + width + base", () => {
        expect(rs.raw`${-15}:+05x`).toBe("-000f");
        expect(rs.raw`${15}:+05x`).toBe("+000f");
    });

    test("pretty + sign + width", () => {
        expect(rs.raw`${15}:+#6x`).toBe("  +0xf");
    });

    test("precision + width + alignment", () => {
        expect(rs.raw`${1.2345}:^10.2`).toBe("   1.23   ");
    });

    test("uppercase hex + pretty + precision", () => {
        expect(rs.raw`${255}:#.0X`).toBe("0xFF");
    });
});

describe("Number edge cases", () => {
    test("negative zero", () => {
        expect(rs.raw`${-0}:+`).toBe("+0");
    });

    test("very large bigint", () => {
        const n = 2n ** 64n;
        expect(rs.raw`${n}:x`).toBe(n.toString(16));
    });

    test("floating point rounding boundary", () => {
        expect(rs.raw`${1.005}:.2`).toBe("1.01");
    });

    test("scientific notation input formatted as given", () => {
        expect(rs.raw`${1e20}`).toBe("100000000000000000000");
    });
});

describe("String edge cases", () => {
    test("empty string with width", () => {
        expect(rs.raw`${""}:^5`).toBe("     ");
    });

    test("unicode width", () => {
        expect(rs.raw`${"😀"}:^5`).toBe("  😀  ");
    });

    test("string precision truncates", () => {
        expect(rs.raw`${"abcdef"}:.3`).toBe("abc");
    });
});

describe("Padding & alignment edge cases", () => {
    test("width smaller than content", () => {
        expect(rs.raw`${"abcdef"}:>3`).toBe("abcdef");
    });

    test("alignment with sign", () => {
        expect(rs.raw`${-5}:^5`).toBe(" -5  ");
    });
});