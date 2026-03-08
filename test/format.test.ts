import { rs } from "rsformat";
import { formatParam } from "rsformat/format";

import util from "node:util"

const str = "a";
const obj = {
    a: 1,
    b: str
}

describe("Color handling", () => {
    test("debug formatting escapes colors but manual ANSI codes remain", () => {
        const manual = "\x1b[31mRED\x1b[0m";
        const formatted = rs`${manual} ${manual}:?`;

        // raw string should still contain manual ANSI codes
        expect(formatted.toString()).toContain("\x1b[31m");
        // but no ANSI codes from debug formatting
        expect(formatted.toString()).not.toContain("\x1b[32m");
    });

    test("nested RsString preserves debug colors", () => {
        const inner = rs`${{ a: 1 }}:?`;
        const outer = rs`${inner}`;

        // Outer colored string should contain inner colored debug output
        expect(outer.colored).toContain(inner.colored);
    });
});

describe("Pretty printing", () => {
    test("pretty debug formatting is multiline", () => {
        const obj = { a: 1, b: { c: 2 } };
        const pretty = rs`${obj}:#?`;

        // util.inspect with multiline formatting always contains newlines
        expect(pretty.valueOf()).toContain("\n");
    });

    test("pretty number formatting adds prefixes", () => {
        expect(rs.raw`${255}:#x`).toBe("0xff");
        expect(rs.raw`${255}:#X`).toBe("0xFF");
        expect(rs.raw`${8}:#o`).toBe("0o10");
        expect(rs.raw`${5}:#b`).toBe("0b101");
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

describe("Fill, alignment, padding", () => {
    test("fill + align works", () => {
        expect(rs.raw`${"a"}:_>5`).toBe("____a");
        expect(rs.raw`${"a"}:_<5`).toBe("a____");
        expect(rs.raw`${"a"}:_^5`).toBe("__a__");
    });

    test("zero padding works", () => {
        expect(rs.raw`${42}:05`).toBe("00042");
        expect(rs.raw`${-42}:05`).toBe("-0042"); // sign accounted for
    });

    test("zero padding ignores fill characters", () => {
        // fill character should be ignored when pad_zeroes is active
        expect(rs.raw`${42}:_>05`).toBe("00042");
    });
});

describe("Signs", () => {
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

describe("References", () => {
    test("ref works properly", () => {
        const out = rs.raw`${1} = ${rs.ref(0)}`;
        expect(out).toBe("1 = 1");
    });

    test("ref errors on recursive self-reference", () => {
        expect(() => rs`${rs.ref(1)} ${rs.ref(0)}`).toThrow();
    });
});

describe("Debug formatting", () => {
    test("debug formatting colors are removed in raw string", () => {
        let test_string = rs`${obj}:?`;
        expect(test_string.valueOf()).not.toEqual(test_string.colored);

        let stripped = util.stripVTControlCharacters(test_string.colored);
        expect(test_string.valueOf()).toEqual(stripped);
    });

    test("Debug formatting aligns correctly", () => {
        let test_string = rs`${str}:^5`;
        expect(test_string.length).toBe(5);
    });
})

describe("README.md examples", () => {
    test("basic formatting examples", () => {
        expect(rs.raw`${15} is ${15}:#X in hex`).toBe('15 is 0xF in hex');
        expect(rs.raw`${'a'}:^5`).toBe('  a  ');
    });

    test("rs.ref example", () => {
        let number = 14;
        expect(rs.raw`${number + 1} is ${rs.ref(0)}:x in hex`)
            .toBe('15 is f in hex');
    });

    test("debug formatting examples", () => {
        let obj = { a: 1 };
        expect(rs.raw`${obj}`).toBe('[object Object]');
        expect(rs.raw`${obj}:?`).toBe('{ a: 1 }');
    });

    test("number base formatting examples", () => {
        let advancedInfo = (n: number) =>
            rs.raw`${n} is ${n}:x in hex, ${n}:b in binary and ${n}:o in octal`;

        expect(advancedInfo(15))
            .toBe('15 is f in hex, 1111 in binary and 17 in octal');

        let hugeNumber = 1000n;
        expect(rs.raw`${hugeNumber}:E`).toBe('1E3');
        expect(rs.raw`${hugeNumber}:n`).toBe('1000th');
    });


    const PYRAMID = "  a  \n" +
        " aaa \n" +
        "aaaaa\n"

    test("pyramid example (fixed width)", () => {
        const pyramidLevels = ['a', 'aaa', 'aaaaa'];

        const output = pyramidLevels
            .map(v => rs.raw`${v}:^5` + '\n')
            .join('');

        expect(output).toBe(PYRAMID);
    });

    test("pyramid example (dynamic width)", () => {
        const character = 'a';
        const baseWidth = 5;

        const output =
            Array.from({ length: 3 }, (_, i) => 1 + i * 2) // 1, 3, 5
                .map(width => rs.raw`${character.repeat(width)}:^${baseWidth}` + '\n')
                .join('');

        expect(output).toBe(PYRAMID);
    });


    test("pretty printing example", () => {
        expect(rs.raw`${255}:#X`).toBe('0xFF');
    });

    test("zero padding and precision examples", () => {
        expect(rs.raw`${15}:#07x`).toBe('0x0000f');
        expect(rs.raw`${1.23456789}:.3`).toBe('1.235');
        expect(rs.raw`${-1}:.${3}`).toBe('-1.000');
    });

    test("sign formatting examples", () => {
        expect(rs.raw`${1}:+`).toBe('+1');
        expect(rs.raw`${1}:-`).toBe(' 1');
    });

    test("string formatting examples", () => {
        let str = "Hello!";
        expect(rs.raw`${str}:+`).toBe('HELLO!');
        expect(rs.raw`${str}:-`).toBe('hello!');
    });

    test("formatParam example", () => {
        expect(rs.raw`${255}:<+#09.0X`).toBe("+0x0000FF");

        expect(formatParam(255, {
            fill: '',
            align: '<',
            force_sign: '+',
            pretty: true,
            pad_zeroes: true,
            width: 9,
            precision: 0,
            type: "X"
        })[0]).toBe("+0x0000FF");
    });
});

