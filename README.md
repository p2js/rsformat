# RSFormat

RSFormat is a string formatting/printing library for JavaScript. It offers a minimal, yet powerful and flexible alternative to the string formatting and printing provided by `console.log`.

```js
import { rs, println } from 'rsformat';

let s = rs`${15} is ${15}:#X in hex`;
// s == '15 is 0xF in hex'

println(rs`${'a'}:^5`);
// Prints '  a  '
```

## Table of Contents

- [Motivation](#motivation)
- [Usage](#usage)
    - [Basic formatting and printing to console](#basic-formatting-and-printing-to-console)
    - [Decorating terminal output](#decorating-terminal-output)
    - [Format specifiers](#format-specifiers)
        - [Different formatting types](#different-formatting-types)
        - [Padding, Alignment](#padding-alignment)
        - [Pretty printing with `#`](#pretty-printing-with-)
        - [Specific number formatting](#specific-number-formatting)
        - [Specific string formatting](#specific-string-formatting)
    - [Formatting without `rs`](#formatting-without-rs)
- [Older versions of RSFormat](#older-versions-of-rsformat)

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

> NB: templates tagged with `rs` are instances of a special class `RsString` that extends `String`, rather than a primitive value. This is to enable colours for debug formatting inside the printing functions. This difference should not affect normal usage, but `rs.raw` can be used as an alternative tag to get a primitive `string`.

The printing functions can be called with plain strings, instances of `String` or templates formatted with `rs`:

```ts
println('Hello World');
println(`This template did ${'Not'} need fancy formatting`);
println(rs`...`);
```

### Decorating terminal output

If you want to decorate text for terminal output, you can use `rs.style`, which will format a string using one (or more with an array) of [the modifiers provided by node's `util` module](https://nodejs.org/docs/latest-v22.x/api/util.html#modifiers).

This is a re-export of node's `util.styleText`, and is thus aware of whether the current stdout will support the provided styles.

```ts
println(rs.style("red", "I am angry"));
println(rs.style(["red", "bold", "underline"], "I am very angry"));
```

This also works if passed inside `rs` tagged templates.

### Format Specifiers

Format specifiers can be used by adding a `:` after the format argument, and will format the value differently inside the string. 

See [docs.md](./docs.md) for a detailed yet quick reference for format specifiers.

#### Different formatting types

The debug format specifier `?` uses `util.inspect` to stringify the parameter rather than `toString`.
 
```js
let obj = { a: 1 };
println(rs`${obj}`);   // prints '[object Object]'
println(rs`${obj}:?`); // prints '{ a: 1 }'
```

The provided printing functions will display colours in the output of `util.inspect`, but otherwise it will be formatted without colour.

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

// More powerful equivalent:
const character = 'a';
const baseWidth = 5;
for(let width = 1; width <= baseWidth; width += 2) {
    println(rs`${character.repeat(width)}:^${baseWidth}`);
}
```

```js
rs`${[1,2]}:.>7` // '....1,2'
```

#### Pretty printing with `#`

In some instances (namely debug, binary, octal and hexadecimal formatting), adding a `#` before the format specifier will use an alternative 'pretty' printing style. This amounts to using multiline `util.inspect` for debug printing (spanning multiple lines), and adding `0b`/`0o`/`0x` as a prefix for the numbers in the respective bases.

```js
rs`${255}:#X` // '0xFF'
```

#### Specific number formatting

Specifically for `number` and `bigint` values, a `0` can be placed before the width to pad the number with zeroes instead. This will account for signs and possible formatting differences.

```js
rs`${15}:#07x` // '0x0000f'
```

Decimal precision can be specified for numbers by adding a `.` and specifying an integer for precision. An additional parameter can also be provided to do this dynamically.

```js
rs`${1.23456789}:.3` // '1.235'
rs`${-1}:.${3}`      // '-1.000'
```

Adding a `+` to the formatting specifier will print the sign regardless of whether the number is negative.
Adding a `-` will instead add a space if the number is positive.

```js
rs`${1}:+` // '+1'
rs`${1}:-` // ' 1'
```

#### Specific string formatting

Adding a `+` or `-` to a formatting specifier of a string will instead convert it to uppercase or lowercase respectively.

```js
let str  = "Hello!"
let str_upper = rs`${str}:+` // 'HELLO!'
let str_lower = rs`${str}:-` // 'hello!'
```

## Formatting without `rs`

If you want to format a single value without using an `rs` template, you can use the `formatParam` function. It provides a more explicit, object‑based API and avoids parsing format specifiers.

> NB: formatParam returns an array with the raw and debug-colored string at indices `0` and `1` respectively.

```ts
import { formatParam } from "rsformat/format";

// Equivalent to `${255}:+#09X` or `${255}:<+#09.0X`
let [ pretty255 ] = formatParam(255, {
    fill: '',
    align: '<',
    force_sign: '+',
    pretty: true,
    pad_zeroes: true,
    width: 9,
    precision: 0,
    type: "X"
});

// pretty255 == '+0x0000FF'
```

## Older versions of RSFormat

Versions of RSFormat on npm prior to `1.0.0` provide formatting and printing functions that are more similar in syntax to Rust, using plain strings instead of tagged templates:

```js
import { format } from 'rsformat';
format('{} is {0:#x} in hex', 15); // '15 is 0xf in hex'
```

See the `old` branch for more detailed documentation. The last version to use this formatting was `0.2.5`.