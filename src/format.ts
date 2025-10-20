import { inspect } from 'node:util';

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
    return fmt_raw(str, params);
}

/**
 * Raw formatting behaviour function called by `format` and printing functions.
 * 
 * @param str String used for formatting
 * @param params Parameters to be inserted into the format string
 * @param options Options passed into formatting (Whether to use colors in debug formatting - false by default)
 */
export function fmt_raw(str: string, params: any[], options = { colors: false }) {
    // Counter used for insertion of unnumbered values
    let param_counter = 0;

    str = str.replace(FORMAT_REGEX,
        (
            $: string,
            $param_number: string,
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
            let param = $param_number === ''
                ? params[param_counter++]
                : params[+$param_number];
            if (param === undefined) {
                throw new Error(`parameter ${$param_number || param_counter - 1} either NaN or not provided`);
            }

            let param_type = typeof param;
            let true_length = -1;

            // Process parameter type
            switch ($type) {
                case 'o': param = param.toString(8); break;
                case 'x': param = param.toString(16); break;
                case 'X': param = param.toString(16).toUpperCase(); break;
                case 'b': param = param.toString(2); break;
                case 'e':
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
                case 'E':
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
                case '?':
                    // Do not force sign, pad with zeroes or align to precision when using debug formatting
                    $sign = undefined;
                    $pad_zeroes = undefined;
                    $precision = undefined;

                    true_length = inspect(param, {
                        depth: Infinity,
                        colors: false,
                        compact: $pretty !== '#'
                    }).length;
                    param = inspect(param, {
                        depth: Infinity,
                        colors: options.colors,
                        compact: $pretty !== '#'
                    });
                    break;
                default: param = param.toString(); break;
            };
            if (true_length == -1) {
                true_length = param.length;
            }

            // Compute radix-point precision on numbers
            if (param_type == 'number' && $precision) {
                let [pre, post] = (param as string).split('.');
                let precision = +$precision.substring(1, $precision.length);
                if (!precision) { // precision = 0, do not include radix point
                    param = pre;
                } else {
                    post = ((post || '') + '0'.repeat(precision)).slice(0, precision);
                    param = pre + '.' + post;
                    // Update true length for fill/align
                    true_length = param.length;
                }
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

                // If pretty printing is enabled and the formating calls for a prefix, add it
                if ($pretty === '#') {
                    switch ($type) {
                        case 'o':
                            maybe_sign += "0o";
                            break;
                        case 'x':
                        case 'X':
                            maybe_sign += "0x";
                            break;
                        case 'b':
                            maybe_sign += "0b";
                            break;
                    }
                }

                //pad with zeroes if specified  
                if ($pad_zeroes === '0') {
                    filled = true;
                    while (param.length < width - maybe_sign.length) {
                        param = '0' + param;
                        true_length++
                    }
                }

                true_length += maybe_sign.length;
                param = maybe_sign + param;
            }
            if (!filled && width > true_length) {
                // Compute fill/align
                $align_direction ||= '>'
                $fill_character ||= ' ';
                let left = '';
                let right = '';
                let diff = width - true_length;

                switch ($align_direction) {
                    case '>': left = $fill_character.repeat(diff); break;
                    case '<': right = $fill_character.repeat(diff); break;
                    case '^':
                        left = $fill_character.repeat(diff - diff / 2);
                        // Prioritise right-aligment on uneven length
                        right = $fill_character.repeat(diff / 2 + diff % 2);
                        break;
                }
                param = left + param + right;
            }
            return param;
        }
    );
    return str;
}