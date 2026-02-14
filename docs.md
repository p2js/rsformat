# rsformat Format Specifier Documentation

A rsformat format specifier is parsed as follows:

- `${value}::` Will escape the colon character and replace it with a single `:`. Stringification of `value` will occur as in normal format strings.

- `${value}:[fill][align][sign][#][0][width][.(precision)][format_type][:]` is an unescaped format specifier and will parse the string as follows:

| Name          | Syntax                                                                 | Purpose                                                                                                                             | Default value |
| ------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `fill`        | any single character                                                     | The fill character for alignment                                                                                                    | space (` `)   |
| `align`       | `<`, `^` or `>`                                                        | The alignment direction (left, center, right)                                                                                       | right (`>`)   |
| `sign`        | `+` or `-`                                                             | Pad a positive number with `+` or a space ` ` (or convert a string to uppercase/lowercase)                                          | None          |
| `#`           | `#`                                                                    | Pretty printing (Add prefixes `0b`, `0o` and `0x` to binary, octal and hex-formatted numbers, and use non-compact debug formatting) | None          |
| `0`           | `0`                                                                    | Pads numbers with `0` characters instead of using fill/align                                                                        | None          |
| `width`       | any positive integer (in string or as ${} parameter)                   | Minimum width for fill/alignment                                                                                                    | 0             |
| `precision`   | `.` + any positive integer (in string or as ${} parameter)             | Minimum precision for non-integer numbers                                                                                           | 0             |
| `format_type` | `?`,`o`,`x`,`X`,`b`,`e`,`E`,`n` or `N`                                 | Format type (see [Format types](#format-types))                                                                                     | None          |
| `:`           | `:`                                                                    | Add to the end of a format specifier to not have to insert a space after it                                                         | None          |

Every single one of the above values is optional, but must be included in that order.

## Format types

| Character | Purpose                                                      | Example                    |
| :-------: | ------------------------------------------------------------ | -------------------------- |
|    `?`    | Debug formatting (`util.inspect` rather than `toString`)     | `[10]` -> `[10]`           |
|    `o`    | Octal number formatting                                      | `10` -> `12` or `0o12`     |
|    `x`    | Hexadecimal number formatting                                | `10` -> `a` or `0xa`       |
|    `X`    | Uppercase hexadecimal number formatting                      | `10` -> `A` or `0xA`       |
|    `b`    | Binary number formatting                                     | `10` -> `1010` or `0b1010` |
|    `e`    | Scientific notation number formatting                        | `10` -> `1e1`              |
|    `E`    | Uppercase scientific notation number formatting              | `10` -> `1E1`              |
|    `n`    | Ordinal-suffixed number formatting                           | `10` -> `10th`             |
|    `N`    | Uppercase ordinal-suffixed number formatting                 | `10` -> `10TH`             |

## Examples

`${"abc"}:+:!` Will capitalise `"abc"` with an exclamation mark right after it, ie. `ABC!`

`${15}:#08x` Will convert `15` to hexadecimal, add `0x` and pad it with 0s until it is 8 characters wide, ie. `0x00000F`

`${1.2345678}:,^10.${3}` will round `1.2345678` to 3 decimal places and center align it with `,` until it is 10 characters wide, ie. `,,1.234,,,`

## rsformat specifiers for those familiar with Rust formatting

This implementation parses formatting very similarly to Rust, but differing in a few key ways:

- Rather than escaping the braces using `{{` or `}}`, the formatting colon can be escaped using `::`.
- Different parameters are referenced using `rs.ref(n)` rather than the number literal `n`.
- To separate a formatting specifier from the rest of the string without adding a space, an extra closing colon must be added (eg. `:#?:foo` - specifier gets parsed as `:#?`)
- The `-` sign (unused in Rust) will add a space if the number is positive to align it with negative numbers without showing a `+`.
- When used on strings, `+` and `-` sign specifiers will conver them to uppercase and lowercase respectively
- Pointer format type `p` is unsupported.
- Hexadecimal debug types `x?` and `X?` are unsupported. 
- Specifying precision dynamically with `*` is unsupported. Instead, precision and width can both be specified dynamically by using a separate number parameter in place of the number.
- New format types have been added:
    - `N` for uppercase ordinal suffixing of numbers (rounded to integers)
    - `n` for lowercase ordinal suffixing of numbers (rounded to integers)
