import { rs } from "rsformat";

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
