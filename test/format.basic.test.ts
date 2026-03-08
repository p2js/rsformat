import { rs } from "rsformat";
import { formatParam } from "rsformat/format";
import util from "node:util";

const str = "a";
const obj = { a: 1, b: str };

describe("Basic formatting", () => {
    test("basic formatting examples", () => {
        expect(rs.raw`${15} is ${15}:#X in hex`).toBe("15 is 0xF in hex");
        expect(rs.raw`${"a"}:^5`).toBe("  a  ");
    });

    test("debug formatting examples", () => {
        let o = { a: 1 };
        expect(rs.raw`${o}`).toBe("[object Object]");
        expect(rs.raw`${o}:?`).toBe("{ a: 1 }");
    });

    test("number base formatting examples", () => {
        let advancedInfo = (n: number) =>
            rs.raw`${n} is ${n}:x in hex, ${n}:b in binary and ${n}:o in octal`;

        expect(advancedInfo(15)).toBe(
            "15 is f in hex, 1111 in binary and 17 in octal"
        );

        let huge = 1000n;
        expect(rs.raw`${huge}:E`).toBe("1E3");
        expect(rs.raw`${huge}:n`).toBe("1000th");
    });
});

describe("Padding, alignment, signs", () => {
    test("fill + align works", () => {
        expect(rs.raw`${"a"}:_>5`).toBe("____a");
        expect(rs.raw`${"a"}:_<5`).toBe("a____");
        expect(rs.raw`${"a"}:_^5`).toBe("__a__");
    });

    test("zero padding works", () => {
        expect(rs.raw`${42}:05`).toBe("00042");
        expect(rs.raw`${-42}:05`).toBe("-0042");
    });

    test("zero padding ignores fill characters", () => {
        expect(rs.raw`${42}:_>05`).toBe("00042");
    });

    test("signs work for numbers", () => {
        expect(rs.raw`${5}:+`).toBe("+5");
        expect(rs.raw`${5}:-`).toBe(" 5");
        expect(rs.raw`${-5}:+`).toBe("-5");
    });

    test("signs do NOT apply to strings", () => {
        expect(rs.raw`${"abc"}:+`).toBe("ABC");
        expect(rs.raw`${"ABC"}:-`).toBe("abc");
    });
});

describe("Precision", () => {
    test("precision works for floats", () => {
        expect(rs.raw`${Math.PI}:.2`).toBe("3.14");
        expect(rs.raw`${1.999}:.0`).toBe("2");
    });

    test("precision works with dynamic parameter", () => {
        expect(rs.raw`${1.2345}:.${2}`).toBe("1.23");
    });
});

describe("Ordinals", () => {
    test(":n ordinal formatting works", () => {
        expect(rs.raw`${1}:n`).toBe("1st");
        expect(rs.raw`${2}:n`).toBe("2nd");
        expect(rs.raw`${3}:n`).toBe("3rd");
        expect(rs.raw`${4}:n`).toBe("4th");
        expect(rs.raw`${11}:n`).toBe("11th");
        expect(rs.raw`${21}:n`).toBe("21st");
    });
});

describe("Pretty printing basics", () => {
    test("pretty number formatting adds prefixes", () => {
        expect(rs.raw`${255}:#x`).toBe("0xff");
        expect(rs.raw`${255}:#X`).toBe("0xFF");
        expect(rs.raw`${8}:#o`).toBe("0o10");
        expect(rs.raw`${5}:#b`).toBe("0b101");
    });

    test("pretty debug formatting is multiline", () => {
        const o = { a: 1, b: { c: 2 } };
        const pretty = rs`${o}:#?`;
        expect(pretty.valueOf()).toContain("\n");
    });
});

describe("Debug formatting", () => {
    test("debug formatting colors are removed in raw string", () => {
        let s = rs`${obj}:?`;
        expect(s.valueOf()).not.toEqual(s.colored);

        let stripped = util.stripVTControlCharacters(s.colored);
        expect(s.valueOf()).toEqual(stripped);
    });

    test("Debug formatting aligns correctly", () => {
        let s = rs`${str}:^5`;
        expect(s.length).toBe(5);
    });
});

describe("README examples", () => {
    const PYRAMID =
        "  a  \n" +
        " aaa \n" +
        "aaaaa\n";

    test("pyramid example (fixed width)", () => {
        const levels = ["a", "aaa", "aaaaa"];
        const out = levels.map(v => rs.raw`${v}:^5` + "\n").join("");
        expect(out).toBe(PYRAMID);
    });

    test("pyramid example (dynamic width)", () => {
        const char = "a";
        const baseWidth = 5;

        const out = [1, 3, 5]
            .map(w => rs.raw`${char.repeat(w)}:^${baseWidth}` + "\n")
            .join("");

        expect(out).toBe(PYRAMID);
    });

    test("formatParam example", () => {
        expect(rs.raw`${255}:<+#09.0X`).toBe("+0x0000FF");

        expect(
            formatParam(255, {
                fill: "",
                align: "<",
                force_sign: "+",
                pretty: true,
                pad_zeroes: true,
                width: 9,
                precision: 0,
                type: "X"
            })[0]
        ).toBe("+0x0000FF");
    });
});