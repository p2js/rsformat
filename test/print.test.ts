import { print, println, rs } from "rsformat";

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