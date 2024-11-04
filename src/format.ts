import { inspect } from 'util';

/**
 * Regex to match for possible formatting insertion points.
 * Similar to the way formatting is parsed in rust,
 * but with a few key differences:
 * - Named arguments before format specifiers aren't allowed, only numbers can be used.
 * - The - sign (unused in rust) is unsupported.
 * - Pointer format type 'p' is unsupported.
 * - Hexadecimal debug types 'x?' and 'X?' are unsupported. 
 * - Specifying precision with * is unsupported.
 * 
 * The formatter currently matches with a regex 
 * instead of a full-blown parser for simplicity 
 * and performance, as built-in regex matching is 
 * likely to be faster than a js-implemented parser.
 * However, this will not match incorrectly formatted
 * insertion points.
 */
const FORMAT_REGEX = (
    /\{{2}|\}{2}|\{(\d*?)(?::(?:(.?)(\^|>|<))?(\+)?(#)?(0)?(\d*)?(\.\d*)?(\?|o|x|X|b|e|E)?)?\}/g
);

/**
 * Format a string similarly to rust's format! macro.
 * 
 * @param str String used for formatting
 * @param params Parameters to be inserted into the format string
 */
export function format(str: string, ...params: any[]) {
    // Counter used for insertion of unnumbered values
    let param_counter = 0;

    str = str.replace(FORMAT_REGEX,
        (
            $: string,
            $param_number: string | undefined,
            $fill_character: string | undefined,
            $align_direction: '^' | '>' | '<' | undefined,
            $sign: '+' | undefined,
            $pretty: '#' | undefined,
            $pad_zeroes: '0' | undefined,
            $width: string | undefined,
            $precision: string | undefined,
            $type: '?' | 'o' | 'x' | 'X' | 'b' | 'e' | 'E' | undefined
        ) => {
            // Return a bracket if the regex matched an escaped bracket
            if ($ === '{{') {
                return '{';
            }
            if ($ === '}}') {
                return '}';
            }
            // Process parameter number; increment param_counter if not included
            let param = $param_number === undefined
                ? params[param_counter++]
                : params[+$param_number];
            if (param === undefined) {
                throw new Error(`parameter ${$param_number || param_counter - 1} either NaN or not provided`);
            }

            let param_type = typeof param;

            // Process parameter type
            switch ($type) {
                case "o": param = param.toString(8); break;
                case "x": param = param.toString(16); break;
                case "X": param = param.toString(16).toUpperCase(); break;
                case "b": param = param.toString(2); break;
                case "e":
                    switch (param_type) {
                        case 'number':
                            param = param.toExponential();
                            break;
                        case 'bigint':
                            param = param.toLocaleString('en-US', {
                                notation: 'scientific',
                                maximumFractionDigits: 20,
                            }).toLowerCase();
                            break;
                        default:
                            param = param.toString();
                            break;
                    }
                    break;
                case "E":
                    switch (param_type) {
                        case 'number':
                            param = param.toExponential().toUpperCase();
                            break;
                        case 'bigint':
                            param = param.toLocaleString('en-US', {
                                notation: 'scientific',
                                maximumFractionDigits: 20
                            });
                            break;
                        default:
                            param = param.toString();
                            break;
                    }
                    break;
                case "?":
                    param = inspect(param, {
                        depth: Infinity,
                        colors: true,
                        compact: $pretty !== '#'
                    });
                    break;
                default: param = param.toString(); break;
            };

            // Compute radix-point precision on numbers
            if (param_type == 'number' && $precision) {
                let [pre, post] = (param as string).split(".");
                if (post === undefined) {
                    post = "";
                }
                let precision = +$precision.substring(1, $precision.length);
                if (post.length > precision) {
                    post = post.substring(0, precision);
                } else while (post.length < precision) {
                    post = post + '0';
                }
                param = pre + "." + post;
            }

            let width: number;
            if ($width === undefined) {
                width = 0;
            } else {
                width = +$width;
                if (Number.isNaN(width)) throw new Error(`invalid width specifier '${$width}' (must be an integer)`);
            }

            let filled = false;

            if ((param_type == 'number') || (param_type == 'bigint')) {
                // Compute parameter sign
                let maybe_sign = (param as string).substring(0, 1);
                if (maybe_sign === '-') {
                    param = (param as string).substring(1, param.length);
                } else if ($sign === '+') {
                    maybe_sign = '+';
                } else {
                    maybe_sign = '';
                }

                //If the type is x or X and pretty printing enabled, add 0x
                if ((($type === 'x') || ($type === 'X')) && ($pretty === '#')) {
                    maybe_sign += '0x';
                }

                //pad with zeroes if specified  
                if ($pad_zeroes === '0') {
                    filled = true;
                    while (param.length < width - maybe_sign.length) {
                        param = '0' + param;
                    }
                }

                param = maybe_sign + param;
            }
            if (!filled && width) {
                // Compute fill/align
                $align_direction ||= '>'
                $fill_character ||= ' ';
                switch ($align_direction) {
                    case '>':
                        while (width - param.length > 0) {
                            param = $fill_character + param;
                        }
                        break;
                    case '<':
                        while (width - param.length > 0) {
                            param = param + $fill_character;
                        }
                        break;
                    case '^':
                        while (width - param.length > 1) {
                            param = $fill_character + param + $fill_character;
                        }
                        // Prioritise right-aligment on uneven alignment
                        if (width - param.length == 1) {
                            param = $fill_character + param;
                        }
                        break;
                }
            }
            return param;
        }
    );
    return str;
}