# rsformat Format Specifier Documentation

A rsformat format specifier is parsed as follows:

- `${value}::` Will escape the colon character and replace it with a single `:`. Stringification of `value` will occur as in normal format strings.

- `${value}:[fill][align][sign][#][0][width][.(precision)][format_type][:]` is an unescaped format specifier and will parse the string as follows:

| Name          | Syntax                                 | Purpose                                                                                                                             | Default value |
| ------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `fill`        | any single chacter                     | The fill character for alignment                                                                                                    | space (` `)   |
| `align`       | `<`, `^` or `>`                        | The alignment direction (left, center, right)                                                                                       | right (`>`)   |
| `sign`        | `+` or `-`                             | Pad a positive number with `+` or a space ` ` (or convert a string to uppercase/lowercase)                                          | None          |
| `#`           | `#`                                    | Pretty printing (Add prefixes `0b`, `0o` and `0x` to binary, octal and hex-formatted numbers, and use non-compact debug formatting) | None          |
| `0`           | `0`                                    | Pads numbers with `0` characters instead of using fill/align                                                                        | None          |
| `width`       | any positive integer                   | Minimum width for fill/alignment                                                                                                    | 0             |
| `precision`   | `.` + any positive integer             | Minimum precision for non-integer numbers                                                                                           | 0             |
| `format_type` | `?`,`o`,`x`,`X`,`b`,`e`,`E`,`n` or `N` | Format type (see "Different Formatting Types" in README.md)                                                                                                      | None          |
| `:`           | `:`                                    | Add to the end of a format specifier to not have to insert a space after it                                                         | None          |

Every single one of the above values is optional, but must be included in that order.

## Examples

`${"abc"}:+:!` Will capitalise `"abc"` with an exclamation mark right after it, ie. `ABC!`

`${15}:#08x` Will convert `15` to hexadecimal, add `0x` and pad it with 0s until it is 8 characters wide, ie. `0x00000F`

`${1.2345678}:,^10.${3}` will round `1.2345678` to 3 decimal places and center align it with `,` untill it is 10 characters wide, ie. `,,1.234,,,`
