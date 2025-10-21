# RSFormat

RSFormat is a string formatting/printing library for JavaScript. It offers a minimal, yet powerful and flexible alternative to the string formatting and printing provided by `console.log`.

```js
import { rs, println } from 'rsformat';

let s = rs`${15} is ${15}:#X in hex`;
// s == '15 is 0xF in hex'

println(rs`${'a'}:^5`);
// Prints '  a  '
```

## Motivation

`console.log` is an odd method: its output can be affected by functions called before/after it (such as `console.group`), or their order affected by what parameters there are. For example, when calling `console.log(string, number)`, number can come either after or inside `string` depending on the value of `string`.

This behaviour has largely been superseded at a language level by template literals, which allow formatting of parameters directly inside the templates, causing these methods to have unnecessary overhead and undesired behaviour.

RSFormat builds onto template literals by implementing Rust-style format specifiers and lightweight printing functions. Rust formatting includes a lot of convenient operators for formatting text, such as padding/alignment, printing numbers in a given base, specifying decimal precision, etc.

## Usage

You can install RSFormat from [npm](https://www.npmjs.com/package/rsformat):

```sh
npm install rsformat
```

### Basic formatting and printing to console

The `rs` template tag can be used to enable rust-style formatting in a template.

To reference a previous or following argument, use `rs.ref` with the argument number. This is useful if you want to reuse a complicated expression without having to declare it separately.

```js
import { rs, println } from 'rsformat';      // ESM
const { rs, println } = require('rsformat'); // CommonJS

let number = 14;

let info = rs`${number+1} is ${rs.ref(0)}:x in hex`; // info == '15 is f in hex'
```

> NB: templates tagged with `rs` are instances of a special class `RsString` that extends `String`, rather than a primitive value. This is to enable colors for debug formatting inside the printing functions. This difference should not affect normal usage, but `rs.raw` can be used as an alternative tag to get a primitive `string` with ANSI control characters escaped.

The printing functions can be called with plain strings, instances of `String` or templates formatted with `rs`:

```ts
println('Hello World');
println(`This template did ${'Not'} need fancy formatting`);
println(rs`...`);
```

### Format Specifiers

Format specifiers can be used by adding `:` after the format argument, and will format the value differently inside the string. See the [rust format docs](https://doc.rust-lang.org/std/fmt/) for more detailed information on format specifiers.

This implementation differs from the Rust one in a few ways:

- Rather than escaping the braces using `{{` or `}}`, the formatting colon can be escaped using `::`.
- Different parameters are referenced using `rs.ref(n)` rather than the number literal `n`.
- To separate a formatting specifier from the rest of the string without adding a space, an extra closing colon must be added (eg. `:#?:foo` - specifier gets parsed as `:#?`)
- The `-` sign (unused in Rust) will add a space if the number is positive to align it with negative numbers without showing a `+`.
- Pointer format type `p` is unsupported.
- Hexadecimal debug types `x?` and `X?` are unsupported. 
- Specifying precision dynamically with `*` is unsupported. Instead, precision and width can both be specified dynamically by using a separate number parameter in place of the number.
- New format types have been added:
    - `N` for uppercase ordinal suffixing of numbers (rounded to integers)
    - `n` for lowercase ordinal suffixing of numbers (rounded to integers)

#### Different formatting types

The debug format specifier `?` uses `util.inspect` to stringify the parameter rather than `toString`.
 
```js
let obj = { a: 1 };
println(rs`${obj}`);   // prints '[object Object]'
println(rs`${obj}:?`); // prints '{ a: 1 }'
```

The provided printing functions will display colors in the output of `util.inspect`, but otherwise it will be formatted without color.

The specifiers `b`,`o`,`x`,`X`,`e`,`E`,`n`,`N` will convert a `number` or `bigint` parameter to:
- `b`: binary 
- `o`: octal 
- `x`/`X`: lowercase/uppercase hexadecimal
- `e`/`E`: lowercase/uppercase scientific notation
- `n`/`N`: lowercase/uppercase ordinal suffixed string (rounded to integer)

```js
let advancedInfo = (n) => rs`${n} is ${n}:x in hex, ${n}:b in binary and ${n}:o in octal`;

advancedInfo(15); // '15 is f in hex, 1111 in binary and 17 in octal'

let hugeNumber = 1000n;
let science = rs`${hugeNumber}:E`; // '1E3'
let ordinal = rs`${hugeNumber}:n`; // '1000th'
```

#### Padding, Alignment

Values can be aligned using any fill character (will default to a space ` `), and either left, center or right aligned with `<`, `^` or `>` respectively (will default to right alignment `>`). You will also have to specify a width with an integer after the alignment, or provide a separate number parameter.

```js
/*
Will print a pyramid of 'a's:
'  a  '
' aaa '
'aaaaa'
*/
let pyramidLevels = ['a', 'aaa', 'aaaaa'];
for(let value of pyramidLevels) {
    println(rs`${value}:^5`);
}
```

```js
rs`${[1,2]}:.>${7}` // '....1,2'
```

#### Pretty Printing

In some instances (namely debug, binary, octal and hexadecimal formatting), adding a `#` before the format specifier will use an alternative 'pretty' printing style. This amounts to using multiline `util.inspect` for debug printing (spanning multiple lines), and adding `0b`/`0o`/`0x` as a prefix for the numbers in the respective bases.

```js
rs`${255}:#X` // '0xFF'
```

#### Specific Number Formatting

Specifically for `number` and `bigint` values, a `0` can be placed before the width to pad the number with zeroes instead. This will account for signs and possible formatting differences.

```js
rs`${15}:#07x` // '0x0000F'
```

Decimal precision can be specified for numbers by adding a `.` and specifying an integer for precision. An additional parameter can also be provided to do this dynamically.

```js
rs`${1.23456789}:.3` // '1.234'
rs`${-1}:.${3}`      // '-1.000'
```

Adding a `+` to the formatting specifier will print the sign regardless of whether the number is negative.
Adding a `-` will instead add a space if the number is positive.

```js
rs`${1}:+` // '+1'
rs`${1}:-` // ' 1'
```

## Older versions of RSFormat

Versions of RSFormat on npm prior to `1.0.0` provide formatting and printing functions that are more similar in syntax to Rust, using plain strings instead of tagged templates:

```js
import { format } from 'rsformat';
format('{} is {0:#x} in hex', 15); // '15 is 0xf in hex'
```

See the `old` branch for more detailed documentation. The last version to use this formatting was `0.2.5`.