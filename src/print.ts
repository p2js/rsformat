import { Writable } from 'node:stream';
import process from 'node:process';
import { fmt_raw } from './format';

export function Printer(outStream: Writable = process.stdout, errStream: Writable = process.stderr, options = { debugColors: true }) {
    return {
        /**
         * Print a format string to an output stream (usually process.stdout).
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        print: function print(format_string: string, ...params: any[]) {
            outStream.write(fmt_raw(format_string, params, { colors: options.debugColors }));
        },
        /**
         * Print a format string to an output stream (usually process.stdout)
         * and append a newline.
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        println: function println(format_string: string, ...params: any[]) {
            outStream.write(fmt_raw(format_string, params, { colors: options.debugColors }) + '\n');
        },
        /**
         * Print a format string to an error stream (usually process.stderr).
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        eprint: function eprint(format_string: string, ...params: any[]) {
            errStream.write(fmt_raw(format_string, params, { colors: options.debugColors }));
        },
        /**
         * Print a format string to an error stream (usually process.stderr)
         * and append a newline.
         * 
         * @param format_string String used for formatting
         * @param params Parameters to be inserted into the format string
         */
        eprintln: function eprintln(format_string: string, ...params: any[]) {
            errStream.write(fmt_raw(format_string, params, { colors: options.debugColors }) + '\n');
        },
    }
}

export const { print, println, eprint, eprintln } = Printer();