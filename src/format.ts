import { inspect } from 'node:util';

const is_digit = (c: string) => c >= '0' && c <= '9';
const error = (param: number, char: number, reason: string) => new Error(`rs[param ${param}, char ${char}] ${reason}`);

let debugColors = false;
export function setDebugColors(b: boolean) { debugColors = b };

export class RsString extends String {
    private cachedColor: string | null = null;
    private cachedPlain: string | null = null;
    private strings: TemplateStringsArray;
    private params: any[];

    constructor(strings: TemplateStringsArray, params: any[]) {
        super('');
        this.strings = strings;
        this.params = params;
    }

    override toString(): string {
        if (debugColors) {
            if (this.cachedColor === null) this.cachedColor = buildString(this.strings, this.params);
            return this.cachedColor;
        } else {
            if (this.cachedPlain === null) this.cachedPlain = buildString(this.strings, this.params);
            return this.cachedPlain;
        };
    }
    override valueOf(): string {
        return this.toString();
    }
}

export function buildString(strings: TemplateStringsArray, params: any[]): string {
    let out = [strings[0]];
    for (let i = 1; i < strings.length; ++i) {
        let string = strings[i];
        let param = params[i - 1];

        while (typeof param == 'object' && '__rs_param_ref' in param) {
            let ref_number = param.__rs_param_ref;
            if (typeof ref_number != 'number'
                || ref_number < 0 || ref_number >= params.length) {
                throw new Error(`Parameter ${i - 1}: Invalid reference`);
            }
            if (ref_number == i - 1) throw new Error(`Parameter ${i - 1} references itself recursively`)
            param = params[param.__rs_param_ref];
        }

        let format = parse_format_specifier(string, i - 1);

        if ('doNotFormat' in format) {
            out.push(param.toString() + string.substring(format.end));
            continue;
        }

        let formatted = format_param(param, format, debugColors);

        out.push(formatted + string.substring(format.end));
    }
    return out.join('');
}

type DoNotFormat = { end: number, doNotFormat: true }
type AlignDirection = '<' | '^' | '>';
type FormatType = '?' | 'o' | 'x' | 'X' | 'b' | 'e' | 'E' | '';
type FormatSpecifier = {
    end: number,
    fill: string,
    align: AlignDirection,
    force_sign: boolean,
    pretty: boolean,
    pad_zeroes: boolean,
    width: number,
    precision: number,
    type: FormatType;
}

export function parse_format_specifier(string: string, param_number: number): DoNotFormat | FormatSpecifier {
    // If the string starts with a single : it has a format specifier,
    // If it has two the first : is being escaped and can be removed
    if (string[0] == ':') {
        if (string[1] == ':') {
            return { end: 1, doNotFormat: true };
        }
    } else {
        return { end: 0, doNotFormat: true };
    };
    // Keep track of our index in the string to slice the format specifier later
    let idx = 1;
    // Compute format based on string
    let fill = ' ',
        align = '>' as AlignDirection,
        force_sign = false,
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
    if (string[idx] == '+') force_sign = true, idx++;
    // Pretty formatting
    if (string[idx] == '#') pretty = true, idx++;
    // Padding numbers with zeroes
    if (string[idx] == '0') pad_zeroes = true, idx++;
    // Width
    if (is_digit(string[idx])) {
        let width_substring_start = idx++;
        while (is_digit(string[idx])) idx++;
        width = Number(string.substring(width_substring_start, idx));
    }
    // Precision
    if (string[idx] == '.') {
        if (!is_digit(string[++idx])) throw error(param_number, idx, `Expected a number after precision specifier . (found '${string[idx]}')`);
        let precision_substring_start = idx;
        while (is_digit(string[idx])) idx++;
        precision = Number(string.substring(precision_substring_start, idx));
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
            format_type = string[idx++] as FormatType;
    }
    // End
    if (string[idx] == ':') {
        idx++;
    } else if (string[idx] != ' ' && string[idx] !== undefined) {
        throw error(param_number, idx, `Expected colon (':') or space (' ') at end of formatting specifier (found '${string[idx]}')`);
    }

    return {
        end: idx,
        fill,
        align,
        force_sign,
        pretty,
        pad_zeroes,
        width,
        precision,
        type: format_type
    };
}

export function format_param(param: any, format: FormatSpecifier, debugColors: boolean): string {
    let param_type = typeof param;
    let true_length = -1;

    // Process parameter type
    switch (format.type) {
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
            format.force_sign = false;
            format.pad_zeroes = false;
            format.precision = -1;
            true_length = inspect(param, {
                depth: Infinity,
                colors: false,
                compact: !format.pretty
            }).length;
            param = inspect(param, {
                depth: Infinity,
                colors: debugColors,
                compact: !format.pretty
            });
            break;
        default: param = param.toString(); break;
    };
    if (true_length == -1) {
        true_length = param.length;
    }

    // Compute radix-point precision on numbers
    if (param_type == 'number' && format.precision != -1) {
        let [pre, post] = (param as string).split('.');
        if (!format.precision) { // precision = 0, do not include radix point
            param = pre;
        } else {
            post = ((post || '') + '0'.repeat(format.precision)).slice(0, format.precision);
            param = pre + '.' + post;
        }
        // Update true length for fill/align
        true_length = param.length;
    }

    let filled = false;

    if ((param_type == 'number') || (param_type == 'bigint')) {
        // Compute parameter sign
        let maybe_sign = (param as string).substring(0, 1);
        if (maybe_sign === '-') {
            param = (param as string).substring(1, param.length);
        } else if (format.force_sign) {
            maybe_sign = '+';
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
            filled = true;
            while (param.length < format.width - maybe_sign.length) {
                param = '0' + param;
                true_length++;
            }
        }

        true_length += maybe_sign.length;
        param = maybe_sign + param;
    }
    if (!filled && format.width > true_length) {
        // Compute fill/align
        let left = '';
        let right = '';
        let diff = format.width - true_length;

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