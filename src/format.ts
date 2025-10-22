import util from 'node:util';

const is_digit = (c: string) => c >= '0' && c <= '9';
const error = (param: number, char: number, reason: string) => new Error(`rs[param ${param}, char ${char}] ${reason}`);
/**
 * Type representing a string formatted by `rs`.
 * An extension of `String`.
 */
export class RsString extends String {
    /**
     * A version of the string that includes ANSI escape codes for debug formatting.
     */
    colored: string
    constructor(strings: TemplateStringsArray, params: any[]) {
        let { raw, colored } = buildString(strings, params);
        super(raw);
        this.colored = colored;
    }
    override toString(debugColors: boolean = false): string {
        if (debugColors) return this.colored;
        return this.valueOf();
    }
}
/**
 * Format a template literal with rust-style formatting and return it as a raw and colored string.
 * 
 * @param strings String parts of the template
 * @param params Template parameters
 * 
 * @returns An object with raw and colored versions of the formatted parameter
 */
export function buildString(strings: TemplateStringsArray, params: any[]) {
    let raw = strings[0];
    let colored = strings[0];
    for (let i = 1; i < strings.length; ++i) {
        let string = strings[i];
        let param = params[i - 1];
        // Resolve parameter references recursively
        while (typeof param == 'object' && '__rs_param_ref' in param) {
            let ref_number = param.__rs_param_ref;
            if (typeof ref_number != 'number'
                || ref_number < 0
                || ref_number >= params.length
                || !Number.isInteger(ref_number)) {
                throw new Error(`Parameter ${i - 1}: Invalid reference`);
            }
            if (ref_number == i - 1) throw new Error(`Parameter ${i - 1} references itself recursively`);
            param = params[param.__rs_param_ref];
        }
        // Parse format specifier
        // If the string starts with a single : it has a format specifier,
        // If it has two the first : is being escaped and can be removed
        if (string[0] == ':') {
            if (string[1] == ':') {
                let stringified = param.toString() + string.substring(1);
                raw += stringified;
                colored += stringified;
                continue;
            }
        } else {
            let stringified = param.toString() + string;
            raw += stringified;
            colored += stringified;
            continue;
        };
        // Keep track of our index in the string to slice the format specifier later
        let idx = 1;
        // Compute format based on string
        let fill = ' ',
            align = '>' as AlignDirection,
            force_sign = '' as Sign,
            pretty = false,
            pad_zeroes = false,
            width = 0,
            precision = -1,
            format_type = '' as FormatType;
        // Fill/align
        // If the next character is align, then the current is the fill
        if (string[idx + 1] == '<' || string[idx + 1] == '^' || string[idx + 1] == '>') {
            fill = string[idx++];
        }
        if (string[idx] == '<' || string[idx] == '^' || string[idx] == '>') {
            align = string[idx++] as AlignDirection;
        }
        // Force sign
        if (string[idx] == '+' || string[idx] == '-') force_sign = string[idx++] as Sign;
        // Pretty formatting
        if (string[idx] == '#') pretty = true, idx++;
        // Padding numbers with zeroes
        if (string[idx] == '0') pad_zeroes = true, idx++;
        // Width
        if (is_digit(string[idx])) {
            let width_substring_start = idx++;
            while (is_digit(string[idx])) idx++;
            width = Number(string.substring(width_substring_start, idx));
        } else if (idx == string.length) {
            // Grab the next parameter and fuse the string with the next one
            width = params[i];
            if (typeof width != 'number') throw error(i - 1, idx, `Expected a number or number parameter for width specifier (found ${string[idx] ? "'" + string[idx] + "'" : typeof width + ' parameter'}).\nIf the next parameter was not meant to be a width number, add a : to the end of the formatting specifier.`);
            string += strings[++i];
        }
        // Precision
        if (string[idx] == '.') {
            if (!is_digit(string[++idx])) {
                // Grab the next parameter and fuse the string with the next one
                precision = params[i];
                if (typeof precision != 'number') throw error(i - 1, idx, `Expected a number or number parameter for precision specifier after . (found ${string[idx] ? "'" + string[idx] + "'" : typeof width + ' parameter'}).\nIf the next parameter was not meant to be a precision number, add a : to the end of the formatting specifier.`);
                string += strings[++i];
            } else {
                let precision_substring_start = idx;
                while (is_digit(string[idx])) idx++;
                precision = Number(string.substring(precision_substring_start, idx));
            }
        }
        // Format type
        switch (string[idx]) {
            case '?':
            case 'o':
            case 'x':
            case 'X':
            case 'b':
            case 'e':
            case 'E':
            case 'n':
            case 'N':
                format_type = string[idx++] as FormatType;
        }
        // End of specifier
        if (string[idx] == ':') {
            idx++;
        } else if (string[idx] != ' '
            && string[idx] != '\t'
            && string[idx] != '\r'
            && string[idx] != '\n'
            && string[idx] !== undefined) {
            throw error(i - 1, idx, `Expected colon (':') or space character (' '/'\\t'/'\\r'/'\\n') at end of formatting specifier (found '${string[idx]}')`);
        }

        // Format parameter according to specifier
        let formatted = formatParam(param, {
            fill,
            align,
            force_sign,
            pretty,
            pad_zeroes,
            width,
            precision,
            type: format_type
        });
        let escaped_string = string.substring(idx);
        colored += formatted + escaped_string;
        if (format_type == '?') formatted = util.stripVTControlCharacters(formatted);
        raw += formatted + escaped_string;
    }

    return { raw, colored };
}

type AlignDirection = '<' | '^' | '>';
type Sign = '-' | '+' | '';
type FormatType = '?' | 'o' | 'x' | 'X' | 'b' | 'e' | 'E' | 'n' | 'N' | '';
type FormatSpecifier = {
    fill: string,
    align: AlignDirection,
    force_sign: Sign,
    pretty: boolean,
    pad_zeroes: boolean,
    width: number,
    precision: number,
    type: FormatType;
}
/**
 * Format a parameter as a string according to a specifier.
 * Will include colors in the output of debug formating
 * 
 * @param param parameter to format
 * @param format format specifier object
 * @param debugColors whether to use colors in debug formatting
 * @returns `param` as a formatted string
 */
export function formatParam(param: any, format: FormatSpecifier): string {
    let param_type = typeof param;

    // Process parameter type
    switch (format.type) {
        case 'o': param = param.toString(8); break;
        case 'x': param = param.toString(16); break;
        case 'X': param = param.toString(16).toUpperCase(); break;
        case 'b': param = param.toString(2); break;
        case 'e':
        case 'E':
            if (param_type != 'number' && param_type != 'bigint') {
                param = param.toString();
                break;
            }
            param = param.toLocaleString('en-US', { notation: 'scientific', maximumFractionDigits: 20 });
            if (format.type == 'e') param = param.toLowercase();
            break;
        case 'n':
        case 'N':
            if (param_type != 'number' && param_type != 'bigint') {
                param = param.toString();
                break;
            }
            // Round and add suffix
            if (param_type == 'number') param = Math.round(param);
            param = param.toString();
            let last_2_digits = param.substring(param.length - 2);
            if (last_2_digits == '11' || last_2_digits == '12' || last_2_digits == '13') {
                param = param + 'th';
            } else switch (last_2_digits[last_2_digits.length - 1]) {
                case '1': param = param + 'st'; break;
                case '2': param = param + 'nd'; break;
                case '3': param = param + 'rd'; break;
                default: param = param + 'th';
            }
            if (format.type == 'N') param = param.toUpperCase();
            // Do not pad with zeroes or align to precision when using ordinal formatting
            format.pad_zeroes = false;
            format.precision = -1;
            break;
        case '?':
            param = util.inspect(param, {
                depth: Infinity,
                colors: true,
                compact: !format.pretty
            });
            // Do not force sign, pad with zeroes or align to precision when using debug formatting
            param_type = 'string';
            break;
        default: param = param.toString(); break;
    };
    // Compute radix-point precision on numbers
    if (param_type == 'number' && format.precision != -1) {
        let [pre, post] = (param as string).split('.');
        if (!format.precision) { // precision = 0, do not include radix point
            param = pre;
        } else {
            post = ((post || '') + '0'.repeat(format.precision)).slice(0, format.precision);
            param = pre + '.' + post;
        }
    }

    // let filled = false;
    if ((param_type == 'number') || (param_type == 'bigint')) {
        // Compute parameter sign
        let maybe_sign = (param as string).substring(0, 1);
        if (maybe_sign === '-') {
            param = (param as string).substring(1, param.length);
        } else if (format.force_sign == '+') {
            maybe_sign = '+';
        } else if (format.force_sign == '-') {
            maybe_sign = ' ';
        } else {
            maybe_sign = '';
        }
        // If pretty printing is enabled and the formating calls for a prefix, add it
        if (format.pretty) {
            switch (format.type) {
                case 'o':
                    maybe_sign += '0o';
                    break;
                case 'x':
                case 'X':
                    maybe_sign += '0x';
                    break;
                case 'b':
                    maybe_sign += '0b';
                    break;
            }
        }
        //pad with zeroes if specified  
        if (format.pad_zeroes) {
            // filled = true;
            while (param.length < format.width - maybe_sign.length) {
                param = '0' + param;
            }
        }
        param = maybe_sign + param;
    }
    if (/*!filled && */ format.width > param.length) {
        // Compute fill/align
        let left = '';
        let right = '';
        let diff = format.width - param.length;

        switch (format.align) {
            case '>': left = format.fill.repeat(diff); break;
            case '<': right = format.fill.repeat(diff); break;
            case '^':
                left = format.fill.repeat(diff - diff / 2);
                // Prioritise right-aligment on uneven length
                right = format.fill.repeat(diff / 2 + diff % 2);
                break;
        }
        param = left + param + right;
    }
    return param;
}