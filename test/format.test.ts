import { rs } from "rsformat";
import { formatParam } from "rsformat/format";

import util from "node:util"

const str = "a";
const obj = {
    a: 1,
    b: str
}

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
        expect(rs.raw`${1.23456789}:.3`).toBe('1.234');
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

