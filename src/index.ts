import { inspect } from 'util';

/**
 * Regex to match for possible formatting insertion points.
 * Similar to the way formatting is parsed in rust,
 * but with a few key differences:
 * - Named arguments before format specifiers aren't allowed, only numbers can be used.
 * - The - sign (unused in rust) is unsupported.
 * - Pointer format type 'p' is unsupported.
 * - Hexadecimal debug types 'x?' and 'X?' are unsupported. 
 * 
 * The formatter currently matches with a regex 
 * instead of a full-blown parser for simplicity 
 * and performance, as built-in regex matching is 
 * likely to be faster than a js-implemented parser.
 * However, this will not match incorrectly formatted
 * insertion points.
 */
const FORMAT_REGEX = (
    /\{{2}|\}{2}|\{(\d*?)(?::(?:(.?)(\^|>|<))?(\+)?(#)?(0)?(\d*)?(\.(?:\d*|\*))?(\?|o|x|X|b|e|E)?)?\}/g
);

/**
 * Format a string similarly to rust's format! macro.
 * 
 * @param str String used for formatting
 * @param params Parameters to be inserted into the format string
 */
function format(str: string, ...params: any[]) {
    // Counter used for insertion of unnumbered values
    let param_counter = 0;

    return str.replace(FORMAT_REGEX,
        (
            $text: string,
            $param_number: string | undefined,
            $fill_character: string | undefined,
            $align_direction: '^' | '>' | '<' | undefined,
            $sign: '+' | undefined,
            $pretty: '#' | undefined,
            $pad_zeroes: '0' | undefined,
            $width: string,
            $precision: string,
            $type: '?' | 'o' | 'x' | 'X' | 'b' | 'e' | 'E' | undefined
        ) => {
            // Return a bracket if the regex matched an escaped bracket
            if ($text === '{{') {
                return '{';
            }
            if ($text === '}}') {
                return '}';
            }
            // Process parameter number; increment param_counter if not included
            let param = $param_number === '' ? params[param_counter++] : params[Number($param_number)];
            if (param === undefined) {
                throw new Error(`parameter ${$param_number || param_counter - 1} either NaN or not provided`);
            }

            let param_is_number = (typeof param === 'number') || (typeof param === 'bigint');

            // Process parameter type
            switch ($type) {
                case "o": param = param.toString(8); break;
                case "x": param = param.toString(16); break;
                case "X": param = param.toString(16).toUpperCase(); break;
                case "b": param = param.toString(2); break;
                case "e":
                    switch (typeof param) {
                        case 'number':
                            param = param.toExponential();
                            break;
                        case 'bigint':
                            param = param.toLocaleString('en-US', {
                                notation: 'scientific',
                                maximumFractionDigits: 20,
                            });
                            break;
                        default:
                            param = param.toString();
                            break;
                    }
                    break;
                case "E":
                    switch (typeof param) {
                        case 'number':
                            param = param.toExponential().toUpperCase();
                            break;
                        case 'bigint':
                            param = param.toLocaleString('en-US', {
                                notation: 'scientific',
                                maximumFractionDigits: 20
                            }).toUpperCase();
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

            let width: number;
            if ($width === undefined) {
                width = 0;
            } else {
                width = +$width;
                if (Number.isNaN(width)) throw new Error(`invalid width specifier '${$width}' (must be an integer)`);
            }


            if (param_is_number) {
                // Compute parameter sign and pad with 0s if specified
                let maybe_sign = (param as string).substring(0, 1);
                if (maybe_sign === '-') {
                    param = (param as string).substring(1, param.length);
                } else if ($sign === '+') {
                    maybe_sign = '+';
                }

                if ($pad_zeroes === '0') {
                    param = (param as string).padStart(width - maybe_sign.length, "0");
                }

                param = maybe_sign + param;
            }

            /* TODO */
            return "";
        }
    );
}