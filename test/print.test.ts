import { print, println, rs, dbg, eprint, eprintln } from "rsformat";
import { Writable } from "node:stream";
import { printToStream } from "rsformat/print";
import { stripVTControlCharacters } from "node:util";

let stdout: jest.SpyInstance;
let stderr: jest.SpyInstance;
let init_stdout = () => stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
let init_stderr = () => stderr = jest.spyOn(process.stderr, "write").mockImplementation(() => true);

const TEST_STRING = "Hello, World!";
const TEST_STRING_OBJ = new String("Object String");
const DEBUG_RSSTRING = rs`${{ a: 1, b: 2 }}:?`;

describe("stdout printing", () => {
    beforeEach(init_stdout);
    afterEach(() => stdout.mockClear());
    afterAll(() => stdout.mockRestore());

    test("print and println write strings to stdout", () => {
        print(TEST_STRING);
        println(TEST_STRING_OBJ);
        println(DEBUG_RSSTRING);

        expect(stdout.mock.calls.length).toBe(3);

        for (let call of stdout.mock.calls) {
            expect(typeof call[0]).toBe("string");
        }
    });

    test("println appends a newline", () => {
        println(TEST_STRING);
        expect(stdout.mock.calls[0][0][TEST_STRING.length]).toBe('\n');
    });

    test("print and println use colored debug formatting", () => {
        print(DEBUG_RSSTRING);
        println(DEBUG_RSSTRING);
        for (let call of stdout.mock.calls) {
            expect(call[0].length).toBeGreaterThan(DEBUG_RSSTRING.valueOf().length);
        }
    })
})

describe("stderr printing", () => {
    beforeEach(init_stderr);
    afterEach(() => stderr.mockClear());
    afterAll(() => stderr.mockRestore());

    test("eprint and eprintln write strings to stderr", () => {
        eprint(TEST_STRING);
        eprintln(TEST_STRING);
        eprintln(DEBUG_RSSTRING);

        expect(stderr.mock.calls.length).toBe(3);

        for (let call of stderr.mock.calls) {
            expect(typeof call[0]).toBe("string");
        }
    });

    test("eprintln appends a newline", () => {
        eprintln(TEST_STRING);
        expect(stderr.mock.calls[0][0][TEST_STRING.length]).toBe("\n");
    });

    test("eprint and eprintln use colored debug formatting", () => {
        eprint(DEBUG_RSSTRING);
        eprintln(DEBUG_RSSTRING);

        for (let call of stderr.mock.calls) {
            expect(call[0].length).toBeGreaterThan(DEBUG_RSSTRING.valueOf().length);
        }
    });
});

describe("printing to custom streams", () => {
    test("print and println write to a custom Writable stream", () => {
        let written: string[] = [];

        const writable = new Writable({
            write(chunk, _encoding, callback) {
                written.push(chunk.toString());
                callback();
            }
        });

        printToStream(writable, TEST_STRING, false, false);
        printToStream(writable, new String(TEST_STRING), true, false);
        printToStream(writable, DEBUG_RSSTRING, false, false);
        printToStream(writable, DEBUG_RSSTRING, false, true);

        expect(written.length).toBe(4);

        expect(written[0].endsWith("\n")).toBe(false);
        expect(written[1].endsWith("\n")).toBe(true);
        // debug formatting should be colored
        expect(written[2].length).not.toBeGreaterThan(DEBUG_RSSTRING.toString(false).length);
        expect(written[3].length).toBeGreaterThan(DEBUG_RSSTRING.toString(false).length);
    });
});

describe("dbg", () => {
    beforeEach(init_stderr);
    afterEach(() => stderr.mockClear());
    afterAll(() => stderr.mockRestore());

    test("dbg prints the value and returns it", () => {
        const value = { x: 10, y: 20 };

        const returned = dbg(value);

        // dbg should return the original value
        expect(returned).toBe(value);

        // dbg should print something
        expect(stderr.mock.calls.length).toBe(1);

        // printed output should contain debug formatting of the object
        const printed = stderr.mock.calls[0][0];
        expect(printed).toContain("x:");
        expect(printed).toContain("y:");
    });

    test("dbg works with expressions", () => {
        const returned = dbg(5 + 7);
        expect(returned).toBe(12);

        const printed = stderr.mock.calls[0][0];
        expect(printed).toContain("12");
    });
});
