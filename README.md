# RSFormat

RSFormat is a string formatting/printing library for JavaScript. It offers a minimal, yet powerful and flexible alternative to the string formatting and printing provided by `console.log`.

## Motivation

`console.log` is an odd method: its output can be affected by functions called before/after it (such as `console.group`), or their order affected by what parameters there are. For example, when calling `console.log(string, number)`, number can come either after or inside `string` depending on the value of `string`.

RSFormat provides alternative functions with standardised behaviour: its `format`, `println` and all other functions will always output in the same manner, and have a standardised syntax which will only print the initial string, formatted with the parameters provided afterwards.

Rust formatting also includes a lot of convenient operators for formatting text, such as padding/alignment, printing numbers in a given base, specifying decimal precision, etc.. This makes it a more ergonomic and convenient approach to printing things to the console.

## Usage

you can install rsformat using [npm](https://www.npmjs.com/package/rsformat):

```
npm install rsformat
```

### Basic formatting and printing to console

RSFormat functions are called using a format string, and any number of format arguments following it.

Any instance of `{}` in the format strings will get replaced with a value.

You can specify what value you want in the parameters by using a number inside the insertion point.

```js
import { format, println } from 'rsformat';      // ESM
const { format, println } = require('rsformat'); // CommonJS

let name = 'everyone';

let greeting = format('Hello {}!', name); // Evaluates to the string 'Hello, everyone!'

println('I have {1} apples and {0} oranges', 13, 14); // Will print 'I have 14 apples and 13 oranges' to the console
```

### Format Specifiers

Format specifiers can be used by adding `:` inside the insertion point (after the optional argument number), and will format the value differently inside the string. See the [rust format docs](https://doc.rust-lang.org/std/fmt/#syntax) for more detailed information on format specifiers.

This implementation differs from the rust one in a few ways:

- Named arguments before or in format specifiers or in values aren't allowed, only numbers can be used.
- The `-` sign (unused in rust) is unsupported.
- Pointer format type `p` is unsupported.
- Hexadecimal debug types `x?` and `X?` are unsupported. 
- Specifying precision with `*` is unsupported.

#### Different formatting types

```js
// Debug format specifier: ?, uses util.inspect rather than toString

println('{}', { a: 1 }); //prints '[object Object]'
println('{:?}', { a: 1 }); //prints "{ a:1 }"

// Number base specifiers: x, X, b, o - for lower/uppercase hexadecimal, binary, octal

format('{} is {0:x} in hex, {0:b} in binary and {0:o} in octal', 15); // '15 is f in hex, 1111 in binary and 17 in octal'

// Scientific notation specifiers: e, E - for lower/uppercase scientific notation

let hugeNumber = 1000n;
format('{:E}', hugeNumber); // '1E3';
```

#### Padding, Alignment

Values can be aligned using any fill character (will default to a space ` `), and either left, center or right aligned with `<`, `^` or `>` respectively (will default to right alignment `>`). You will also have to specify a width with an integer after the alignment:

```js
/*
Will print a pyramid of 'a's:
'  a  '
' aaa '
'aaaaa'
*/
let pyramidLevels = ['a', 'aaa', 'aaaaa'];
for(let value of pyramidLevels) {
    println('{:^5}', value);
}
```

```js
format('{:.>7}', [1,2]); // '....1,2'
```

#### Pretty Printing

In some instances (namely debug and hexadecimal formatting), adding a `#` before the format specifier will use an alternative 'pretty' printing style. This amounts to using non-compact `util.inspect` for debug printing (spanning multiple lines), and adding 0x to hexadecimal numbers.

```js
format('{:#X}', 255); // '0xFF'
```

#### Specific Number Formatting

Specifically for `number` and `bigint` values, a 0 can be placed before the width to pad the number with 0s instead. This will account for signs and possible formatting differences.

```js
format('{:#07x}', 15) // '0x0000F'
```

Decimal precision can be specified for numbers by adding a . and specifying an integer for precision.

```js
format('{:.3}', 1.23456789); // '1.234'
format('{:.3}', -1);         // '-1.000'
```

Adding a + to the formatting specifier will print the sign regardless of whether the number is negative.

```js
format('{:+}', 1); // '+1'
```

## Custom output

If you want to use the print function to output to anything other than `process.stdout` and `process.stderr`, you can import the `Printer` function to create your own print functions, using any output and error streams that are instances of node's `Writable`.

```ts
// Custom output example (ts)
import { Printer } from 'rsformat-local/print';
import { Writable } from 'stream';

let someOutputStream: Writable = /* ... */;
let someErrorStream: Writable = /* ... */;

let { print, println, eprint, eprintln } = Printer(someOutputStream, someErrorStream);
```

## A Note on Performance

You might think that these utilities might have a performance impact on RSFormat's printing functions. And while they do, the functions are still consistently faster than `console.log`.

A simple benchmark setup like the one below will demonstrate that `println` is more performant, even when doing things like base conversions and text alignment, compared to `console.log` logging a simple string:

```js
// benchmark.mjs
import { println } from "rsformat";

const time = (fn, iter) => {
    let time = Date.now();
    while (iter-- > 0) {
        fn();
    }
    return Date.now() - time;
}

let iterations = 100000;

let logTime = time(() => console.log("hello"), iterations);
let printlnTime = time(() => println("{:>+#7X}", 255), iterations);

println("console.log time for {} executions: {}ms", iterations, logTime);
println("rsformat.println time for {} executions: {}ms", iterations, printlnTime);
```

```
> node benchmark.mjs
...After a lot of output...

console.log time for 100000 executions: 7217ms
rsformat.println time for 100000 executions: 5900ms
```

_Tested on node.js using a Windows laptop on an Intel core I7-1360P, on battery power. Performance will vary, but this benchmark was just to show that RSFormat has no performance penalty._